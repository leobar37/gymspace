import { execa } from 'execa';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import * as readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';

export interface DeployApiOptions {
  projectId?: string;
  environment?: string;
  tag?: string;
  dryRun?: boolean;
  deployToCloudRun?: boolean;
}

/**
 * Ensure Cloud Run service and Doppler secret exist
 */
async function ensureCloudRunAndSecret(
  projectId: string,
  serviceName: string,
  environment: string
): Promise<void> {
  const spinner = ora();
  const secretName = `doppler-token-${environment}`;
  const region = 'us-central1';

  try {
    // Check if Cloud Run service exists
    spinner.start(`Checking if Cloud Run service '${serviceName}' exists...`);
    let serviceExists = false;
    
    try {
      await execa('gcloud', [
        'run', 'services', 'describe', serviceName,
        '--region', region,
        '--project', projectId,
        '--format', 'value(name)'
      ], { stdio: 'pipe' });
      serviceExists = true;
      spinner.succeed(`Cloud Run service '${serviceName}' already exists`);
    } catch {
      spinner.warn(`Cloud Run service '${serviceName}' does not exist`);
    }

    // Check if Doppler secret exists
    spinner.start(`Checking if secret '${secretName}' exists...`);
    let secretExists = false;
    
    try {
      await execa('gcloud', [
        'secrets', 'describe', secretName,
        '--project', projectId,
        '--format', 'value(name)'
      ], { stdio: 'pipe' });
      secretExists = true;
      spinner.succeed(`Secret '${secretName}' already exists`);
    } catch {
      spinner.warn(`Secret '${secretName}' does not exist`);
    }

    // Create secret if it doesn't exist
    if (!secretExists) {
      console.log(chalk.yellow('\n⚠️  Doppler token secret not found\n'));
      
      const rl = readline.createInterface({ input, output });
      let dopplerToken = '';
      let isValid = false;
      
      while (!isValid) {
        dopplerToken = await rl.question(chalk.cyan('Enter your Doppler token (dp.st.xxx): '));
        
        if (!dopplerToken) {
          console.log(chalk.red('Doppler token is required'));
        } else if (!dopplerToken.startsWith('dp.st.')) {
          console.log(chalk.red('Invalid Doppler token format (should start with dp.st.)'));
        } else {
          isValid = true;
        }
      }
      
      rl.close();

      spinner.start(`Creating secret '${secretName}'...`);
      
      // Create the secret
      await execa('gcloud', [
        'secrets', 'create', secretName,
        '--project', projectId,
        '--replication-policy', 'automatic'
      ], { stdio: 'pipe' });

      // Add secret version with the token value
      const { stdout } = await execa('echo', ['-n', dopplerToken]);
      await execa('gcloud', [
        'secrets', 'versions', 'add', secretName,
        '--project', projectId,
        '--data-file', '-'
      ], { 
        input: stdout,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      spinner.succeed(`Secret '${secretName}' created successfully`);
      
      // Grant Cloud Run service account access to the secret
      spinner.start('Granting Cloud Run service account access to the secret...');
      
      // Get the project number for the service account
      const { stdout: projectNumber } = await execa('gcloud', [
        'projects', 'describe', projectId,
        '--format', 'value(projectNumber)'
      ], { stdio: 'pipe' });
      
      const serviceAccount = `${projectNumber.trim()}-compute@developer.gserviceaccount.com`;
      
      await execa('gcloud', [
        'secrets', 'add-iam-policy-binding', secretName,
        '--member', `serviceAccount:${serviceAccount}`,
        '--role', 'roles/secretmanager.secretAccessor',
        '--project', projectId
      ], { stdio: 'pipe' });
      
      spinner.succeed(`Granted access to service account: ${serviceAccount}`);
    }

    // Create Cloud Run service if it doesn't exist
    if (!serviceExists) {
      spinner.start(`Creating Cloud Run service '${serviceName}'...`);
      
      // Note: This creates a placeholder service. The actual image will be deployed later
      await execa('gcloud', [
        'run', 'deploy', serviceName,
        '--image', 'gcr.io/cloudrun/placeholder',
        '--platform', 'managed',
        '--region', region,
        '--allow-unauthenticated',
        '--memory', '512Mi',
        '--cpu', '1',
        '--min-instances', '0',
        '--max-instances', '10',
        '--port', '5200',
        '--set-secrets', `DOPPLER_TOKEN=${secretName}:latest`,
        '--set-env-vars', `NODE_ENV=${environment},GCP_PROJECT_ID=${projectId},GCP_REGION=${region}`,
        '--project', projectId
      ], { stdio: 'pipe' });

      spinner.succeed(`Cloud Run service '${serviceName}' created successfully`);
      console.log(chalk.yellow('Note: Service created with placeholder image. It will be updated during deployment.'));
    }
    
    // Always ensure service account has access to the secret
    if (secretExists) {
      spinner.start('Ensuring Cloud Run service account has access to the secret...');
      
      // Get the project number for the service account
      const { stdout: projectNumber } = await execa('gcloud', [
        'projects', 'describe', projectId,
        '--format', 'value(projectNumber)'
      ], { stdio: 'pipe' });
      
      const serviceAccount = `${projectNumber.trim()}-compute@developer.gserviceaccount.com`;
      
      // Add IAM binding (idempotent operation)
      await execa('gcloud', [
        'secrets', 'add-iam-policy-binding', secretName,
        '--member', `serviceAccount:${serviceAccount}`,
        '--role', 'roles/secretmanager.secretAccessor',
        '--project', projectId
      ], { stdio: 'pipe' });
      
      spinner.succeed(`Service account ${serviceAccount} has access to the secret`);
    }
    
    if (serviceExists) {
      // Update existing service to ensure it has the Doppler secret
      spinner.start(`Updating Cloud Run service to ensure Doppler secret is configured...`);
      
      await execa('gcloud', [
        'run', 'services', 'update', serviceName,
        '--region', region,
        '--update-secrets', `DOPPLER_TOKEN=${secretName}:latest`,
        '--project', projectId
      ], { stdio: 'pipe' });

      spinner.succeed(`Cloud Run service '${serviceName}' updated with Doppler secret`);
    }

    console.log(chalk.green('\n✅ Cloud Run service and Doppler secret are ready!\n'));

  } catch (error) {
    spinner.fail('Failed to ensure Cloud Run and secret setup');
    throw error;
  }
}

/**
 * Deploy API to Google Cloud Run
 */
export async function deployApi(options: DeployApiOptions): Promise<void> {
  const {
    projectId = 'meta-episode-466920-h4',
    environment = 'production',
    tag = 'latest',
    dryRun = false,
    deployToCloudRun = true
  } = options;

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const imageName = 'gymspace-api';
  const gcrHostname = 'gcr.io';
  
  // Image URLs
  const gcrImageBase = `${gcrHostname}/${projectId}/${imageName}`;
  const gcrImageLatest = `${gcrImageBase}:${environment}`;
  const gcrImageVersion = `${gcrImageBase}:${environment}-${timestamp}`;
  const gcrImageCustom = tag !== 'latest' ? `${gcrImageBase}:${tag}` : null;

  console.log(chalk.blue('\n🚀 Deploying API to Google Cloud Run\n'));
  console.log(chalk.gray(`Project ID: ${projectId}`));
  console.log(chalk.gray(`Environment: ${environment}`));
  console.log(chalk.gray(`Image: ${gcrImageLatest}\n`));

  if (dryRun) {
    console.log(chalk.yellow('⚠️  Running in dry-run mode - no changes will be made\n'));
  }

  const spinner = ora();

  try {
    // Step 1: Check gcloud authentication
    spinner.start('Checking Google Cloud authentication...');
    if (!dryRun) {
      await execa('gcloud', ['auth', 'list'], { stdio: 'pipe' });
    }
    spinner.succeed('Google Cloud authentication verified');

    // Step 2: Configure Docker for GCR
    spinner.start('Configuring Docker for Google Container Registry...');
    if (!dryRun) {
      await execa('gcloud', ['auth', 'configure-docker', gcrHostname], { stdio: 'pipe' });
    }
    spinner.succeed('Docker configured for GCR');

    // Step 3: Build Docker image
    spinner.start('Building Docker image...');
    if (!dryRun) {
      const dockerfilePath = path.join('packages', 'api', 'Dockerfile');
      await execa('docker', [
        'build',
        '-f', dockerfilePath,
        '-t', gcrImageLatest,
        '-t', gcrImageVersion,
        ...(gcrImageCustom ? ['-t', gcrImageCustom] : []),
        '--platform', 'linux/amd64',
        '.'
      ], { 
        stdio: 'pipe'
      });
    }
    spinner.succeed('Docker image built successfully');

    // Step 4: Push image to GCR
    spinner.start('Pushing image to Google Container Registry...');
    if (!dryRun) {
      // Push latest tag
      await execa('docker', ['push', gcrImageLatest], { stdio: 'pipe' });
      console.log(chalk.green(`  ✓ Pushed: ${gcrImageLatest}`));
      
      // Push versioned tag
      await execa('docker', ['push', gcrImageVersion], { stdio: 'pipe' });
      console.log(chalk.green(`  ✓ Pushed: ${gcrImageVersion}`));
      
      // Push custom tag if provided
      if (gcrImageCustom) {
        await execa('docker', ['push', gcrImageCustom], { stdio: 'pipe' });
        console.log(chalk.green(`  ✓ Pushed: ${gcrImageCustom}`));
      }
    }
    spinner.succeed('Image pushed to registry');

    // Step 5: Deploy to Cloud Run (optional)
    if (deployToCloudRun) {
      const serviceName = `${imageName}-${environment}`;
      
      // Ensure Cloud Run service and Doppler secret exist
      if (!dryRun) {
        await ensureCloudRunAndSecret(projectId, serviceName, environment);
      }
      
      spinner.start('Deploying to Cloud Run...');
      if (!dryRun) {
        const secretName = `doppler-token-${environment}`;
        await execa('gcloud', [
          'run', 'deploy', serviceName,
          '--image', gcrImageLatest,
          '--platform', 'managed',
          '--region', 'us-central1',
          '--allow-unauthenticated',
          '--memory', '512Mi',
          '--cpu', '1',
          '--min-instances', '0',
          '--max-instances', '10',
          '--port', '3000',
          '--set-secrets', `DOPPLER_TOKEN=${secretName}:latest`,
          '--set-env-vars', `NODE_ENV=production,GCP_PROJECT_ID=${projectId},GCP_REGION=us-central1`,
          '--project', projectId
        ], { stdio: 'pipe' });
      }
      spinner.succeed('Deployed to Cloud Run successfully');
    } else {
      console.log(chalk.yellow('\n⚠️  Skipping Cloud Run deployment (use --cloud-run flag to deploy)\n'));
    }

    // Print deployment summary
    console.log(chalk.green('\n🎉 Docker image build and push completed successfully!\n'));
    
    // Always print the image URLs
    console.log(chalk.blue('📦 Docker Image URLs:\n'));
    console.log(chalk.white('Latest tag:'));
    console.log(chalk.cyan(`  ${gcrImageLatest}\n`));
    
    console.log(chalk.white('Versioned tag:'));
    console.log(chalk.cyan(`  ${gcrImageVersion}\n`));
    
    if (gcrImageCustom) {
      console.log(chalk.white('Custom tag:'));
      console.log(chalk.cyan(`  ${gcrImageCustom}\n`));
    }
    
    // Print pull command
    console.log(chalk.blue('🐳 To pull this image:'));
    console.log(chalk.gray(`  docker pull ${gcrImageLatest}\n`));
    
    if (deployToCloudRun) {
      console.log(chalk.green('☁️  Cloud Run deployment completed!'));
    } else {
      console.log(chalk.yellow('💡 To deploy to Cloud Run, run with --cloud-run flag'));
    }

  } catch (error) {
    spinner.fail('Deployment failed');
    throw error;
  }
}