import { Tabs, usePathname } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '../../context/AuthContext'; // 가상의 AuthContext 경로 (실제 경로에 맞게 수정 필요)

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, isTravelActive } = useAuth(); // 사용자 인증 및 여행 상태 (가정)
  const pathname = usePathname();

  // 현재 경로를 기반으로 탭 바를 보여줄지 결정하는 로직
  // 로그인, 회원가입, 최초 정보입력 화면 등에서는 탭 바를 숨깁니다.
  const showTabBar = !['/signin', '/signup', '/user_info'].includes(pathname);
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: {
          // tabBarStyle에 display 속성을 추가하여 동적으로 숨기거나 보여줍니다.
          display: showTabBar ? (Platform.OS === 'ios' ? 'flex' : 'flex') : 'none',
          position: Platform.OS === 'ios' ? 'absolute' : 'relative',
          backgroundColor: Platform.OS === 'android' ? 'rgba(255,255,255,0.7)' : undefined,
        },
      }}>

      {/* ================================================================== */}
      {/* ================ 사용자에게 보여줄 실제 탭 스크린 =================== */}
      {/* ================================================================== */}

      <Tabs.Screen
        name="home"
        options={{
          title: '홈',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
          // 여행 중일 때는 홈 탭을 비활성화하고 여행 탭으로 유도
          href: isTravelActive ? null : '/(tabs)/home', 
        }}
      />
      <Tabs.Screen
        name="home_travel"
        options={{
          title: '여행 중',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="tram.fill" color={color} />,
          // 여행 중일 때만 이 탭이 보이도록 설정
          href: isTravelActive ? '/(tabs)/home_travel' : null,
        }}
      />
      {/* 여기에 마이페이지나 다른 주요 탭을 추가할 수 있습니다. */}
      {/* 예시: 마이페이지 탭 추가 */}
      <Tabs.Screen
        name="mypage" // 이 탭이 동작하려면 app/mypage.tsx 또는 app/(tabs)/mypage.tsx 파일이 필요합니다.
        options={{
          title: '내 정보',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.crop.circle" color={color} />,
          // 인증된 사용자에게만 보이도록 설정
          href: isAuthenticated ? '/mypage' : null,
        }}
      />


      {/* ================================================================== */}
      {/* ============ 내부 화면 이동용으로만 사용되는 숨겨진 스크린 =========== */}
      {/* ================================================================== */}
      {/* 
        href: null 옵션은 탭 바에 아이콘을 표시하지 않도록 합니다.
        이 스크린들은 (tabs) 그룹에 속해있지만, 하단 탭으로 직접 접근할 수 없습니다.
        주로 router.push('/(tabs)/signin')와 같은 코드로 프로그래매틱하게 이동할 때 사용됩니다.
      */}
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="signin" options={{ href: null }} />
      <Tabs.Screen name="signup" options={{ href: null }} />
      <Tabs.Screen name="user_info" options={{ href: null }} />
      <Tabs.Screen name="list" options={{ href: null }} />
      <Tabs.Screen name="summary" options={{ href: null }} />
      
      {/* 
        [경고가 발생했던 스크린들 - 모두 제거]
        이 스크린들은 (tabs) 그룹의 자식이 아니므로 여기에 정의할 수 없습니다.
        대신 app/_layout.tsx의 Stack 네비게이터에 의해 관리됩니다.

        - <Tabs.Screen name="explore" ... /> (파일 없음)
        - <Tabs.Screen name="survey_travel" ... /> (그룹 외부)
        - <Tabs.Screen name="survey_destination" ... /> (그룹 외부)
        - <Tabs.Screen name="info" ... /> (그룹 외부)
        - <Tabs.Screen name="kakao" ... /> (그룹 외부)
      */}
    </Tabs>
  );
}

/**
 * ========================================================
 * 추가 설명: 위 코드가 완벽하게 동작하기 위한 가정
 * ========================================================
 * 1. AuthContext 또는 유사한 전역 상태 관리
 *    - 사용자의 로그인 상태(isAuthenticated)와 여행 진행 상태(isTravelActive)를
 *      알 수 있는 전역 상태 관리(Context, Zustand, Redux 등)가 필요합니다.
 *    - 위 코드에서는 useAuth() 라는 가상의 훅을 사용했습니다.
 *      실제 프로젝트에 맞게 이 부분을 수정해야 합니다.
 *      만약 없다면, 이 동적 탭 로직은 구현이 복잡해집니다.
 * 
 * 2. 마이페이지 라우트
 *    - '내 정보' 탭을 활성화하려면, 라우터가 /mypage 경로를 찾을 수 있어야 합니다.
 *      - app/mypage.tsx 파일을 만들거나,
 *      - app/mypage/ 폴더를 app/(tabs)/mypage/ 로 이동해야 합니다.
 *      - 현재 구조에서는 app/_layout.tsx에 mypage가 등록되어 있으므로 /mypage로 이동 가능합니다.
 * ========================================================
 */