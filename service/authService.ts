// service/authService.ts

import { apiClient } from './apiClient';
import * as SecureStore from 'expo-secure-store';
// 카카오 로그인을 위해 @react-native-seoul/kakao-login 라이브러리를 직접 사용합니다.
import { login } from '@react-native-seoul/kakao-login';

export const authService = {
  /**
   * 회원가입을 요청합니다.
   */
  signUp: (email: string, password: string, password2: string) =>
    apiClient.post('/users/register/', { email, password, password2 }),

  /**
   * 로그인을 요청하고, 성공 시 토큰을 반환받습니다.
   */
  signIn: (email: string, password: string) =>
    apiClient.post('/users/login/', { email, password }),

  /**
   * 카카오 계정으로 우리 서비스에 로그인합니다. (로그아웃 상태에서 사용)
   * (기존 code 방식에서 access_token 방식으로 개선)
   */
  kakaoLogin: async () => {
    try {
      // 1. 카카오 SDK로 로그인하여 액세스 토큰 받기
      const kakaoToken = await login();
      console.log(`[authService] 카카오 로그인, 액세스 토큰 전송: ${kakaoToken.accessToken}`);

      // 2. 백엔드 로그인 API(/users/kakao/)로 액세스 토큰 전송
      return apiClient.post('/users/kakao/', { access_token: kakaoToken.accessToken });

    } catch (error) {
      console.error('[authService] kakaoLogin 실패:', error);
      // 에러를 상위로 전파하여 호출한 컴포넌트에서 처리하도록 합니다.
      throw error;
    }
  },

  // ##################################################################
  // ### ▼▼▼ 여기에 새로운 함수가 추가되었습니다 ▼▼▼ ###
  // ##################################################################
  /**
   * 이미 로그인된 계정에 카카오 계정을 연결(연동)합니다. (로그인 상태에서 사용)
   */
  connectKakaoAccount: async () => {
    try {
      // 1. 카카오 SDK를 호출하여 새로운 카카오 액세스 토큰 받기
      const kakaoToken = await login();
      console.log(`[authService] 카카오 계정 연결 시도, 액세스 토큰: ${kakaoToken.accessToken}`);

      // 2. 백엔드 계정 연동 API(/users/me/connect-kakao/)로 토큰 전송
      // apiClient가 자동으로 헤더에 우리 서비스의 JWT 토큰을 추가해줍니다.
      const response = await apiClient.post(
        '/users/me/connect-kakao/', // <<<--- 호출하는 API 주소가 다릅니다.
        {
          access_token: kakaoToken.accessToken, // Body에는 카카오 토큰을 보냅니다.
        }
      );
      
      console.log('[authService] 카카오 계정 연결 성공:', response.data);
      return response.data;

    } catch (error) {
      console.error('[authService] connectKakaoAccount 실패:', error);
      // 에러를 상위로 전파하여 호출한 컴포넌트에서 처리하도록 합니다.
      throw error;
    }
  },

  /**
   * 서버에 refresh 토큰을 전송하여 만료시키도록 요청합니다.
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