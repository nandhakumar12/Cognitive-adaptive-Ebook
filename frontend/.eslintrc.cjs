module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended'
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'coverage', 'vite.config.ts'],
  parser: '@typescript-eslint/parser',
  plugins: ['react', 'jsx-a11y'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    'react/react-in-jsx-scope': 'off', // Not needed in React 17+
    'no-console': ['warn', { allow: ['warn', 'error', 'log'] }]
  },
  settings: {
    react: {
      version: 'detect'
    }
  }
}
