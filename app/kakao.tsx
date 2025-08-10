// app/kakao.tsx

import React from 'react';
import { StyleSheet, SafeAreaView, View, ActivityIndicator, Alert, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { login } from '@react-native-seoul/kakao-login';

// 백엔드의 카카오 로그인 처리 URL (urls.py에 정의된 경로)
const BACKEND_API_URL = 'https://www.no-plan.cloud/api/v1/users/kakao/';

export default function KakaoLoginScreen() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  // 백엔드로 카카오 액세스 토큰을 전송하는 함수
  const sendTokenToBackend = async (accessToken: string) => {
    try {
      console.log(`백엔드로 카카오 액세스 토큰(accessToken)을 POST 요청으로 보냅니다: ${accessToken}`);

      // dj-rest-auth의 SocialLoginView는 'access_token' 필드를 기대합니다.
      const response = await axios.post(BACKEND_API_URL, {
        access_token: accessToken,
      });

      console.log('백엔드로부터 최종 JWT 응답 수신:', response.data);

      // 백엔드로부터 받은 서비스 자체의 JWT 토큰 저장
      const { access, refresh } = response.data;
      if (access) {
        await SecureStore.setItemAsync('accessToken', access);
        if (refresh) {
          await SecureStore.setItemAsync('refreshToken', refresh);
        }
        // 로그인 성공, 홈으로 이동
        router.replace('/(tabs)/home');
      } else {
        throw new Error('백엔드로부터 유효한 토큰을 받지 못했습니다.');
      }
    } catch (error) {
      console.error('백엔드로 토큰 전송 중 에러 발생:', error);
      Alert.alert('로그인 오류', '로그인 처리 중 문제가 발생했습니다.');
      router.back();
    }
  };

  // 카카오 SDK를 사용하여 로그인하는 함수
  const signInWithKakao = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const token = await login();
      console.log('카카오 로그인 성공, 액세스 토큰:', token.accessToken);

      // 로그인 성공 후 받은 액세스 토큰을 백엔드로 전송
      await sendTokenToBackend(token.accessToken);

    } catch (error) {
      console.error('카카오 로그인 실패:', error);
      if (String(error).includes('cancel')) {
        Alert.alert('알림', '카카오 로그인이 취소되었습니다.');
      } else {
        Alert.alert('로그인 실패', '카카오 로그인 중 오류가 발생했습니다.');
      }
      router.back();
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>카카오 로그인</Text>
        <Text style={styles.description}>
          카카오 계정으로 간편하게 로그인하고{'\n'}서비스를 이용해보세요.
        </Text>
        <TouchableOpacity style={styles.kakaoButton} onPress={signInWithKakao} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#000000" />
          ) : (
            <Text style={styles.kakaoButtonText}>카카오로 로그인하기</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={() => !loading && router.back()}>
          <Text style={styles.backButtonText}>이전으로 돌아가기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666666',
    marginBottom: 40,
  },
  kakaoButton: {
    backgroundColor: '#FEE500',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minHeight: 50,
  },
  kakaoButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    marginTop: 20,
  },
  backButtonText: {
    fontSize: 14,
    color: '#888888',
    textDecorationLine: 'underline',
  },
});