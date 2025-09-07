import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { createVersionManager } from '../functions/version-manager.js';

export function createSyncCommand(): Command {
  const command = new Command('sync');
  
  return command
    .description('Sync dependency versions in consumer apps')
    .option('-w, --workspace', 'Update to workspace protocol (workspace:*)')
    .option('-v, --versions', 'Update to specific package versions')
    .action(async (options) => {
      try {
        const versionManager = createVersionManager();

        if (!options.workspace && !options.versions) {
          // Interactive mode
          const { syncMode } = await inquirer.prompt([
            {
              type: 'list',
              name: 'syncMode',
              message: 'Select sync mode:',
              choices: [
                { name: 'Use workspace protocol (development)', value: 'workspace' },
                { name: 'Use specific versions (production)', value: 'versions' },
              ],
            },
          ]);

          if (syncMode === 'workspace') {
            await versionManager.toWorkspace();
          } else {
            await versionManager.toVersions();
          }
        } else if (options.workspace) {
          await versionManager.toWorkspace();
        } else if (options.versions) {
          await versionManager.toVersions();
        }

        console.log(chalk.green('\n✅ Sync completed successfully!\n'));
      } catch (error) {
        console.error(chalk.red('\n❌ Sync failed:'), error);
        process.exit(1);
      }
    });
}