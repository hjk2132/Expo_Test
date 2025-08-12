// components/InfoEditComponent.tsx

import React, { useState, useEffect , useCallback } from 'react';
import { View, Text, TouchableOpacity, Switch, StyleSheet, Image, Alert } from 'react-native';
import { userService } from '../../service/userService';
import { authService } from '../../service/authService'; // authService를 import 합니다.
import * as Location from 'expo-location';
import { useFocusEffect } from 'expo-router';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

console.log('🧩 InfoEditComponent 렌더됨');

interface Props {
  onBack: () => void;
  onPassword: () => void;
  onDelete: () => void;
}

const InfoEditComponent: React.FC<Props> = ({ onBack, onPassword, onDelete }) => {
  const [isLocationEnabled, setIsLocationEnabled] = useState(true);
  const [isAlarmEnabled, setIsAlarmEnabled] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  // (기존 useEffect와 useFocusEffect 코드는 그대로 유지)
  useEffect(() => {
    const fetchUserInfo = async () => {
      setLoading(true);
      setError('');
      try {
        const userInfo = await userService.getUserInfo();
        setName(userInfo.name ?? '회원님');
        setEmail(userInfo.email);
      } catch (err: any) {
        console.error('❌ 사용자 정보 불러오기 실패:', err);
        setError('사용자 정보를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchUserInfo();
  }, []);
  
  useFocusEffect(
    useCallback(() => {
      const checkLocationPermission = async () => {
        const { status } = await Location.getForegroundPermissionsAsync();
        setIsLocationEnabled(status === Location.PermissionStatus.GRANTED);
      };
      checkLocationPermission();
    }, [])
  );

  // ##################################################################
  // ### ▼▼▼ 여기에 새로운 함수가 추가되었습니다 ▼▼▼ ###
  // ##################################################################
  /**
   * 카카오 계정 연결을 처리하는 함수
   */
  const handleConnectKakao = () => {
    Alert.alert(
      "카카오 계정 연결",
      "현재 계정에 카카오 계정을 연결하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        {
          text: "연결하기",
          onPress: async () => {
            try {
              // authService에 있는 계정 연동 함수를 호출합니다.
              await authService.connectKakaoAccount();
              Alert.alert("성공", "카카오 계정이 성공적으로 연결되었습니다.");
              // 필요하다면, 연결 상태를 다시 불러오는 로직을 추가할 수 있습니다.

            } catch (error: any) {
              // 백엔드에서 보낸 구체적인 에러 메시지를 사용합니다.
              const errorMessage = error.response?.data?.error || "계정 연결 중 오류가 발생했습니다.";
              
              // 사용자가 카카오 로그인을 스스로 취소한 경우는 오류 알림을 띄우지 않습니다.
              if (!String(error).includes('cancel')) {
                Alert.alert("연결 실패", errorMessage);
              }
            }
          },
        },
      ]
    );
  };


  const handleLogout = () => {
    Alert.alert(
      "로그아웃",
      "로그아웃 하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        { 
          text: "로그아웃",
          onPress: async () => {
            try {
              await authService.logout();
              await SecureStore.deleteItemAsync('accessToken');
              await SecureStore.deleteItemAsync('refreshToken');
              router.replace('/'); 
            } catch (error) {
              Alert.alert("오류", "로그아웃 중 문제가 발생했습니다.");
            }
          },
          style: 'destructive'
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>← 뒤로가기</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        {/* --- 이름, 이메일, 비밀번호 변경 --- */}
        <View style={styles.infoBlock}>
          <Text style={styles.label}>이름</Text>
          <Text style={styles.value}>{loading ? '로딩 중...' : error ? error : name}</Text>
        </View>
        <View style={styles.infoBlock}>
          <Text style={styles.label}>이메일</Text>
          <Text style={styles.value}>{loading ? '로딩 중...' : error ? error : email}</Text>
        </View>
        <TouchableOpacity onPress={onPassword} style={styles.passwordRow}>
          <Text style={styles.label}>비밀번호 변경</Text>
          <Text style={styles.link}>변경</Text>
        </TouchableOpacity>

        {/* ################################################################## */}
        {/* ### ▼▼▼ 이 부분이 수정되었습니다 (Switch -> TouchableOpacity) ▼▼▼ ### */}
        {/* ################################################################## */}
        <TouchableOpacity onPress={handleConnectKakao} style={styles.settingRow}>
          <View style={styles.iconLabel}>
            <Image
              source={require('../../assets/images/kakao_icon.jpg')}
              style={styles.kakaoIcon}
            />
            <Text style={styles.label}>카카오 연동</Text>
          </View>
          {/* 비활성화된 스위치 대신 '연결' 텍스트 버튼을 보여줍니다. */}
          <Text style={styles.link}>연결</Text>
        </TouchableOpacity>

        {/* --- 위치 정보, 알림 설정 등 (이하 코드는 기존과 동일) --- */}
        <View style={styles.settingRow}>
          <Text style={styles.label}>위치 정보 제공</Text>
          <Switch
            disabled={true} 
            value={isLocationEnabled}
            trackColor={{ false: '#ccc', true: '#b2dffc' }}
            thumbColor={isLocationEnabled ? '#0077b6' : '#f4f3f4'}
            style={{ opacity: 0.7 }}
          />
        </View>
        <Text style={styles.subtext}>고객님의 현재 위치 기반으로 더 나은 추천을 위해 수집됩니다.</Text>
        
        <View style={styles.settingRow}>
          <Text style={styles.label}>알림 설정</Text>
          <Switch
            value={isAlarmEnabled}
            onValueChange={() => setIsAlarmEnabled(prev => !prev)}
            trackColor={{ false: '#ccc', true: '#b2dffc' }}
            thumbColor={isAlarmEnabled ? '#0077b6' : '#f4f3f4'}
          />
        </View>
        <Text style={styles.subtext}>고객님의 일정에 대한 알림을 제공합니다.</Text>
        
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
          <Text style={styles.deleteText}>계정 삭제하기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default InfoEditComponent;

// --- 스타일 시트는 기존과 동일 ---
const styles = StyleSheet.create({
  container: { padding: 20, flex: 1 },
  backButton: { marginBottom: 10 },
  backText: { color: '#0077b6', fontSize: 14 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 20, borderWidth: 1, borderColor: '#eee' },
  infoBlock: { marginBottom: 15 },
  label: { fontSize: 13, color: '#666' },
  value: { fontSize: 15, color: '#333', fontWeight: 'bold' },
  passwordRow: { marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between' },
  link: { color: '#0077b6', fontWeight: 'bold', fontSize: 13 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15 },
  subtext: { fontSize: 11, color: '#999', marginTop: 4, marginBottom: 4 },
  iconLabel: { flexDirection: 'row', alignItems: 'center' },
  kakaoIcon: { width: 20, height: 20, marginRight: 8 },
  logoutButton: { marginTop: 30 },
  logoutText: { color: '#0077b6', fontSize: 13 },
  deleteButton: { marginTop: 30 },
  deleteText: { color: '#e74c3c', fontSize: 13 },
});