import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { deployApi } from '../functions/deploy-api.js';

export function createDeployApiCommand(): Command {
  const command = new Command('deploy-api');
  
  return command
    .description('Build Docker image and push to Google Container Registry')
    .option('-p, --project <projectId>', 'Google Cloud project ID', 'meta-episode-466920-h4')
    .option('-e, --environment <env>', 'Deployment environment', 'production')
    .option('-t, --tag <tag>', 'Custom image tag', 'latest')
    .option('-c, --cloud-run', 'Deploy to Cloud Run after pushing image', false)
    .option('-d, --dry-run', 'Perform a dry run without making changes')
    .action(async (options) => {
      try {
        // Show deployment configuration
        console.log(chalk.blue('\n📋 Deployment Configuration:\n'));
        console.log(chalk.gray(`  Project ID: ${options.project}`));
        console.log(chalk.gray(`  Environment: ${options.environment}`));
        console.log(chalk.gray(`  Tag: ${options.tag}`));
        console.log(chalk.gray(`  Deploy to Cloud Run: ${options.cloudRun ? 'Yes' : 'No'}`));
        console.log(chalk.gray(`  Dry Run: ${options.dryRun ? 'Yes' : 'No'}\n`));

        // Confirm deployment
        const action = options.cloudRun ? 'build, push and deploy' : 'build and push';
        const { confirmDeploy } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirmDeploy',
            message: `Are you sure you want to ${options.dryRun ? 'simulate' : 'execute'} ${action} to ${options.environment}?`,
            default: false,
          },
        ]);

        if (!confirmDeploy) {
          console.log(chalk.yellow('\n❌ Deployment cancelled\n'));
          process.exit(0);
        }

        // Execute deployment
        await deployApi({
          projectId: options.project,
          environment: options.environment,
          tag: options.tag,
          dryRun: options.dryRun,
          deployToCloudRun: options.cloudRun,
        });

      } catch (error) {
        console.error(chalk.red('\n❌ API deployment failed:'), error);
        process.exit(1);
      }
    });
}