// app.config.js (궁극의 최종 수정본)

const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * 모든 하위 프로젝트의 build.gradle 파일을 순회하며,
 * 알려진 모든 패턴의 코틀린 버전 정의를 '1.8.22'로 강제 덮어쓰는 플러그인.
 * @param {import('@expo/config-types').ExpoConfig} config
 */
const withForcedKotlinVersion = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const nodeModulesPath = path.join(projectRoot, 'node_modules');
      
      const patchGradleFile = (filePath) => {
        if (fs.existsSync(filePath)) {
          let contents = fs.readFileSync(filePath, 'utf-8');
          
          // Pattern 1: ext.kotlinVersion = "..."
          const pattern1 = /ext\.kotlinVersion\s*=\s*['"][\d\.]+['"]/g;
          // Pattern 2: def kotlin_version = "..." or rootProject.ext.get(...)
          const pattern2 = /def\s+kotlin_version\s*=\s*.+/g;
          // Pattern 3: classpath "...:kotlin-gradle-plugin:..."
          const pattern3 = /(classpath.*?kotlin-gradle-plugin:)(['"])[^'"]+(['"])/g;
          // Pattern 4: rnsDefaultKotlinVersion = '...'
          const pattern4 = /rnsDefaultKotlinVersion\s*=\s*['"][\d\.]+['"]/g;

          let modified = false;
          if (pattern1.test(contents)) {
            contents = contents.replace(pattern1, 'ext.kotlinVersion = "1.8.22"');
            modified = true;
          }
          if (pattern2.test(contents)) {
            contents = contents.replace(pattern2, 'def kotlin_version = "1.8.22"');
            modified = true;
          }
           if (pattern3.test(contents)) {
            contents = contents.replace(pattern3, '$1$21.8.22$3');
            modified = true;
          }
          if (pattern4.test(contents)) {
            contents = contents.replace(pattern4, 'rnsDefaultKotlinVersion = "1.8.22"');
            modified = true;
          }

          if (modified) {
            console.log(`✅ Patched Kotlin version in: ${path.relative(projectRoot, filePath)}`);
            fs.writeFileSync(filePath, contents);
          }
        }
      };

      const traverseNodeModules = (dir) => {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const fullPath = path.join(dir, file);
          if (file === 'build.gradle' && fs.lstatSync(fullPath).isFile()) {
            patchGradleFile(fullPath);
          } else if (fs.lstatSync(fullPath).isDirectory()) {
            // @scoped/package or regular package
            if (file.startsWith('@') || fs.existsSync(path.join(fullPath, 'android', 'build.gradle'))) {
              const gradlePath = path.join(fullPath, 'android', 'build.gradle');
              patchGradleFile(gradlePath);
            }
          }
        }
      };
      
      traverseNodeModules(nodeModulesPath);
      
      return config;
    },
  ]);
};

// 메인 설정을 내보냅니다.
module.exports = ({ config }) => {
  const baseConfig = {
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

  // withPlugins를 사용하지 않고, 직접 플러그인을 적용합니다.
  return withForcedKotlinVersion(baseConfig);
};