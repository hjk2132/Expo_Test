// Info.tsx

import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
  PanResponder,
  ScrollView,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';

import { bookmarkService } from '../service/bookmarkService';
import { travelService, CreateVisitedContentDto } from '../service/travelService';
import { categoryMapping } from '../utils/categoryMapping';

interface ListPlace {
  contentid: string;
  title: string;
  addr1: string;
  mapx: string;
  mapy: string;
  firstimage?: string;
  firstimage2?: string;
  recommend_reason: string;
  hashtags: string;
  populartimes?: {
    current_status?: string;
    rating?: number;
    rating_n?: number;
    busiest_time?: string;
  };
}

interface TourDetail {
  mapx: string;
  mapy: string;
  firstimage?: string;
  firstimage2?: string;
  title?: string;
  addr1?: string;
  overview?: string;
  contentid?: string;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_EXPANDED = 100;
const SHEET_COLLAPSED = SCREEN_HEIGHT - 180;
const MAX_OVERSHOOT = 100;

export default function Info() {
  const router = useRouter();
  const { contentid, places: placesParam } = useLocalSearchParams<{
    contentid: string;
    places: string;
  }>();

  const sheetY = useRef(new Animated.Value(SHEET_COLLAPSED)).current;
  const [isExpanded, setIsExpanded] = useState(false);
  const [detail, setDetail] = useState<TourDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userLoc, setUserLoc] = useState<{ latitude: number; longitude: number } | null>(null);

  const [favorite, setFavorite] = useState(false);
  const [bookmarkId, setBookmarkId] = useState<number | null>(null);

  // 1) 리스트에서 받은 placesParam 파싱
  const listPlaces: ListPlace[] = useMemo(() => {
    if (!placesParam) return [];
    try {
      const decoded = decodeURIComponent(placesParam);
      return JSON.parse(decoded) as ListPlace[];
    } catch {
      return [];
    }
  }, [placesParam]);

  // 2) 현재 contentid에 해당하는 항목
  const current = listPlaces.find(p => p.contentid === contentid);

  // 3) 상세 API 호출
  useEffect(() => {
    if (!contentid) {
      setError('콘텐츠 ID가 없습니다.');
      return;
    }
    
    let isMounted = true;
    
    console.log('[info.tsx] Fetching detail for contentid:', contentid);
    const apiUrl = `https://no-plan.cloud/api/v1/tours/detail/${contentid}/`;
    console.log('[info.tsx] API URL:', apiUrl);
    
    fetch(apiUrl)
      .then(res => {
        console.log('[info.tsx] Response status:', res.status);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then((data: TourDetail) => {
        console.log('[info.tsx] Detail data received:', data);
        if (isMounted) {
          setDetail(data);
        }
      })
      .catch((error) => {
        console.error('[info.tsx] Detail API error:', error);
        if (isMounted) {
          setError(`상세 정보를 불러오지 못했습니다: ${error.message}`);
        }
      });
    
    return () => {
      isMounted = false;
    };
  }, [contentid]);

  // 4) 위치 권한/좌표 조회
  useEffect(() => {
    let isMounted = true;
    
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (isMounted) {
            setError('위치 권한이 필요합니다.');
          }
          return;
        }
        const loc = await Location.getCurrentPositionAsync({});
        if (isMounted) {
          setUserLoc({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        }
      } catch (error) {
        console.error('[info.tsx] Location error:', error);
        if (isMounted) {
          setError('위치 정보를 가져오지 못했습니다.');
        }
      }
    })();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // 5) 화면이 포커스될 때마다 북마크 상태 새로고침
  useFocusEffect(
    React.useCallback(() => {
      let isMounted = true;
      
      (async () => {
        try {
          const existing = await bookmarkService.getBookmarks();
          if (isMounted) {
            const found = existing.find(b => b.contentId === Number(contentid));
            if (found) {
              setFavorite(true);
              setBookmarkId(found.id);
            } else {
              setFavorite(false);
              setBookmarkId(null);
            }
          }
        } catch (e) {
          console.error('Failed to load bookmarks on Info:', e);
        }
      })();
      
      return () => {
        isMounted = false;
      };
    }, [contentid])
  );

  // 6) 바텀시트 PanResponder
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 10,
      onPanResponderMove: (_, g) => {
        let newY = SHEET_COLLAPSED + g.dy;
        newY = Math.max(SHEET_EXPANDED, Math.min(newY, SHEET_COLLAPSED + MAX_OVERSHOOT));
        sheetY.setValue(newY);
      },
      onPanResponderRelease: (_, g) => {
        const toValue = g.dy < -50 ? SHEET_EXPANDED : SHEET_COLLAPSED;
        Animated.spring(sheetY, { toValue, bounciness: 6, useNativeDriver: false }).start(() => {
          setIsExpanded(toValue === SHEET_EXPANDED);
        });
      },
    })
  ).current;

  // 북마크 토글
  const toggleFavorite = async () => {
    const imageUri =
      current?.firstimage ||
      current?.firstimage2 ||
      detail?.firstimage ||
      detail?.firstimage2 ||
      '';
    const title = current?.title || '제목 없음';
    const addr1 = current?.addr1 || '';
    const overview = current?.recommend_reason || '';

    try {
      if (!favorite) {
        const res = await bookmarkService.addBookmark({
          contentId: Number(contentid),
          title,
          firstImage: imageUri,
          addr1,
          overview,
        });
        setBookmarkId(res.id);
        setFavorite(true);
        Alert.alert('북마크', '북마크에 추가되었습니다.');
      } else if (bookmarkId) {
        await bookmarkService.deleteBookmark(bookmarkId);
        setBookmarkId(null);
        setFavorite(false);
        Alert.alert('북마크', '북마크에서 제거되었습니다.');
      }
    } catch (err) {
      console.error('Bookmark error:', err);
      Alert.alert('오류', '북마크 처리 중 문제가 발생했습니다.');
    }
  };

  // 로딩/에러 처리
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>뒤로가기</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  // 데이터가 없고 위치 정보도 없는 경우 로딩 표시
  if ((!detail && !current) || !userLoc) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4AB7C8" />
        <Text style={{ marginTop: 16, color: '#666' }}>정보를 불러오는 중...</Text>
      </View>
    );
  }

  // 화면에 사용할 데이터 결정
  console.log('[info.tsx] Data processing:', { current, detail });
  
  const imageUri =
    current?.firstimage ||
    current?.firstimage2 ||
    detail?.firstimage ||
    detail?.firstimage2 ||
    '';
  const title = current?.title || detail?.title || '제목 없음';
  const addr1 = current?.addr1 || detail?.addr1 || '';
  const recommendReason = current?.recommend_reason || '';
  const overview = detail?.overview || '';
  const rawHashtags = current?.hashtags || '';
  const hashtags = rawHashtags
    .split('#')
    .map(t => t.trim())
    .filter(t => t.length > 0);
  
  // 좌표 처리 - detail에서 가져온 경우 문자열을 숫자로 변환
  let latitude: number, longitude: number;
  try {
    latitude = parseFloat(current?.mapy ?? detail?.mapy ?? '0');
    longitude = parseFloat(current?.mapx ?? detail?.mapx ?? '0');
    console.log('[info.tsx] Coordinates:', { latitude, longitude });
  } catch (error) {
    console.error('[info.tsx] Coordinate parsing error:', error);
    latitude = 37.5665; // 서울 기본 좌표
    longitude = 126.9780;
  }

  // 방문 체크 처리
  const handleVisit = () => {
    console.log('▶ handleVisit 호출!');
    Alert.alert(
      '방문했어요',
      '이 장소를 방문 목록에 추가하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '확인',
          onPress: async () => {
            try {
              // 최신 trip 가져오기
              const trips = await travelService.getTripData();
              const latest = trips.sort((a, b) => b.id - a.id)[0];

              // 🆕 카테고리 판단 및 저장
              const category = categoryMapping.determineCategory(title, recommendReason);
              await categoryMapping.saveCategory(Number(contentid), category);
              console.log(`[info] 카테고리 저장: ${title} -> ${category}`);

              // DTO 구성
              const dto: CreateVisitedContentDto = {
                content_id: Number(contentid),
                title,
                first_image: imageUri,
                addr1,
                mapx: `${longitude}`,
                mapy: `${latitude}`,
                overview: overview,
                hashtags: rawHashtags,
                recommend_reason: recommendReason,
              };

              // POST 요청
              await travelService.createVisitedContent(latest.id, dto);

              // 홈으로 replace 이동
              router.replace('/(tabs)/home_travel');
            } catch (e) {
              console.error('방문 추가 실패', e);
              Alert.alert('오류', '방문 추가에 실패했습니다.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.container}>
      {/* 배경 이미지 */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
      </View>

      {/* 요약 카드 */}
      {!isExpanded && (
        <TouchableOpacity style={styles.card} activeOpacity={0.8}>
          <View style={styles.cardContent}>
            <View>
              <Text style={styles.cardTitle}>{title}</Text>
              <Text style={styles.cardSubtitle}>{addr1}</Text>
            </View>
            <TouchableOpacity onPress={toggleFavorite}>
              <Text style={[styles.star, favorite && styles.filled]}>
                {favorite ? '★' : '☆'}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}

      {/* 바텀 시트 */}
      <Animated.View style={[styles.sheet, { top: sheetY }]}>
        <View style={styles.handleArea} {...panResponder.panHandlers}>
          <View style={styles.handle} />
          <View style={styles.sheetHeader}>
            <View style={styles.sheetHeaderText}>
              <Text style={styles.sheetTitle}>{title}</Text>
              <Text style={styles.sheetSubtitle}>{addr1}</Text>
            </View>
            <TouchableOpacity onPress={toggleFavorite}>
              <Text style={[styles.star, favorite && styles.filled]}>
                {favorite ? '★' : '☆'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.sheetContent}>
          {/* 혼잡도 정보 */}
          <CrowdStatus status={current?.populartimes?.current_status || null} />
          
          {/* 추천 이유 */}
          {recommendReason && (
            <Text style={styles.overview}>{recommendReason}</Text>
          )}

          {/* 해시태그 */}
          <View style={styles.tagsRow}>
            {hashtags.map(tag => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>

          {/* 지도 미리보기 */}
          <View style={styles.mapPreview}>
            <MapView
              style={StyleSheet.absoluteFillObject}
              initialRegion={{
                latitude,
                longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }}
              // onError={(error) => {
              //   console.error('[info.tsx] MapView error:', error);
              // }}
            >
              <Marker coordinate={{ latitude, longitude }} title={title} />
            </MapView>
          </View>

          {/* 버튼 */}
          <View style={styles.buttonsRow}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() =>
                Linking.openURL(
                  `https://map.kakao.com/link/to/${title},${latitude},${longitude}`
                )
              }
            >
              <Text style={styles.primaryButtonText}>경로 탐색</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleVisit}>
              <Text style={styles.secondaryButtonText}>방문했어요</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Animated.View>

      {/* 뒤로가기 버튼 */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backText}>{'<'}</Text>
      </TouchableOpacity>
    </View>
  );
}

// 혼잡도 표시 컴포넌트
const CrowdStatus = ({ status }: { status: string | null }) => {
  if (!status) return null;
  
  const config = {
    not_busy: { icon: '🟢', text: '여유로움', color: '#4CAF50' },
    normal: { icon: '🟡', text: '보통', color: '#FF9800' },
    busy: { icon: '🔴', text: '혼잡함', color: '#F44336' }
  };
  
  const crowdInfo = config[status as keyof typeof config];
  if (!crowdInfo) return null;
  
  return (
    <View style={styles.crowdStatus}>
      <Text style={styles.crowdLabel}>현재 혼잡도</Text>
      <View style={styles.crowdInfo}>
        <Text style={styles.crowdIcon}>{crowdInfo.icon}</Text>
        <Text style={[styles.crowdText, { color: crowdInfo.color }]}>
          {crowdInfo.text}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f0' },

  imageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.7,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },

  card: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    elevation: 5,
  },
  cardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  cardSubtitle: { fontSize: 14, color: '#4AB7C8', marginTop: 4, textAlign: 'center' },

  star: { fontSize: 24, color: '#ccc' },
  filled: { color: '#4AB7C8' },

  sheet: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: SCREEN_HEIGHT,
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    elevation: 10,
  },
  handleArea: { alignItems: 'center', paddingVertical: 12 },
  handle: { width: 40, height: 6, borderRadius: 3, backgroundColor: '#ccc', marginBottom: 6 },

  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sheetHeaderText: { flex: 1 },

  sheetTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', textAlign: 'left' },
  sheetSubtitle: { fontSize: 14, color: '#4AB7C8', marginTop: 2, textAlign: 'left' },

  sheetContent: { paddingHorizontal: 16 },
  overview: { fontSize: 14, color: '#444', lineHeight: 20, marginBottom: 12, marginTop: 8 },

  // 혼잡도 스타일 추가
  crowdStatus: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#e0e0e0',
  },
  crowdLabel: { 
    fontSize: 12, 
    color: '#666', 
    marginBottom: 4,
    fontWeight: '500'
  },
  crowdInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  crowdIcon: { fontSize: 16, marginRight: 8 },
  crowdText: { fontSize: 14, fontWeight: '600' },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  tag: { backgroundColor: '#e0f7fa', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, margin: 4 },
  tagText: { fontSize: 12, color: '#00796b' },

  mapPreview: { width: '100%', height: 400, borderRadius: 12, overflow: 'hidden', marginBottom: 16 },

  buttonsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  primaryButton: {
    flex: 1,
    backgroundColor: '#4AB7C8',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  primaryButtonText: { fontSize: 16, color: '#fff', fontWeight: '600' },
  secondaryButton: {
    flex: 1,
    borderColor: '#4AB7C8',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginLeft: 8,
  },
  secondaryButtonText: { fontSize: 16, color: '#4AB7C8', fontWeight: '600' },

  backBtn: {
    position: 'absolute',
    top: 40,
    left: 16,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 20,
    padding: 6,
  },
  backText: { fontSize: 24, color: '#4AB7C8' },

  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  error: { color: 'red', marginBottom: 20 },
  retryButton: {
    backgroundColor: '#4AB7C8',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
