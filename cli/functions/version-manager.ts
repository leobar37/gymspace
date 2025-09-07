import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { PACKAGES, CONSUMER_APPS, PackageVersions } from '../shared.js';

/**
 * Higher-order function to manage package versions in consumer apps
 * Returns two functions: toVersions (updates to specific versions) and toWorkspace (updates to workspace:*)
 */
export function createVersionManager() {
  /**
   * Get current versions of published packages
   */
  async function getPackageVersions(): Promise<PackageVersions> {
    const versions: PackageVersions = {};

    for (const pkg of PACKAGES) {
      const packageJsonPath = path.join(pkg.path, 'package.json');
      const packageContent = await fs.readFile(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(packageContent);
      versions[pkg.name] = packageJson.version;
    }

    return versions;
  }

  /**
   * Update package.json dependencies
   */
  async function updateDependencies(
    appPath: string,
    updateFn: (dep: string) => string | undefined
  ): Promise<void> {
    const packageJsonPath = path.join(appPath, 'package.json');
    const packageContent = await fs.readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(packageContent);

    let hasChanges = false;

    // Update dependencies
    if (packageJson.dependencies) {
      for (const [dep, version] of Object.entries(packageJson.dependencies)) {
        const newVersion = updateFn(dep);
        if (newVersion && newVersion !== version) {
          packageJson.dependencies[dep] = newVersion;
          hasChanges = true;
          console.log(chalk.cyan(`  Updated ${dep}: ${version} → ${newVersion}`));
        }
      }
    }

    // Update devDependencies
    if (packageJson.devDependencies) {
      for (const [dep, version] of Object.entries(packageJson.devDependencies)) {
        const newVersion = updateFn(dep);
        if (newVersion && newVersion !== version) {
          packageJson.devDependencies[dep] = newVersion;
          hasChanges = true;
          console.log(chalk.cyan(`  Updated ${dep}: ${version} → ${newVersion} (dev)`));
        }
      }
    }

    if (hasChanges) {
      await fs.writeFile(
        packageJsonPath,
        JSON.stringify(packageJson, null, 2) + '\n',
        'utf-8'
      );
    }
  }

  /**
   * Update consumer apps to use specific package versions
   */
  async function toVersions(): Promise<void> {
    const spinner = ora('Updating consumer apps to use specific versions...').start();

    try {
      const versions = await getPackageVersions();

      for (const app of CONSUMER_APPS) {
        spinner.text = `Updating ${app.name}...`;
        console.log(chalk.blue(`\nUpdating ${app.name}:`));

        await updateDependencies(app.path, (dep) => {
          if (versions[dep]) {
            return `^${versions[dep]}`;
          }
          return undefined;
        });
      }

      spinner.succeed('Consumer apps updated to use specific versions');
    } catch (error) {
      spinner.fail('Failed to update consumer apps');
      throw error;
    }
  }

  /**
   * Update consumer apps to use workspace protocol
   */
  async function toWorkspace(): Promise<void> {
    const spinner = ora('Updating consumer apps to use workspace protocol...').start();

    try {
      const packageNames = PACKAGES.map(pkg => pkg.name);

      for (const app of CONSUMER_APPS) {
        spinner.text = `Updating ${app.name}...`;
        console.log(chalk.blue(`\nUpdating ${app.name}:`));

        await updateDependencies(app.path, (dep) => {
          if (packageNames.includes(dep)) {
            return 'workspace:*';
          }
          return undefined;
        });
      }

      spinner.succeed('Consumer apps updated to use workspace protocol');
    } catch (error) {
      spinner.fail('Failed to update consumer apps');
      throw error;
    }
  }

  return { toVersions, toWorkspace };
}