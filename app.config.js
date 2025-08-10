// app.config.js (궁극의 최종 수정본)

const { withDangerousMod, withPlugins } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * 모든 하위 프로젝트(node_modules 내의 라이브러리 포함)의 build.gradle 파일을 순회하며
 * 코틀린 버전을 강제로 덮어쓰는 궁극의 커스텀 플러그인입니다.
 * @param {import('@expo/config-types').ExpoConfig} config
 */
function withForcedKotlinVersion(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const nodeModulesPath = path.join(projectRoot, 'node_modules');

      // node_modules를 순회하며 build.gradle 파일을 찾습니다.
      const packages = fs.readdirSync(nodeModulesPath);
      for (const pkg of packages) {
        let pkgPath = path.join(nodeModulesPath, pkg);
        // @scope/package 형태의 패키지 처리
        if (pkg.startsWith('@')) {
          const scopedPackages = fs.readdirSync(pkgPath);
          for (const scopedPkg of scopedPackages) {
            await findAndPatchGradleFile(path.join(pkgPath, scopedPkg));
          }
        } else {
          await findAndPatchGradleFile(pkgPath);
        }
      }
      return config;
    },
  ]);
}

/**
 * 특정 패키지 경로에서 android/build.gradle 파일을 찾아 코틀린 버전을 수정합니다.
 * @param {string} packagePath 
 */
async function findAndPatchGradleFile(packagePath) {
  const gradleFilePath = path.join(packagePath, 'android', 'build.gradle');
  if (fs.existsSync(gradleFilePath)) {
    let contents = fs.readFileSync(gradleFilePath, 'utf-8');
    
    // 문제를 일으키는 모든 종류의 코틀린 버전 정의 라인을 찾습니다.
    const kotlinVersionRegex = /kotlinVersion\s*=\s*['"][\d.]+['"]/g;
    const kotlin_versionRegex = /kotlin_version\s*=\s*['"][\d.]+['"]/g;
    const complexKotlinVersionRegex = /def\s+kotlin_version\s*=\s*rootProject\.ext\.has\('kotlinVersion'\)\s*\?/g;

    let modified = false;
    if (contents.match(kotlinVersionRegex)) {
      contents = contents.replace(kotlinVersionRegex, 'kotlinVersion = "1.8.22"');
      modified = true;
    }
    if (contents.match(kotlin_versionRegex)) {
      contents = contents.replace(kotlin_versionRegex, 'kotlin_version = "1.8.22"');
      modified = true;
    }
    if (contents.match(complexKotlinVersionRegex)) {
      contents = contents.replace(complexKotlinVersionRegex, 'def kotlin_version = "1.8.22" //');
      modified = true;
    }
    
    if (modified) {
      console.log(`Patched kotlin version in: ${gradleFilePath}`);
      fs.writeFileSync(gradleFilePath, contents);
    }
  }
}

// 메인 설정을 내보냅니다.
module.exports = ({ config }) => {
  const expoConfig = {
    ...config,
    owner: 'xiest',
    name: 'NoPlan',
    slug: 'NoPlan',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'noplan',
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/images/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.donggguk.noplan',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      package: 'com.donggguk.noplan',
      googleServicesFile: './google-services.json',
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      'expo-secure-store',
      [
        '@react-native-seoul/kakao-login',
        {
          kakaoAppKey: '8aef54490fca5199b3701d81e9cd1eb0',
        },
      ],
      [
        'expo-build-properties',
        {
          android: {
            // 루트 프로젝트의 코틀린 버전은 여기서 설정합니다.
            kotlinVersion: '1.8.22',
            repositories: [
              { url: 'https://devrepo.kakao.com/nexus/content/groups/public/' },
            ],
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {
        origin: false,
      },
      eas: {
        projectId: '7fb126e9-50a3-4269-9fcf-a94c9280eafb',
      },
    },
  };

  // withPlugins를 사용하여 여러 플러그인을 순차적으로 적용합니다.
  // 우리의 커스텀 플러그인을 가장 마지막에 실행하여 모든 것을 덮어쓰도록 합니다.
  return withPlugins(expoConfig, [withForcedKotlinVersion]);
};