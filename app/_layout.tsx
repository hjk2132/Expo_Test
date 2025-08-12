// app/_layout.tsx

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { TravelSurveyProvider } from './(components)/TravelSurveyContext';
import { useColorScheme } from '@/hooks/useColorScheme';

import React, { useEffect } from 'react';
import messaging from '@react-native-firebase/messaging';
import { requestUserPermission, getFCMToken, listenForForegroundMessages } from '../utils/pushNotificationHelper';

// ★★★ 1. AuthProvider를 import 합니다. ★★★
import { AuthProvider } from './(contexts)/AuthContext';


messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('백그라운드/종료 상태에서 메시지 처리:', remoteMessage);
});


export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      const setupNotifications = async () => {
        await requestUserPermission();
        await getFCMToken();
      };
      setupNotifications();
      const unsubscribe = listenForForegroundMessages();
      return unsubscribe;
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    // ★★★ 2. AuthProvider로 앱 전체를 감싸줍니다. ★★★
    // 이제 앱의 모든 곳에서 useAuth() 훅을 통해 로그인 상태를 공유할 수 있습니다.
    <AuthProvider>
      <TravelSurveyProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            {/* 탭 내비: 헤더 숨김 */}
            <Stack.Screen
              name="(tabs)"
              options={{ headerShown: false }}
            />

            {/* 설문 화면: 기본 헤더 숨김 */}
            <Stack.Screen
              name="survey_travel"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="survey_destination"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="mypage"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="info"
              options={{ headerShown: false }}
            />
            
            <Stack.Screen
              name="kakao"
              options={{ title: '카카오 로그인' }}
            />

            {/* Not Found */}
            <Stack.Screen
              name="+not-found"
              options={{ title: 'Not Found' }}
            />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </TravelSurveyProvider>
    </AuthProvider>
  );
}