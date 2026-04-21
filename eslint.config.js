
// Basic ESLint configuration for JavaScript files in the backend.
// This configuration aims to catch common errors and enforce basic code style.
// Updated for ESLint v9+ flat config system.
module.exports = [
  // Default configuration object for Node.js environment.
  {
    // Use the latest ECMAScript features
    languageOptions: {
      parser: require('@babel/eslint-parser'), // Use babel-eslint parser
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        // Node.js globals
        node: true,
        require: 'readonly',
        process: 'readonly',
        console: 'readonly',
        __dirname: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        Buffer: 'readonly',
        // Frontend globals that might be needed if backend interacts with frontend parsing
        localStorage: 'readonly',
        document: 'readonly',
        fetch: 'readonly',
        FormData: 'readonly',
      },
      // Add JSX parsing for files that might use it (e.g., in frontend components)
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    // Define rules.
    rules: {
      'no-unused-vars': 'warn', // Warn about unused variables
      'no-undef': 'warn',       // Warn about undefined variables
      // Add more rules as needed
    },
    // Specify the files ESLint should ignore.
    ignores: [
      'node_modules/',
      'frontend/', // Focus on backend files, but allow frontend files to be parsed if needed.
      '*.config.js',
      '*.test.js',
      'migrations/',
      'dist/',
      'coverage/',
      '*.traineddata',
      '*.zip',
      '*.pdf',
      '*.csv',
      '*.xlsx',
      '*.json',
      '*.lock',
      '*.md',
      '*.txt',
      '*.ico',
      '*.png',
      '*.jpg',
      '*.jpeg',
      '*.gif',
      '*.svg',
      '*.woff',
      '*.woff2',
      '*.ttf',
      '*.eot',
      '*.otf',
      '*.scss',
      '*.less',
      '*.html',
      '*.css',
      '*.map',
      '*.webmanifest',
      '*.xml',
      '*.sh',
      '*.ps1',
      '*.bat',
      '*.cmd',
      '*.yaml',
      '*.yml',
      '*.ini',
      '*.cfg',
      '*.conf',
      '*.log',
    ],
  },
];
