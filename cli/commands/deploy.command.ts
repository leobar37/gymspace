import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { VersionType } from '../shared.js';
import { publishPackages } from '../functions/publish.js';
import { createVersionManager } from '../functions/version-manager.js';

export function createDeployCommand(): Command {
  const command = new Command('deploy');
  
  return command
    .description('Deploy packages to npm and sync all dependencies in the repository')
    .option('-d, --dry-run', 'Perform a dry run without making changes')
    .option('-t, --tag <tag>', 'Publish with a specific npm tag', 'latest')
    .action(async (options) => {
      try {
        // Prompt for version type
        const { versionType } = await inquirer.prompt([
          {
            type: 'list',
            name: 'versionType',
            message: 'Select version bump type:',
            choices: [
              { name: 'Patch (1.0.0 -> 1.0.1)', value: 'patch' },
              { name: 'Minor (1.0.0 -> 1.1.0)', value: 'minor' },
              { name: 'Major (1.0.0 -> 2.0.0)', value: 'major' },
            ],
          },
        ]);

        // Confirm deployment
        const { confirmDeploy } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirmDeploy',
            message: `Are you sure you want to ${options.dryRun ? 'simulate' : 'execute'} deployment with ${versionType} version bump?`,
            default: false,
          },
        ]);

        if (!confirmDeploy) {
          console.log(chalk.yellow('\n❌ Deployment cancelled\n'));
          process.exit(0);
        }

        // Step 1: Execute publish
        console.log(chalk.blue('\n📦 Step 1: Publishing packages...\n'));
        await publishPackages({
          version: versionType as VersionType,
          dryRun: options.dryRun,
          tag: options.tag,
        });

        // Step 2: Sync all dependencies in the repo (if not dry run)
        if (!options.dryRun) {
          console.log(chalk.blue('\n🔄 Step 2: Synchronizing dependencies across the repository...\n'));
          const versionManager = createVersionManager();
          await versionManager.toVersions();
          console.log(chalk.green('\n✅ All dependencies have been synchronized!\n'));
        } else {
          console.log(chalk.yellow('\n⚠️  Skipping dependency sync in dry-run mode\n'));
        }
      } catch (error) {
        console.error(chalk.red('\n❌ Deployment failed:'), error);
        process.exit(1);
      }
    });
}