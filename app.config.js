// EAS Build가 네이티브 파일을 생성할 때 gradle 파일을 직접 수정하기 위해
// @expo/config-plugins에서 제공하는 유틸리티를 가져옵니다.
const { withProjectBuildGradle } = require('@expo/config-plugins');

/**
 * 이 함수가 바로 우리가 직접 만드는 '커스텀 Config 플러그인'입니다.
 * 이 플러그인의 역할은 안드로이드의 최상위 build.gradle 파일을 열어서,
 * 모든 하위 프로젝트(모든 라이브러리 포함)가 사용할 코틀린 버전을
 * '1.8.22'로 강제로 설정하는 코드를 삽입하는 것입니다.
 * 
 * 이는 'expo-build-properties'가 해결하지 못했던 문제를
 * 더 직접적이고 강력한 방법으로 해결합니다.
 * @param {import('@expo/config-types').ExpoConfig} config
 */
const withForcedKotlinVersion = (config) => {
  return withProjectBuildGradle(config, (config) => {
    // 안드로이드의 build.gradle 파일이 맞는지 확인합니다.
    if (config.modResults.language !== 'groovy') {
      return config;
    }

    // build.gradle 파일의 전체 내용을 문자열로 가져옵니다.
    let contents = config.modResults.contents;

    // 모든 하위 프로젝트에 적용될 'ext' 블록을 정의합니다.
    const extBlock = `
    ext {
        kotlinVersion = "1.8.22"
    }
`;

    // 'allprojects' 블록이 이미 있는지 확인합니다. (대부분의 경우에 있습니다)
    if (contents.includes('allprojects {')) {
      // 'allprojects' 블록 안에 'ext {' 블록이 아직 없는 경우에만 추가하여 중복을 방지합니다.
      if (!contents.includes('ext {')) {
        // 'allprojects {' 바로 다음에 우리가 정의한 extBlock을 삽입합니다.
        contents = contents.replace(
          'allprojects {',
          `allprojects {${extBlock}`
        );
      }
    } else {
      // 만약 'allprojects' 블록이 없다면, 파일 끝에 새로 추가합니다.
      contents += `\nallprojects {${extBlock}}\n`;
    }

    // 수정된 내용을 다시 할당합니다.
    config.modResults.contents = contents;
    return config;
  });
};

// 메인 설정을 내보냅니다.
// 이제 module.exports는 객체가 아닌 함수가 됩니다.
module.exports = ({ config }) => {
  
  // package.json의 name, slug 같은 기본 정보를 유지하면서 추가 설정을 정의합니다.
  const expoConfig = {
    ...config,
    owner: 'xiest', // 개인 계정으로 명시
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
      // 기존 expo-build-properties 플러그인은 이제 코틀린 버전 설정이 아닌,
      // 카카오 저장소(repository)를 추가하는 역할만 하도록 남겨둡니다.
      [
        'expo-build-properties',
        {
          android: {
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
        // 개인 계정의 projectId로 설정되어 있어야 합니다.
        projectId: '7fb126e9-50a3-4269-9fcf-a94c9280eafb',
      },
    },
  };

  // 위에서 만든 커스텀 플러그인을 최종 설정에 적용하여 내보냅니다.
  return withForcedKotlinVersion(expoConfig);
};