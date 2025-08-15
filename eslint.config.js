// @ts-check
import globals from 'globals';
import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import html from '@html-eslint/eslint-plugin';
import tseslint from 'typescript-eslint';

export default tseslint.config([
  eslint.configs.recommended,
  tseslint.configs.recommended,
  eslintConfigPrettier,
	{
    ...html.configs['flat/recommended'],
    files: ['**/*.html'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    rules: {
      'no-undef': 'off',
      'no-var': 'error',
      'prefer-const': ['error', { destructuring: 'all' }],
      'prefer-promise-reject-errors': 'error',
      'prefer-regex-literals': ['error', { disallowRedundantWrapping: true }],
      quotes: ['error', 'single', { avoidEscape: true, allowTemplateLiterals: false }],
      'space-before-blocks': ['error', 'always']
    }
  },
  {
    files: ['**/*.js', 'tests/**/upload.js'],
    ignores: ['src/browser.js', 'tests/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.es2024,
        ...globals.node
      }
    }
  },
  {
    files: ['src/browser.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: {
        ...globals.es2024,
        ...globals.browser
      }
    }
  },
  {
    files: ['tests/**/*.js'],
    ignores: ['tests/**/upload.js', 'tests/**/code.js'],
    rules: {
      'no-undef': 'off',
      'no-var': 'error',
      'no-useless-escape': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      'prefer-const': ['error', { destructuring: 'all' }],
      'prefer-promise-reject-errors': 'error',
      'prefer-regex-literals': ['error', { disallowRedundantWrapping: true }],
      quotes: ['error', 'single', { avoidEscape: true, allowTemplateLiterals: false }],
      'space-before-blocks': ['error', 'always']
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: globals.es2022
    }
  },
  {
    files: ['tests/**/code.js', 'scripting/*.js'],
    rules: {
      'no-var': 'error',
      'no-useless-escape': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      'prefer-const': ['error', { destructuring: 'all' }],
      'prefer-promise-reject-errors': 'error',
      'prefer-regex-literals': ['error', { disallowRedundantWrapping: true }],
      quotes: ['error', 'single', { avoidEscape: true, allowTemplateLiterals: false }],
      'space-before-blocks': ['error', 'always']
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: {
        ...globals.es2022,
        addStoryCard: 'writable',
        updateStoryCard: 'writable',
        removeStoryCard: 'writable',
        log: 'writable',
        history: 'writable',
        storyCards: 'writable',
        state: 'writable',
        memory: 'writable',
        text: 'writable',
        stop: 'writable',
        info: 'writable'
      }
    }
  },
  {
    files: ['tools/*.js', 'utils/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.es2024,
        ...globals.node
      }
    }
  },
  {
    files: ['types/*.js'],
    rules: {
      'no-unused-vars': 'off',
      'no-unused-expressions': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-unused-expressions': 'off'
    }
  }
]);
