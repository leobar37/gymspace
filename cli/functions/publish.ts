import { execa } from 'execa';
import chalk from 'chalk';
import ora from 'ora';
import { PACKAGES, PublishOptions } from '../shared.js';

/**
 * Publishes packages to npm registry with synchronized versioning
 */
export async function publishPackages(options: PublishOptions): Promise<void> {
  const { version, dryRun = false, tag = 'latest' } = options;

  console.log(chalk.blue('\n📦 Publishing packages to npm registry\n'));

  if (dryRun) {
    console.log(chalk.yellow('⚠️ Running in dry-run mode - no changes will be made\n'));
  }

  // Step 1: Update version for all packages
  const spinner = ora('Updating package versions...').start();

  try {
    for (const pkg of PACKAGES) {
      spinner.text = `Updating version for ${pkg.name}...`;

      const versionArgs = ['version', version, '--no-git-tag-version'];
      if (!dryRun) {
        await execa('npm', versionArgs, {
          cwd: pkg.path,
          stdio: 'pipe',
        });
      }

      console.log(chalk.green(`✓ ${pkg.name} version updated`));
    }

    spinner.succeed('All package versions updated successfully');
  } catch (error) {
    spinner.fail('Failed to update package versions');
    throw error;
  }

  // Step 2: Build packages
  spinner.start('Building packages...');

  try {
    for (const pkg of PACKAGES) {
      spinner.text = `Building ${pkg.name}...`;

      if (!dryRun) {
        await execa('pnpm', ['run', 'build'], {
          cwd: pkg.path,
          stdio: 'pipe',
        });
      }

      console.log(chalk.green(`✓ ${pkg.name} built successfully`));
    }

    spinner.succeed('All packages built successfully');
  } catch (error) {
    spinner.fail('Failed to build packages');
    throw error;
  }

  // Step 3: Publish packages
  spinner.start('Publishing packages to npm...');

  try {
    for (const pkg of PACKAGES) {
      spinner.text = `Publishing ${pkg.name}...`;

      const publishArgs = ['publish', '--access', 'public', '--tag', tag];
      if (dryRun) {
        publishArgs.push('--dry-run');
      }

      await execa('npm', publishArgs, {
        cwd: pkg.path,
        stdio: 'pipe',
      });

      console.log(chalk.green(`✓ ${pkg.name} published successfully`));
    }

    spinner.succeed('All packages published successfully');
  } catch (error) {
    spinner.fail('Failed to publish packages');
    throw error;
  }

  console.log(chalk.green('\n🎉 Deployment completed successfully!\n'));
}