// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Adiciona suporte a arquivos .cjs (necessário para o Firebase funcionar bem)
config.resolver.sourceExts.push('cjs');

module.exports = config;