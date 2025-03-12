const fs = require('fs');
const path = require('path');

// Copy CHANGELOG.md to public directory
const rootDir = process.cwd();
const changelogPath = path.join(rootDir, 'CHANGELOG.md');
const publicDir = path.join(rootDir, 'public');
const publicChangelogPath = path.join(publicDir, 'CHANGELOG.md');

// Check if CHANGELOG.md exists
if (fs.existsSync(changelogPath)) {
  // Create public directory if it doesn't exist
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Copy the file
  fs.copyFileSync(changelogPath, publicChangelogPath);
  console.log('CHANGELOG.md has been copied to public directory');
} else {
  console.warn('CHANGELOG.md does not exist, nothing to copy');
}