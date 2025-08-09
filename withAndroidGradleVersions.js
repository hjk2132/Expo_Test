// withAndroidGradleVersions.js (최종 버전)

const { withProjectBuildGradle } = require('@expo/config-plugins');

module.exports = (config) => {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language !== 'groovy') {
      console.warn('Cannot apply Kotlin version fix to a non-groovy build.gradle');
      return config;
    }

    let buildGradle = config.modResults.contents;

    // 1. ext 블록에 kotlinVersion 변수 설정 (기존과 동일하지만 더 확실하게)
    const kotlinVersion = '1.8.20';
    if (!buildGradle.includes('ext {')) {
      buildGradle = buildGradle.replace(
        /buildscript {/,
        `buildscript {\n    ext.kotlinVersion = "${kotlinVersion}"`
      );
    } else if (!buildGradle.includes('kotlinVersion =')) {
      buildGradle = buildGradle.replace(
        /ext {/,
        `ext {\n        kotlinVersion = "${kotlinVersion}"`
      );
    } else {
      buildGradle = buildGradle.replace(/kotlinVersion = ".+"/, `kotlinVersion = "${kotlinVersion}"`);
    }

    // 2. allprojects 블록을 추가하여 모든 하위 프로젝트의 설정을 강제로 덮어쓰기 (핵심 해결책)
    const allProjectsBlock = `
allprojects {
    configurations.all {
        resolutionStrategy {
            eachDependency { DependencyResolveDetails details ->
                if (details.requested.group == 'org.jetbrains.kotlin' && details.requested.name.startsWith('kotlin-')) {
                    details.useVersion(rootProject.ext.kotlinVersion)
                }
            }
        }
    }
}
`;

    // allprojects 블록이 이미 있는지 확인하고, 없으면 추가
    if (!buildGradle.includes('allprojects {')) {
      buildGradle += allProjectsBlock;
    }

    config.modResults.contents = buildGradle;
    return config;
  });
};