// mypage/InfoEditComponent.tsx

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Switch, StyleSheet, Image, Alert, ActivityIndicator } from 'react-native';
import { authService } from '../../service/authService';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
// ★★★ 경로가 수정되었습니다. (../가 두 개에서 한 개로 변경) ★★★
import { useAuth } from '../(contexts)/AuthContext';

interface Props {
  onBack: () => void;
  onPassword: () => void;
  onDelete: () => void;
}

const InfoEditComponent: React.FC<Props> = ({ onBack, onPassword, onDelete }) => {
  const router = useRouter();
  
  const { userInfo, logout: authLogout, refreshUserInfo } = useAuth();

  const [isLocationEnabled, setIsLocationEnabled] = useState(true);
  const [isAlarmEnabled, setIsAlarmEnabled] = useState(false);
  const [connectLoading, setConnectLoading] = useState(false);

  React.useEffect(() => {
    const checkLocationPermission = async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      setIsLocationEnabled(status === Location.PermissionStatus.GRANTED);
    };
    checkLocationPermission();
  }, []);

  const handleConnectKakao = () => {
    Alert.alert(
      "카카오 계정 연결", "현재 계정에 카카오 계정을 연결하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        {
          text: "연결하기",
          onPress: async () => {
            setConnectLoading(true);
            try {
              await authService.connectKakaoAccount();
              await refreshUserInfo(); 
              Alert.alert("성공", "카카오 계정이 성공적으로 연결되었습니다.");
            } catch (error: any) {
              const errorMessage = error.response?.data?.error || "계정 연결 중 오류가 발생했습니다.";
              if (!String(error).includes('cancel')) {
                Alert.alert("연결 실패", errorMessage);
              }
            } finally {
              setConnectLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert("로그아웃", "로그아웃 하시겠습니까?", [
        { text: "취소", style: "cancel" },
        { 
          text: "로그아웃",
          onPress: async () => {
            try {
              await authLogout();
              router.replace('/'); 
            } catch (error) {
              Alert.alert("오류", "로그아웃 중 문제가 발생했습니다.");
            }
          },
          style: 'destructive'
        }
    ]);
  };
  
  if (!userInfo) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  }

  const isKakaoLinked = userInfo.is_kakao_linked;

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>← 뒤로가기</Text>
      </TouchableOpacity>
      
      <View style={styles.card}>
        <View style={styles.infoBlock}>
          <Text style={styles.label}>이름</Text>
          <Text style={styles.value}>{userInfo.name ?? '회원님'}</Text>
        </View>
        <View style={styles.infoBlock}>
          <Text style={styles.label}>이메일</Text>
          <Text style={styles.value}>{userInfo.email}</Text>
        </View>
        <TouchableOpacity onPress={onPassword} style={styles.passwordRow}>
          <Text style={styles.label}>비밀번호 변경</Text>
          <Text style={styles.link}>변경</Text>
        </TouchableOpacity>
        
        <View style={styles.settingRow}>
          <View style={styles.iconLabel}>
            <Image
              source={require('../../assets/images/kakao_icon.jpg')}
              style={styles.kakaoIcon}
            />
            <Text style={styles.label}>카카오 연동</Text>
          </View>
          {connectLoading ? (
            <ActivityIndicator size="small" />
          ) : isKakaoLinked ? (
            <Text style={styles.linkedText}>연동 완료</Text>
          ) : (
            <TouchableOpacity onPress={handleConnectKakao}>
              <Text style={styles.link}>연결</Text>
            </TouchableOpacity>
          )}
        </View>
        
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
  linkedText: { color: '#27ae60', fontWeight: 'bold', fontSize: 13 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15 },
  subtext: { fontSize: 11, color: '#999', marginTop: 4, marginBottom: 4 },
  iconLabel: { flexDirection: 'row', alignItems: 'center' },
  kakaoIcon: { width: 20, height: 20, marginRight: 8 },
  logoutButton: { marginTop: 30 },
  logoutText: { color: '#0077b6', fontSize: 13 },
  deleteButton: { marginTop: 30 },
  deleteText: { color: '#e74c3c', fontSize: 13 },
});