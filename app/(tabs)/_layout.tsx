import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

// 실제 프로젝트에 존재하는 컴포넌트만 import 합니다.
// 'useAuth' 관련 import는 제거되었습니다.
import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: {
          // 탭 바를 항상 보이도록 단순화합니다.
          // (로그인/회원가입 화면에서도 보이게 되지만, 먼저 경고부터 해결하는 것이 중요합니다.)
          position: 'absolute',
          backgroundColor: Platform.OS === 'android' ? 'rgba(255,255,255,0.7)' : undefined,
        },
      }}>
      
      {/* 
        [핵심 수정]
        - 복잡한 동적 로직(href)을 모두 제거했습니다.
        - app/(tabs) 폴더에 실제 파일이 존재하는 스크린만 정의합니다.
        - 사용자에게 보여줄 필요 없는 탭은 href: null로 숨깁니다.
      */}

      {/* 사용자에게 보여줄 탭 */}
      <Tabs.Screen
        name="home"
        options={{
          title: '홈',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="home_travel"
        options={{
          title: '여행 중',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="tram.fill" color={color} />,
        }}
      />
      
      {/* 내부 이동용 숨겨진 탭 (파일이 실제로 존재함) */}
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="signin" options={{ href: null }} />
      <Tabs.Screen name="signup" options={{ href: null }} />
      <Tabs.Screen name="list" options={{ href: null }} />
      <Tabs.Screen name="summary" options={{ href: null }} />
      <Tabs.Screen name="user_info" options={{ href: null }} />

      {/* 
        [경고 원인 제거]
        - explore, survey_*, info 등 존재하지 않거나 그룹 외부에 있는 스크린 정의는 모두 삭제되었습니다.
        - mypage 스크린 정의도 (tabs) 폴더에 파일이 없으므로 삭제되었습니다.
      */}
    </Tabs>
  );
}