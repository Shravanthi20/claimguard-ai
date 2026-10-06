// Run this on a machine with AWS CLI and Docker configured
const { execSync } = require('child_process');

function run(cmd) {
    console.log(`\nExecuting: ${cmd}`);
    try {
        const result = execSync(cmd, { encoding: 'utf-8', stdio: 'inherit' });
        return result;
    } catch (e) {
        console.error(`Command failed: ${cmd}`);
        process.exit(1);
    }
}

console.log("Checking AWS identity...");
execSync('aws sts get-caller-identity', { stdio: 'inherit' });

console.log("Please complete the setup using this script pattern or manually.");
