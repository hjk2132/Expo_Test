// service/authService.ts

import { apiClient } from './apiClient';
import * as SecureStore from 'expo-secure-store';
import { login } from '@react-native-seoul/kakao-login';

export const authService = {
  /**
   * 일반 회원가입을 요청합니다.
   * 전역 헤더 설정을 무시하고 Authorization 헤더를 null로 설정하여 보냅니다.
   */
  signUp: (email: string, password: string, password2: string) =>
    apiClient.post('/users/register/', { email, password, password2 }, {
      headers: { Authorization: null } 
    }),

  /**
   * 일반 이메일 로그인을 요청합니다.
   * 전역 헤더 설정을 무시하고 Authorization 헤더를 null로 설정하여 보냅니다.
   */
  signIn: (email: string, password: string) =>
    apiClient.post('/users/login/', { email, password }, {
      headers: { Authorization: null }
    }),

  /**
   * 카카오 SDK로 로그인 후, 받은 토큰을 백엔드로 보내 최종 로그인을 처리합니다.
   */
  kakaoLogin: async () => {
    try {
      const kakaoToken = await login();
      console.log(`[authService] 카카오 액세스 토큰 전송: ${kakaoToken.accessToken}`);
      return apiClient.post('/users/kakao/', { access_token: kakaoToken.accessToken }, {
        // 카카오 로그인 역시 토큰이 필요 없는 요청이므로 헤더를 비웁니다.
        headers: { Authorization: null }
      });
    } catch (error) {
      console.error('[authService] kakaoLogin 실패:', error);
      throw error;
    }
  },

  /**
   * 이미 로그인된 사용자의 계정에 카카오 계정을 연결합니다.
   * 이 요청은 인증이 필요하므로 헤더를 수정하지 않습니다.
   */
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

  /**
   * 서버에 refresh 토큰을 보내 만료시키고, 로컬의 토큰도 삭제합니다.
   */
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