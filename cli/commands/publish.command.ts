import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { VersionType } from '../shared.js';
import { publishPackages } from '../functions/publish.js';

export function createPublishCommand(): Command {
  const command = new Command('publish');
  
  return command
    .description('Publish SDK and Shared packages to npm (without version sync)')
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
        const { confirmPublish } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirmPublish',
            message: `Are you sure you want to ${options.dryRun ? 'simulate' : 'execute'} publishing with ${versionType} version bump?`,
            default: false,
          },
        ]);

        if (!confirmPublish) {
          console.log(chalk.yellow('\n❌ Publishing cancelled\n'));
          process.exit(0);
        }

        // Execute publish only
        await publishPackages({
          version: versionType as VersionType,
          dryRun: options.dryRun,
          tag: options.tag,
        });
        
        console.log(chalk.blue('\n💡 Tip: Run "pnpm sync:versions" to update consumer apps with the new versions\n'));
      } catch (error) {
        console.error(chalk.red('\n❌ Publishing failed:'), error);
        process.exit(1);
      }
    });
}