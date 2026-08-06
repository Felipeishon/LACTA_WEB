import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        console: 'readonly',
        alert: 'readonly',
        FormData: 'readonly',
        fetch: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'warn',
    },
  },
];
