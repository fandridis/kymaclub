const { getDefaultConfig } = require('expo/metro-config');

// Get the default Expo Metro config  
const config = getDefaultConfig(__dirname);

// QUICK FIX: Disable symbolication to prevent ENOENT errors in monorepo
// This stops Metro from trying to read source files for stack traces
// which causes path resolution issues in monorepo structure
config.symbolicator = false;

module.exports = config;