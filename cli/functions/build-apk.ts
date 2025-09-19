import { execa } from 'execa';
import chalk from 'chalk';
import ora from 'ora';
import { access, unlink } from 'fs/promises';
import path from 'path';

export interface BuildApkOptions {
  releaseNotes: string;
  dryRun?: boolean;
}

const MOBILE_DIR = 'packages/mobile';
const APK_NAME = 'test.apk';
const FIREBASE_APP_ID = '1:572140504507:android:a1b2d5438a76cb6a94b09e';
const TESTERS_GROUP = 'testers';

/**
 * Build Android APK locally and distribute via Firebase App Distribution
 */
export async function buildAndDistributeApk(options: BuildApkOptions): Promise<void> {
  const { releaseNotes, dryRun = false } = options;

  console.log(chalk.blue('\n📱 Building Android APK and distributing via Firebase\n'));
  console.log(chalk.gray(`Working directory: ${MOBILE_DIR}`));
  console.log(chalk.gray(`APK output: ${APK_NAME}`));
  console.log(chalk.gray(`Firebase App ID: ${FIREBASE_APP_ID}`));
  console.log(chalk.gray(`Testers group: ${TESTERS_GROUP}`));
  console.log(chalk.gray(`Release notes: ${releaseNotes}\n`));

  if (dryRun) {
    console.log(chalk.yellow('⚠️  Running in dry-run mode - no changes will be made\n'));
  }

  const spinner = ora();
  const apkPath = path.join(MOBILE_DIR, APK_NAME);

  try {
    // Step 1: Validate mobile directory exists
    spinner.start('Checking mobile directory...');
    try {
      await access(MOBILE_DIR);
      spinner.succeed('Mobile directory found');
    } catch (error) {
      spinner.fail(`Mobile directory not found: ${MOBILE_DIR}`);
      throw new Error(`Mobile directory not found: ${MOBILE_DIR}`);
    }

    // Step 2: Build APK locally using EAS
    spinner.start('Building Android APK locally with EAS...');
    if (!dryRun) {
      // Stop spinner to show real-time build logs
      spinner.stop();
      console.log(chalk.blue('\n📱 EAS Build Output:\n'));

      await execa('eas', [
        'build',
        '--platform', 'android',
        '--profile', 'preview',
        '--local',
        '--output', APK_NAME
      ], {
        cwd: MOBILE_DIR,
        stdio: 'inherit' // Show real-time output
      });

      // Verify APK was created
      try {
        await access(apkPath);
        console.log(chalk.green('\n✅ APK build completed successfully'));
      } catch (error) {
        throw new Error(`APK file not found at: ${apkPath}`);
      }
    } else {
      spinner.succeed('APK build simulated');
    }

    // Step 3: Distribute via Firebase App Distribution
    spinner.start('Distributing APK via Firebase App Distribution...');
    if (!dryRun) {
      // Stop spinner to show real-time distribution logs
      spinner.stop();
      console.log(chalk.blue('\n🔥 Firebase Distribution Output:\n'));

      await execa('firebase', [
        'appdistribution:distribute',
        `./${APK_NAME}`,
        '--app', FIREBASE_APP_ID,
        '--groups', TESTERS_GROUP,
        '--release-notes', releaseNotes
      ], {
        cwd: MOBILE_DIR,
        stdio: 'inherit' // Show real-time output
      });

      console.log(chalk.green('\n✅ APK distributed successfully via Firebase'));
    } else {
      spinner.succeed('APK distribution simulated');
    }

    // Step 4: Clean up APK file
    spinner.start('Cleaning up APK file...');
    if (!dryRun) {
      try {
        await unlink(apkPath);
        spinner.succeed(`APK file deleted: ${APK_NAME}`);
      } catch (error) {
        spinner.warn(`Could not delete APK file: ${APK_NAME}`);
        console.log(chalk.yellow('You may need to delete it manually.'));
      }
    } else {
      spinner.succeed('APK cleanup simulated');
    }

    // Print success summary
    console.log(chalk.green('\n🎉 APK build and distribution completed successfully!\n'));

    // Print distribution info
    console.log(chalk.blue('📱 Distribution Details:\n'));
    console.log(chalk.white('Firebase App:'));
    console.log(chalk.cyan(`  ${FIREBASE_APP_ID}\n`));

    console.log(chalk.white('Testers Group:'));
    console.log(chalk.cyan(`  ${TESTERS_GROUP}\n`));

    console.log(chalk.white('Release Notes:'));
    console.log(chalk.cyan(`  ${releaseNotes}\n`));

    if (!dryRun) {
      console.log(chalk.green('✅ Testers will receive a notification to download the new build'));
    } else {
      console.log(chalk.yellow('💡 Run without --dry-run to execute the actual build and distribution'));
    }

  } catch (error) {
    spinner.fail('APK build and distribution failed');

    // Attempt cleanup on error (only if not dry run)
    if (!dryRun) {
      try {
        await access(apkPath);
        await unlink(apkPath);
        console.log(chalk.yellow('🧹 Cleaned up APK file after error'));
      } catch (cleanupError) {
        // Ignore cleanup errors silently
      }
    }

    throw error;
  }
}