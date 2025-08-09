// app/kakao.tsx

import React, { useState } from 'react'; // useRef 대신 useState를 사용합니다.
import { StyleSheet, SafeAreaView, View, ActivityIndicator, Alert, TouchableOpacity, Text, Image } from 'react-native'; // UI 요소를 추가합니다.
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { login } from '@react-native-seoul/kakao-login'; // WebView 대신 네이티브 로그인 라이브러리를 사용합니다.

// --- 더 이상 필요하지 않은 변수들 ---
// const KAKAO_REST_API_KEY = '...'; // 네이티브 SDK가 내부적으로 처리하므로 프론트엔드에서는 필요 없습니다.
// const BACKEND_REDIRECT_URI = '...'; // 네이티브 방식에서는 Redirect URI 개념을 프론트엔드가 신경쓰지 않습니다.

// 백엔드와 통신할 API 주소는 그대로 사용합니다.
const BACKEND_API_URL = 'https://www.no-plan.cloud/api/v1/users/kakao/';

export default function KakaoLoginScreen() {
  const router = useRouter();
  // 로딩 상태를 관리하기 위한 state
  const [isLoading, setIsLoading] = useState(false);

  // 백엔드로 토큰을 보내는 함수 (기존 로직 재활용 및 수정)
  // code 대신 accessToken을 받아서 처리합니다.
  const sendTokenToBackend = async (accessToken: string) => {
    try {
      console.log(`백엔드로 Access Token을 POST 요청으로 보냅니다: ${accessToken}`);

      // dj-rest-auth는 access_token도 받을 수 있습니다.
      const response = await axios.post(BACKEND_API_URL, {
        access_token: accessToken, // body에 code 대신 access_token을 담아 보냅니다.
      });

      console.log('백엔드로부터 최종 JWT 응답 수신:', response.data);

      // 백엔드로부터 받은 우리 서비스의 JWT 토큰을 저장합니다.
      const { access, refresh } = response.data;
      if (access && refresh) {
        await SecureStore.setItemAsync('accessToken', access);
        await SecureStore.setItemAsync('refreshToken', refresh);

        Alert.alert('로그인 성공!', 'NO_PLAN에 오신 것을 환영합니다.');
        // 로그인 성공 후 홈으로 이동합니다.
        router.replace('/(tabs)/home');

      } else {
        // 성공 응답을 받았지만 토큰이 없는 경우
        throw new Error('서버 응답에 토큰이 포함되지 않았습니다.');
      }
    } catch (error) {
      // 이 catch 블록은 이제 handleKakaoLogin 함수에서 처리합니다.
      // 여기서 에러를 다시 던져서 상위 함수가 인지하도록 합니다.
      throw error;
    }
  };

  // 카카오 로그인 버튼을 눌렀을 때 실행될 메인 함수
  const handleKakaoLogin = async () => {
    if (isLoading) return; // 로딩 중 중복 클릭 방지

    setIsLoading(true);
    try {
      // 1. 네이티브 SDK로 카카오 로그인 실행
      const token = await login();

      // 2. 성공 시 받아온 access_token을 우리 백엔드로 전송
      await sendTokenToBackend(token.accessToken);

    } catch (error) {
      console.error('카카오 로그인 처리 중 전체 프로세스 에러:', error);
      // axios 에러인 경우, 상세 내용을 보여줄 수 있습니다.
      if (axios.isAxiosError(error)) {
        console.error('Axios 에러 상세:', error.response?.data);
        Alert.alert('로그인 오류', `서버와 통신 중 문제가 발생했습니다: ${error.response?.data?.detail || error.message}`);
      } else {
        // 그 외의 에러 (예: 사용자가 카카오 로그인 창을 닫은 경우)
        Alert.alert('로그인 실패', '로그인 과정이 중단되었습니다.');
      }
    } finally {
      // 성공/실패 여부와 관계없이 로딩 상태를 해제합니다.
      setIsLoading(false);
    }
  };

  // --- 기존의 WebView를 네이티브 로그인 버튼 UI로 완전히 교체 ---
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>NO_PLAN</Text>
        <Text style={styles.subtitle}>여행의 모든 것을 한 곳에서</Text>

        <TouchableOpacity
          style={styles.kakaoButton}
          onPress={handleKakaoLogin}
          disabled={isLoading} // 로딩 중에는 버튼 비활성화
        >
          {isLoading ? (
            <ActivityIndicator color="#000000" />
          ) : (
            <>
              {/* 카카오 로고 이미지가 있다면 아래 Image 컴포넌트를 사용하세요. */}
              {/* <Image source={require('@/assets/images/kakao_logo.png')} style={styles.kakaoLogo} /> */}
              <Text style={styles.kakaoButtonText}>카카오로 시작하기</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 60,
  },
  kakaoButton: {
    backgroundColor: '#FEE500',
    width: '100%',
    height: 50,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kakaoLogo: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  kakaoButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});