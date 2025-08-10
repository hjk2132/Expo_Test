module.exports = {
  expo: {
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
      }
    },
  },
};