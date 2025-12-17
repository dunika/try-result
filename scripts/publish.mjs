#!/usr/bin/env zx
import 'zx/globals'

// Parse command line arguments
const isDryRun = Boolean(argv['dry-run'] ?? argv.dryRun ?? false)
const otp = typeof argv.otp === 'string' ? argv.otp : null
const IS_CI = process.env.CI === 'true'

echo(chalk.blue('\n📦 Publishing result-try package...\n'))

if (isDryRun) {
  echo(chalk.yellow('🔍 DRY RUN MODE - No actual publishing will occur\n'))
}

// Check authentication
if (!IS_CI) {
  echo(chalk.cyan('Step 1: Checking authentication...\n'))
  try {
    const { stdout } = await $`npm whoami`
    echo(chalk.green(`✓ Logged in as: ${stdout.trim()}\n`))
  } catch (_error) {
    if (process.env.NPM_TOKEN) {
      echo(chalk.green('✓ NPM_TOKEN is set\n'))
    } else {
      echo(chalk.red('✗ Authentication failed\n'))
      echo(chalk.bold('Choose an authentication method:\n'))
      echo('  1. ' + chalk.cyan('Interactive Login') + ' (persists across sessions)')
      echo('     Run: ' + chalk.yellow('npm login') + '\n')
      echo('  2. ' + chalk.cyan('Environment Variable') + ' (for automation or temporary use)')
      echo('     Set: ' + chalk.yellow('export NPM_TOKEN=your_token_here'))
      echo('     Get token from: ' + chalk.blue('https://www.npmjs.com/') + ' → Access Tokens\n')
      
      const response = await question(chalk.bold('Would you like to run npm login now? (y/n): '))
      
      if (['y', 'yes'].includes(response.toLowerCase())) {
        echo(chalk.cyan('\n🔐 Starting npm login...\n'))
        await $`npm login`
        
        // Verify login succeeded
        try {
          const { stdout } = await $`npm whoami`
          echo(chalk.green(`\n✓ Successfully logged in as: ${stdout.trim()}\n`))
        } catch (_error) {
          echo(chalk.red('\n✗ Login failed. Please try again.\n'))
          process.exit(1)
        }
      } else {
        echo(chalk.yellow('\n⚠ Skipping authentication. Please authenticate and try again.\n'))
        process.exit(1)
      }
    }
  }
} else {
  echo(chalk.cyan('Step 1: Running in CI environment\n'))
  if (process.env.NODE_AUTH_TOKEN || process.env.NPM_TOKEN) {
    echo(chalk.green('✓ NPM authentication token is configured\n'))
  } else {
    echo(chalk.red('✗ No NPM authentication token found in CI\n'))
    process.exit(1)
  }
}

// Build
echo(chalk.cyan('Step 2: Building package...\n'))
await $`npm run build`
echo(chalk.green('✓ Build completed\n'))

// Lint
echo(chalk.cyan('Step 3: Running linter...\n'))
await $`npm run lint`
echo(chalk.green('✓ Linting passed\n'))

// Test
echo(chalk.cyan('Step 4: Running tests...\n'))
await $`npm run test`
echo(chalk.green('✓ Tests passed\n'))

// Publish
echo(chalk.cyan('Step 5: Publishing to npm...\n'))
if (!isDryRun) {
  const publishArgs = ['publish', '--access', 'public']
  
  if (IS_CI) {
    publishArgs.push('--provenance')
  }
  
  if (otp) {
    publishArgs.push('--otp', otp)
  }
  
  await $`npm ${publishArgs}`
  echo(chalk.green('\n✓ Package published successfully! 🎉\n'))
} else {
  echo(chalk.yellow('⊘ Skipped (dry-run)\n'))
  echo(chalk.blue('\nDry run completed. Run without --dry-run to actually publish.\n'))
}
