#!/usr/bin/env node

import { Command } from 'commander';
import {
  createDeployCommand,
  createPublishCommand,
  createSyncCommand,
  createDeployApiCommand,
  createLocalApkCommand
} from './commands/index.js';

/**
 * Main CLI program
 */
const program = new Command();

program
  .name('gymspace-cli')
  .description('GymSpace CLI for monorepo management and package deployment')
  .version('1.0.0');

// Register commands
program.addCommand(createDeployCommand());
program.addCommand(createPublishCommand());
program.addCommand(createSyncCommand());
program.addCommand(createDeployApiCommand());
program.addCommand(createLocalApkCommand());

// Parse command line arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}