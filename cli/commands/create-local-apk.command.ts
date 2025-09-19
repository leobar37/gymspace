import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { buildAndDistributeApk } from '../functions/index.js';

export function createLocalApkCommand(): Command {
  const command = new Command('create-local-apk');

  return command
    .description('Build Android APK locally and distribute via Firebase App Distribution')
    .option('-r, --release-notes <notes>', 'Release notes for the distribution')
    .option('-d, --dry-run', 'Perform a dry run without building or distributing')
    .action(async (options) => {
      try {
        let releaseNotes = options.releaseNotes;

        // Prompt for release notes if not provided
        if (!releaseNotes) {
          const { notes } = await inquirer.prompt([
            {
              type: 'input',
              name: 'notes',
              message: 'Enter release notes for this build:',
              default: 'Version: 1.0.beta',
              validate: (input) => input.trim().length > 0 || 'Release notes cannot be empty',
            },
          ]);
          releaseNotes = notes;
        }

        // Confirm build and distribution
        const { confirmBuild } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirmBuild',
            message: `${options.dryRun ? 'Simulate' : 'Execute'} local APK build and Firebase distribution?`,
            default: false,
          },
        ]);

        if (!confirmBuild) {
          console.log(chalk.yellow('\n❌ APK build cancelled\n'));
          process.exit(0);
        }

        // Execute build and distribution
        await buildAndDistributeApk({
          releaseNotes,
          dryRun: options.dryRun,
        });

      } catch (error) {
        console.error(chalk.red('\n❌ APK build and distribution failed:'), error);
        process.exit(1);
      }
    });
}