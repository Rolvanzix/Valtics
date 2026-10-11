const fs = require('fs');
const path = require('path');

const targetFiles = [
  path.resolve(__dirname, '../node_modules/bigint-buffer/dist/node.js'),
  path.resolve(__dirname, '../node_modules/bigint-buffer/src/index.ts')
];

targetFiles.forEach((file) => {
  if (fs.existsSync(file)) {
    try {
      let content = fs.readFileSync(file, 'utf8');
      if (content.includes('bigint: Failed to load bindings')) {
        content = content.replace(
          /console\.warn\(\s*['"]bigint: Failed to load bindings[^'"]*['"]\s*\);?/g,
          '/* pure JS fallback */'
        );
        fs.writeFileSync(file, content, 'utf8');
      }
    } catch (err) {
      // Ignore if read-only
    }
  }
});
