import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

// Configuration
const config = new pulumi.Config();
const gcpConfig = new pulumi.Config("gcp");
const project = gcpConfig.require("project");
const region = gcpConfig.get("region") || "us-central1";

// Get Doppler token from Pulumi config
const dopplerToken = config.requireSecret("dopplerToken");

// Enable required Google Cloud APIs
const enableCloudRun = new gcp.projects.Service("enable-cloud-run", {
    service: "run.googleapis.com",
});

const enableCloudLogging = new gcp.projects.Service("enable-cloud-logging", {
    service: "logging.googleapis.com",
});

// Use the pre-built image from Container Registry (fixed Prisma version)
const imageName = "gcr.io/meta-episode-466920-h4/gymspace-api:production-20250819-101000";

// Create a service account for Cloud Run
const serviceAccount = new gcp.serviceaccount.Account("api-service-account", {
    accountId: `gymspace-api-${pulumi.getStack()}`,
    displayName: "GymSpace API Service Account",
    description: "Service account for GymSpace API Cloud Run service",
});

// Grant necessary permissions to the service account
const loggingWriter = new gcp.projects.IAMMember("api-logging-writer", {
    project: project,
    role: "roles/logging.logWriter",
    member: pulumi.interpolate`serviceAccount:${serviceAccount.email}`,
});

const metricWriter = new gcp.projects.IAMMember("api-metric-writer", {
    project: project,
    role: "roles/monitoring.metricWriter",
    member: pulumi.interpolate`serviceAccount:${serviceAccount.email}`,
});

// Create Cloud Run service
const cloudRunService = new gcp.cloudrun.Service("api-service", {
    name: `gymspace-api-${pulumi.getStack()}`,
    location: region,
    template: {
        spec: {
            serviceAccountName: serviceAccount.email,
            containers: [{
                image: imageName,
                envs: [
                    {
                        name: "NODE_ENV",
                        value: pulumi.getStack() === "prod" ? "production" : "development",
                    },
                    {
                        name: "DOPPLER_TOKEN",
                        value: dopplerToken,
                    },
                    {
                        name: "REDIS_ENABLED",
                        value: "false",
                    },
                    {
                        name: "DATABASE_URL",
                        value: "postgresql://placeholder",
                    },
                    {
                        name: "GOOGLE_CLOUD_PROJECT",
                        value: project,
                    },
                    {
                        name: "API_PREFIX",
                        value: "api/v1",
                    },
                ],
                resources: {
                    limits: {
                        memory: "2Gi",
                        cpu: "2",
                    },
                },
            }],
        },
        metadata: {
            annotations: {
                "autoscaling.knative.dev/maxScale": "10",
                "autoscaling.knative.dev/minScale": "1",
                "run.googleapis.com/execution-environment": "gen2",
            },
        },
    },
    traffics: [{
        percent: 100,
        latestRevision: true,
    }],
}, {
    dependsOn: [enableCloudRun, enableCloudLogging],
});

// Make the service publicly accessible
const iamMember = new gcp.cloudrun.IamMember("api-public-access", {
    service: cloudRunService.name,
    location: cloudRunService.location,
    role: "roles/run.invoker",
    member: "allUsers",
});

// Export the service URL
export const serviceUrl = cloudRunService.statuses[0].url;
export const imageUrl = imageName;
export const projectId = project;
export const deploymentRegion = region;
