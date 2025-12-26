module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: [
    '**/__tests__/**/*.test.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  collectCoverageFrom: [
    'lib/**/*.{js,jsx,ts,tsx}',
    'contexts/**/*.{js,jsx,ts,tsx}',
    'app/**/*.{js,jsx,ts,tsx}',
    '!**/__tests__/**',
    '!**/node_modules/**',
    '!**/coverage/**',
  ],
  coverageThreshold: {
    'lib/': {
      lines: 25,
      functions: 25,
    },
    'contexts/': {
      lines: 50,
      functions: 50,
    },
    // Lower threshold for UI/screens initially
    'app/': {
      lines: 0,
      functions: 0,
    },
  },
  testEnvironment: 'node',
  globals: {
    'process.env': {
      EXPO_PUBLIC_API_URL: 'http://localhost:5000/api/v1',
    },
  },
};
