// withAndroidGradleVersions.js

const { withProjectBuildGradle, withSettingsGradle } = require('@expo/config-plugins');

const setKotlinVersion = (buildGradle) => {
  // 이미 설정되어 있는지 확인
  if (buildGradle.includes('kotlinVersion =')) {
    return buildGradle.replace(/kotlinVersion = ".+"/, 'kotlinVersion = "1.8.20"');
  }
  
  // buildscript 블록에 ext 추가
  return buildGradle.replace(
    /buildscript {/,
    `buildscript {\n    ext {\n        kotlinVersion = "1.8.20"\n    }`
  );
};

const setKotlinPlugin = (settingsGradle) => {
    // pluginManagement 블록이 없다면 원본을 그대로 반환
    if (!settingsGradle.includes('pluginManagement {')) {
        return settingsGradle;
    }

    // 이미 resolutionStrategy가 있다면 중복 추가 방지
    if (settingsGradle.includes('resolutionStrategy {')) {
        return settingsGradle;
    }

    // pluginManagement 블록 안에 resolutionStrategy 추가
    return settingsGradle.replace(
        /pluginManagement {/,
        `pluginManagement {\n    repositories {\n        google()\n        mavenCentral()\n        gradlePluginPortal()\n    }\n    resolutionStrategy {\n        eachPlugin {\n            if (requested.id.id.startsWith("org.jetbrains.kotlin")) {\n                useVersion(rootProject.ext.kotlinVersion)\n            }\n        }\n    }`
    );
};

module.exports = (config) => {
  config = withProjectBuildGradle(config, (config) => {
    config.modResults.contents = setKotlinVersion(config.modResults.contents);
    return config;
  });

  config = withSettingsGradle(config, (config) => {
    config.modResults.contents = setKotlinPlugin(config.modResults.contents);
    return config;
  });

  return config;
};