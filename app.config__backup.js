// app.config.js (궁극의 최종 수정본)

const { withProjectBuildGradle } = require('@expo/config-plugins');

/**
 * 이 함수가 바로 우리가 직접 만드는 '커스텀 Config 플러그인'입니다.
 * 이 플러그인은 안드로이드의 최상위 build.gradle 파일을 열어서,
 * 'allprojects' 블록을 수정합니다. 이 블록은 모든 하위 프로젝트(라이브러리 포함)에
 * 적용되는 규칙을 정의하며, 여기에 코틀린 버전을 강제로 설정함으로써
 * 모든 라이브러리가 우리의 버전을 따르도록 만듭니다.
 * @param {import('@expo/config-types').ExpoConfig} config
 */
const withForcedKotlinVersion = (config) => {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language !== 'groovy') {
      return config;
    }

    let contents = config.modResults.contents;

    // allprojects 블록을 찾습니다.
    const allProjectsRegex = /allprojects\s*{/;
    if (!allProjectsRegex.test(contents)) {
      // 만약 allprojects 블록이 없다면, 새로 추가합니다. (일반적으로는 항상 존재)
      contents += `
allprojects {
    repositories {
        google()
        mavenCentral()
    }
}
`;
    }
    
    // ext 블록을 allprojects 내부에 삽입합니다.
    // 이는 모든 하위 프로젝트가 ext.kotlinVersion을 '1.8.22'로 인식하게 만듭니다.
    const extBlock = `
    ext {
        kotlinVersion = "1.8.22"
    }
`;
    contents = contents.replace(
      /allprojects\s*{/,
      `allprojects {${extBlock}`
    );

    config.modResults.contents = contents;
    return config;
  });
};

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
      // 우리의 커스텀 플러그인을 가장 먼저 실행하여 기준을 잡습니다.
      withForcedKotlinVersion,
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
            // expo-build-properties는 이제 카카오 저장소 추가 역할만 합니다.
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

  return expoConfig;
};