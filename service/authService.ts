// service/authService.ts

import { apiClient } from './apiClient';
import * as SecureStore from 'expo-secure-store';
import { login } from '@react-native-seoul/kakao-login';

export const authService = {
  signUp: (email: string, password: string, password2: string) =>
    apiClient.post('/users/register/', { email, password, password2 }),

  signIn: (email: string, password: string) =>
    apiClient.post('/users/login/', { email, password }),

  kakaoLogin: async () => {
    try {
      const kakaoToken = await login();
      console.log(`[authService] 카카오 액세스 토큰 전송: ${kakaoToken.accessToken}`);
      return apiClient.post('/users/kakao/', { access_token: kakaoToken.accessToken });
    } catch (error) {
      console.error('[authService] kakaoLogin 실패:', error);
      throw error;
    }
  },

  connectKakaoAccount: async () => {
    try {
      const kakaoToken = await login();
      console.log(`[authService] 카카오 계정 연결 시도, 액세스 토큰: ${kakaoToken.accessToken}`);
      const response = await apiClient.post(
        '/users/me/connect-kakao/',
        {
          access_token: kakaoToken.accessToken,
        }
      );
      console.log('[authService] 카카오 계정 연결 성공:', response.data);
      return response.data;
    } catch (error) {
      console.error('[authService] connectKakaoAccount 실패:', error);
      throw error;
    }
  },

  logout: async (): Promise<void> => {
    try {
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      if (!refreshToken) {
        console.log('로그아웃: 로컬에 refresh 토큰이 없어 서버 요청을 건너뜁니다.');
        return;
      }
      await apiClient.post('/users/logout/', {
        refresh: refreshToken,
      });
      console.log('서버의 refresh 토큰이 성공적으로 만료되었습니다.');
    } catch (error: any) {
      console.error('서버 로그아웃 요청 실패:', error.response?.data || error.message);
    }
  },
};