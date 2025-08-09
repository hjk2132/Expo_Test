// app/kakao.tsx

import React, { useRef } from 'react';
import { StyleSheet, SafeAreaView, View, ActivityIndicator, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios'; // axios 추가

const KAKAO_REST_API_KEY = 'c7bae595a41d669362115e5d78b4aad4'; // 본인의 카카오 REST API 키
const BACKEND_REDIRECT_URI = 'https://www.no-plan.cloud/api/v1/users/kakao/'; // BE가 알려준 Redirect URI
const BACKEND_API_URL = 'https://www.no-plan.cloud/api/v1/users/kakao/'; // POST 요청을 보낼 최종 목적지

export default function KakaoLoginScreen() {
  const router = useRouter();
  const webviewRef = useRef<WebView>(null);
  const isCodeHandled = useRef(false); // 중복 실행 방지 플래그

  // 백엔드로 POST 요청을 보내는 함수
  const postCodeToBackend = async (code: string) => {
    try {
      console.log(`백엔드로 인가 코드(code)를 POST 요청으로 보냅니다: ${code}`);

      // dj-rest-auth의 SocialLoginView는 'code'를 받아서 처리할 수 있습니다.
      const response = await axios.post(BACKEND_API_URL, {
        code: code,
      });

      console.log('백엔드로부터 최종 JWT 응답 수신:', response.data);

      // 백엔드로부터 받은 JWT 토큰 저장
      const { access, refresh } = response.data; // 실제 백엔드 응답 구조 확인 필요
      if (access) {
        await SecureStore.setItemAsync('accessToken', access);
        if (refresh) {
          await SecureStore.setItemAsync('refreshToken', refresh);
        }

        // 로그인 성공, 홈으로 이동
        router.replace('/(tabs)/home');

      } else {
        Alert.alert('로그인 실패', '백엔드로부터 유효한 토큰을 받지 못했습니다.');
        router.back();
      }
    } catch (error) {
      console.error('백엔드로 코드 전송 중 에러 발생:', error);
      Alert.alert('로그인 오류', '로그인 처리 중 문제가 발생했습니다.');
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        ref={webviewRef}
        style={styles.container}
        // 카카오 인가 요청 URL
        source={{
          uri: `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${KAKAO_REST_API_KEY}&redirect_uri=${BACKEND_REDIRECT_URI}`,
        }}
        // 웹뷰의 URL이 변경될 때마다 실행
        onNavigationStateChange={(navState) => {
          // URL이 백엔드의 Redirect URI로 변경되었는지 확인
          if (navState.url.startsWith(BACKEND_REDIRECT_URI) && !isCodeHandled.current) {

            // URL에서 'code=' 다음의 값을 추출
            const url = new URL(navState.url);
            const code = url.searchParams.get('code');

            if (code) {
              isCodeHandled.current = true; // 처리 시작 플래그 설정

              // ★★★ 더 이상 WebView가 페이지를 로드하지 않도록 막습니다.
              webviewRef.current?.stopLoading();

              // 추출한 코드를 백엔드로 POST 전송
              postCodeToBackend(code);
            }
          }
        }}
        // 로딩 중 사용자에게 피드백을 주기 위함
        renderLoading={() => (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#000000" />
          </View>
        )}
        startInLoadingState={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});