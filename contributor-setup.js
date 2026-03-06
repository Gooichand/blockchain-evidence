#!/usr/bin/env node

/**
 * EVID-DGC Contributor Setup Script
 * Helps new contributors get started quickly
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🎉 Welcome to EVID-DGC Contributor Setup!');
console.log('=====================================\n');

// Check if this is a fresh clone
const isContributor = process.argv.includes('--contributor');

if (isContributor) {
  console.log('👋 Setting up your development environment...\n');

  // Check prerequisites
  console.log('🔍 Checking prerequisites...');

  try {
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    console.log(`✅ Node.js: ${nodeVersion}`);

    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    console.log(`✅ npm: ${npmVersion}`);

    const gitVersion = execSync('git --version', { encoding: 'utf8' }).trim();
    console.log(`✅ Git: ${gitVersion}`);
  } catch (error) {
    console.log('❌ Missing prerequisites. Please install Node.js, npm, and Git.');
    process.exit(1);
  }

  console.log('\n📦 Installing dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed successfully!');
  } catch (error) {
    console.log('❌ Failed to install dependencies');
    process.exit(1);
  }

  // Create .env file if it doesn't exist
  if (!fs.existsSync('.env')) {
    console.log('\n⚙️ Setting up environment configuration...');
    try {
      fs.copyFileSync('.env.example', '.env');
      console.log('✅ Created .env file from template');
      console.log('📝 Please update .env with your Supabase credentials');
    } catch (error) {
      console.log('⚠️ Could not create .env file. Please copy .env.example manually.');
    }
  }

  console.log('\n🎯 Next Steps for Contributors:');
  console.log('==============================');
  console.log('1. 📖 Read CONTRIBUTING.md for detailed guidelines');
  console.log('2. 🔧 Update .env with your Supabase credentials');
  console.log('3. 🗄️ Set up your Supabase database (see README.md)');
  console.log('4. 🚀 Run "npm start" to start the development server');
  console.log('5. 🌐 Open http://localhost:3000 to test the application');
  console.log('6. 🐛 Check GitHub Issues for ways to contribute');
  console.log('7. 🔀 Create a branch for your changes');
  console.log('8. 📝 Make your changes and test thoroughly');
  console.log('9. 📤 Submit a pull request with clear description');

  console.log('\n📚 Helpful Resources:');
  console.log('=====================');
  console.log('• Contributing Guide: CONTRIBUTING.md');
  console.log('• Code of Conduct: CODE_OF_CONDUCT.md');
  console.log('• Security Policy: SECURITY.md');
  console.log('• Project Issues: https://github.com/deekshi275/blockchain-evidence/issues');
  console.log('• Discussions: https://github.com/deekshi275/blockchain-evidence/discussions');

  console.log('\n💬 Need Help?');
  console.log('=============');
  console.log('• Email: DGC2MHNE@proton.me');
  console.log('• GitHub Issues: For bugs and feature requests');
  console.log('• GitHub Discussions: For questions and general discussion');

  console.log("\n🎉 You're all set! Happy contributing! 🚀");
} else {
  // Regular setup for users
  console.log('🚀 Setting up EVID-DGC for development...\n');

  console.log('📦 Installing dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed!');
  } catch (error) {
    console.log('❌ Failed to install dependencies');
    process.exit(1);
  }

  // Create .env file if it doesn't exist
  if (!fs.existsSync('.env')) {
    console.log('\n⚙️ Creating environment configuration...');
    try {
      fs.copyFileSync('.env.example', '.env');
      console.log('✅ Created .env file');
    } catch (error) {
      console.log('⚠️ Could not create .env file');
    }
  }

  console.log('\n🎯 Next Steps:');
  console.log('==============');
  console.log('1. Update .env with your Supabase credentials');
  console.log('2. Set up your Supabase database (see README.md)');
  console.log('3. Run "npm start" to start the server');
  console.log('4. Open http://localhost:3000');

  console.log('\n✅ Setup complete! 🎉');
}

// Helper functions
function checkCommand(command) {
  try {
    execSync(`${command} --version`, { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

function createContributorBranch() {
  try {
    const branchName = `contributor-${Date.now()}`;
    execSync(`git checkout -b ${branchName}`, { stdio: 'inherit' });
    console.log(`✅ Created branch: ${branchName}`);
    return branchName;
  } catch (error) {
    console.log('⚠️ Could not create branch. You may need to create one manually.');
    return null;
  }
}
