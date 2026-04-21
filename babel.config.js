
// Basic Babel configuration for Node.js projects.
// This configuration allows Babel to parse modern JavaScript syntax.
module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current', // Target the current Node.js version
        },
      },
    ],
  ],
};
