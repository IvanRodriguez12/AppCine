const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  tslib: require.resolve("tslib"),
};

config.resolver.sourceExts.push("cjs");

module.exports = config;
