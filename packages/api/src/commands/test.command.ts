import { Command, CommandRunner } from 'nest-commander';

@Command({
  name: 'test',
  description: 'Test command to verify CLI is working',
})
export class TestCommand extends CommandRunner {
  async run(): Promise<void> {
    console.log('✅ CLI is working!');
  }
}
