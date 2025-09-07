import { execa } from 'execa';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';

export interface DeployApiOptions {
  projectId?: string;
  environment?: string;
  tag?: string;
  dryRun?: boolean;
  deployToCloudRun?: boolean;
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
    deployToCloudRun = false
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
      spinner.start('Deploying to Cloud Run...');
      if (!dryRun) {
        const serviceName = `${imageName}-${environment}`;
        await execa('gcloud', [
          'run', 'deploy', serviceName,
          '--image', gcrImageLatest,
          '--platform', 'managed',
          '--region', 'us-central1',
          '--allow-unauthenticated',
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