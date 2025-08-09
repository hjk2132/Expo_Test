// withAndroidGradleVersions.js (더 단순화된 최종 버전)

const { withProjectBuildGradle } = require('@expo/config-plugins');

module.exports = (config) => {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language !== 'groovy') {
      console.warn('Cannot apply Kotlin version fix to a non-groovy build.gradle');
      return config;
    }
    
    // 기존 ext 블록을 찾아서 수정하거나, 없으면 새로 추가하는 가장 안정적인 방법
    const KOTLIN_VERSION = '1.8.20';
    
    // buildscript 블록이 있는지 확인
    if (config.modResults.contents.includes('buildscript {')) {
        // ext.kotlinVersion이 있는지 확인
        if (config.modResults.contents.includes('ext.kotlinVersion =')) {
            // 있으면 버전만 교체
            config.modResults.contents = config.modResults.contents.replace(/ext.kotlinVersion = ".+"/, `ext.kotlinVersion = "${KOTLIN_VERSION}"`);
        } else {
            // ext는 없지만 buildscript는 있으면 ext 블록 추가
            config.modResults.contents = config.modResults.contents.replace('buildscript {', `buildscript {\n    ext.kotlinVersion = "${KOTLIN_VERSION}"`);
        }
    } else {
        // buildscript 블록 자체가 없으면 새로 추가 (일어날 확률은 낮음)
        config.modResults.contents = `buildscript {\n    ext.kotlinVersion = "${KOTLIN_VERSION}"\n}\n` + config.modResults.contents;
    }
    
    return config;
  });
};