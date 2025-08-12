// app/(contexts)/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect, PropsWithChildren } from 'react';
import * as SecureStore from 'expo-secure-store';
import { apiClient } from '../../service/apiClient';
import { UserInfo } from '../../service/userService';

interface AuthContextType {
  userInfo: UserInfo | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (access: string, refresh: string, user: UserInfo) => Promise<void>;
  logout: (isSilent?: boolean) => void;
  refreshUserInfo: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 앱 시작 시 토큰 유효성 검사
  useEffect(() => {
    const loadAuthData = async () => {
      try {
        const token = await SecureStore.getItemAsync('accessToken');
        if (token) {
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const response = await apiClient.get<UserInfo>('/users/me/');
          setUserInfo(response.data);
          setAccessToken(token);
        }
      } catch (e) {
        console.error('Failed to load auth data or token is invalid', e);
        // ★★★ 토큰 로드/검증 실패 시, 깨끗하게 로컬 상태를 정리합니다. ★★★
        await logout(true); // isSilent=true 플래그로 서버 요청은 보내지 않음
      } finally {
        setIsLoading(false);
      }
    };
    loadAuthData();
  }, []);

  const login = async (access: string, refresh: string, user: UserInfo) => {
    await SecureStore.setItemAsync('accessToken', access);
    await SecureStore.setItemAsync('refreshToken', refresh);
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${access}`;
    setAccessToken(access);
    setUserInfo(user);
  };

  // ★★★ isSilent 파라미터를 받도록 수정되었습니다. ★★★
  const logout = async (isSilent = false) => {
    // isSilent 플래그가 true가 아닐 때만 서버에 로그아웃 요청을 보냅니다.
    if (!isSilent) {
      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        if (refreshToken) {
          await apiClient.post('/users/logout/', { refresh: refreshToken });
        }
      } catch(e) {
        console.error("Server logout failed", e);
      }
    }
    
    // 공통 로컬 정리 로직
    apiClient.defaults.headers.common['Authorization'] = undefined;
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    setAccessToken(null);
    setUserInfo(null);
  };

  const refreshUserInfo = async () => {
    try {
        console.log("Context: 사용자 정보를 서버로부터 새로고침합니다...");
        const response = await apiClient.get<UserInfo>('/users/me/');
        setUserInfo(response.data);
        console.log("Context: 사용자 정보 새로고침 완료.");
    } catch (e) {
        console.error("Context: 사용자 정보 새로고침 실패", e);
        await logout();
    }
  };


  return (
    <AuthContext.Provider value={{ userInfo, accessToken, isLoading, login, logout, refreshUserInfo }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};