import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  Animated,
  PanResponder,
  Dimensions
} from 'react-native';
import WebView from 'react-native-webview';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import Carousel from 'react-native-snap-carousel'; // 문제의 원인이 되는 라이브러리 제거
import main from '../styles/main';

const styles = main;
const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

const PickupDeliverPage = () => {
  const [activeTab, setActiveTab] = useState('미완료');
  const [location, setLocation] = useState(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [pickupList, setPickupList] = useState([]);
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [pickupDetails, setPickupDetails] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [showListModal, setShowListModal] = useState(false);
  const [pickupCoordinates, setPickupCoordinates] = useState([]);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [detailPanelY] = useState(new Animated.Value(SCREEN_HEIGHT));
  
  const webViewRef = useRef(null);
  
  // 패널 슬라이드 관련 함수
  const showDetailPanel = () => {
    Animated.spring(detailPanelY, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
    setShowDetails(true);
  };

  const hideDetailPanel = () => {
    Animated.spring(detailPanelY, {
      toValue: SCREEN_HEIGHT,
      useNativeDriver: true,
    }).start(() => setShowDetails(false));
  };
  
  const toggleListModal = () => {
    setShowListModal(!showListModal);
  };
  
  // 지도 스크립트 안전하게 생성하는 함수
  const createMapScript = () => {
    if (!location) return '';
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=f7f8de4a1581a131a576ac4b46a55f35&libraries=services"></script>
          <style>
            body { margin: 0; padding: 0; height: 100%; }
            html { height: 100%; }
            #map { width: 100%; height: 100%; }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script>
            window.onload = function() {
              try {
                if (typeof kakao !== 'undefined' && kakao.maps) {
                  const mapContainer = document.getElementById('map');
                  const mapOption = {
                    center: new kakao.maps.LatLng(${location.latitude}, ${location.longitude}),
                    level: 3
                  };
                  window.map = new kakao.maps.Map(mapContainer, mapOption);
                  
                  // 현재 위치 마커 추가
                  const markerPosition = new kakao.maps.LatLng(${location.latitude}, ${location.longitude});
                  const marker = new kakao.maps.Marker({
                    position: markerPosition
                  });
                  marker.setMap(window.map);
                  
                  // 페이지 로드 완료 알림
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'MAP_LOADED'
                  }));
                } else {
                  console.error('kakao maps is not defined');
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'MAP_ERROR',
                    message: 'kakao maps is not defined'
                  }));
                }
              } catch (error) {
                console.error('Map initialization error:', error);
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'MAP_ERROR',
                  message: error.message
                }));
              }
            };
          </script>
        </body>
      </html>
    `;
  };
  
  // 위치 권한 요청 및 현재 위치 가져오기
  useEffect(() => {
    const getLocationPermission = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            '위치 권한 필요',
            '이 앱은 사용자의 위치 권한을 필요로 합니다.'
          );
          setHasPermission(false);
          // 기본 위치 설정 (서울)
          setLocation({
            latitude: 37.566826,
            longitude: 126.9786567
          });
          setIsLoading(false);
        } else {
          setHasPermission(true);
          getCurrentLocation();
        }
      } catch (error) {
        console.error('위치 권한 요청 오류:', error);
        setHasPermission(false);
        setIsLoading(false);
      }
    };

    const getCurrentLocation = async () => {
      try {
        const { coords } = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High
        });
        setLocation({
          latitude: coords.latitude,
          longitude: coords.longitude,
        });
        setIsLoading(false);
      } catch (error) {
        console.error('위치 정보를 가져오는 데 실패했습니다:', error);
        // 기본 위치 설정 (서울)
        setLocation({
          latitude: 37.566826,
          longitude: 126.9786567
        });
        setIsLoading(false);
      }
    };

    getLocationPermission();
  }, []);

  // 컴포넌트 마운트/언마운트 시 클린업
  useEffect(() => {
    return () => {
      // 컴포넌트 언마운트 시 리소스 정리
      if (webViewRef.current) {
        webViewRef.current = null;
      }
    };
  }, []);

  // 오늘 날짜 가져오기 (YYYY-MM-DD 형식)
  const getToday = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 주소를 좌표로 변환하는 함수 (카카오맵 API 사용)
  const geocodeAddress = async (address) => {
    try {
      // 카카오맵 API 키
      const KAKAO_API_KEY = '95a754a05dd6038bbb636a608681308a';
      
      console.log('지오코딩 요청 주소:', address);

      // 주소 검색 API 호출
      const response = await fetch(
        `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `KakaoAK ${KAKAO_API_KEY}`,
            'Content-Type': 'application/json;charset=UTF-8'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('주소 검색에 실패했습니다');
      }
      
      const data = await response.json();
      
      // 검색 결과가 없는 경우
      if (data.documents.length === 0) {
        return null;
      }
      
      // 첫 번째 결과의 좌표 반환
      const { x, y } = data.documents[0];
      return {
        longitude: parseFloat(x),
        latitude: parseFloat(y)
      };
    } catch (error) {
      console.error('주소 지오코딩 오류:', error);
      return null;
    }
  };

  // 수거지 목록 가져오기
  useEffect(() => {
    fetchPickups();
  }, []);

  const fetchPickups = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        Alert.alert('로그인 필요', '로그인이 필요합니다.');
        setIsLoading(false);
        return;
      }
      
      // API 호출
      const response = await fetch(
        `https://refresh-f5-server.o-r.kr/api/pickup/get-today-pickup?today=${getToday()}`,
        { 
          method: 'GET', 
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('수거지 목록을 불러오는데 실패했습니다');
      }
      
      const data = await response.json();
      setPickupList(data);
      
      // 수거지 주소를 좌표로 변환하고 마커 정보 생성
      const coordinates = await Promise.all(
        data.map(async (pickup) => {
          const addressStr = pickup.address.roadNameAddress;
          const coords = await geocodeAddress(addressStr);
          
          if (coords) {
            return {
              id: pickup.pickupId,
              latitude: coords.latitude,
              longitude: coords.longitude,
              name: pickup.address.name,
              address: pickup.address.roadNameAddress,
              pickup: pickup // 원본 데이터도 함께 저장
            };
          }
          return null;
        })
      );
      
      // null 값 제거
      const validCoordinates = coordinates.filter(coord => coord !== null);
      setPickupCoordinates(validCoordinates);
      
      // 첫 번째 수거지의 상세 정보 가져오기 (있다면)
      if (data.length > 0) {
        fetchPickupDetails(data[0].pickupId);
      }
    } catch (error) {
      console.error('수거지 목록 조회 오류:', error);
      Alert.alert('데이터 오류', '수거지 목록을 불러올 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 수거지 상세 정보 가져오기
  const fetchPickupDetails = async (pickupId) => {
    setIsDetailLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        Alert.alert('로그인 필요', '로그인이 필요합니다.');
        setIsDetailLoading(false);
        return;
      }
      
      // API 호출
      const response = await fetch(
        `https://refresh-f5-server.o-r.kr/api/pickup/get-details?pickupId=${pickupId}`,
        { 
          method: 'GET', 
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('수거지 상세 정보를 불러오는데 실패했습니다');
      }
      
      const data = await response.json();
      setPickupDetails(data);
    } catch (error) {
      console.error('수거지 상세 조회 오류:', error);
      Alert.alert('데이터 오류', '수거지 상세 정보를 불러올 수 없습니다.');
    } finally {
      setIsDetailLoading(false);
    }
  };

  // 마커 클릭 시 수거지 상세 정보 표시
  const handleMarkerClick = (pickup) => {
    // 해당 마커에 맞는 카드로 이동
    const index = pickupList.findIndex(p => p.pickupId === pickup.pickupId);
    if (index !== -1) {
      setActiveCardIndex(index);
      // FlatList는 프로그래매틱 스크롤이 ref를 통해 직접 되지 않아 상태만 업데이트
    }
    
    setSelectedPickup(pickup);
    fetchPickupDetails(pickup.pickupId);
  };

  // 목록에서 수거지 선택 시 처리
  const handlePickupSelect = (pickup) => {
    // 해당 수거지로 스크롤
    const index = pickupList.findIndex(p => p.pickupId === pickup.pickupId);
    // FlatList는 직접 참조로 이동할 수 없으므로 상태만 업데이트
    if (index !== -1) {
      setActiveCardIndex(index);
    }
    
    setSelectedPickup(pickup);
    fetchPickupDetails(pickup.pickupId);
    setShowListModal(false); // 목록 모달 닫기
    
    // 해당 위치로 지도 이동
    const coordinate = pickupCoordinates.find(c => c.id === pickup.pickupId);
    if (coordinate && webViewRef.current) {
      // 지도 중심 이동 스크립트
      const moveMapScript = `
        const newCenter = new kakao.maps.LatLng(${coordinate.latitude}, ${coordinate.longitude});
        map.setCenter(newCenter);
        map.setLevel(3);
      `;
      webViewRef.current.injectJavaScript(moveMapScript);
    }
  };

  // 수거지 마커 웹뷰에 추가하기
  const sendPickupLocationsToWebView = () => {
    if (!location || !webViewRef || !webViewRef.current || !pickupCoordinates || pickupCoordinates.length === 0) {
      console.log('마커 추가 조건 불충족:', {
        hasLocation: !!location,
        hasWebViewRef: !!webViewRef?.current,
        coordinatesCount: pickupCoordinates?.length || 0
      });
      return;
    }
    
    console.log('수거지 마커 추가 시작:', pickupCoordinates.length);
    
    const script = `
      try {
        // 기존 마커 모두 제거
        if (window.pickupMarkers) {
          window.pickupMarkers.forEach(marker => marker.setMap(null));
        }
        window.pickupMarkers = [];
        
        // 수거지 마커 추가
        const pickupLocations = ${JSON.stringify(pickupCoordinates)};
        console.log("마커 위치 데이터:", pickupLocations.length);
        
        if (typeof kakao === 'undefined' || !kakao.maps || !window.map) {
          console.error('카카오맵 객체가 초기화되지 않았습니다');
          return true;
        }
        
        pickupLocations.forEach((loc, index) => {
          console.log(\`마커 \${index} 추가: \${loc.latitude}, \${loc.longitude}\`);
          const pickupPosition = new kakao.maps.LatLng(loc.latitude, loc.longitude);
          const pickupMarker = new kakao.maps.Marker({
            position: pickupPosition,
            image: new kakao.maps.MarkerImage(
              'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png',
              new kakao.maps.Size(24, 35)
            )
          });
          
          pickupMarker.setMap(window.map);
          window.pickupMarkers.push(pickupMarker);
          
          // 마커 클릭 이벤트 추가
          kakao.maps.event.addListener(pickupMarker, 'click', function() {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'MARKER_CLICK',
              pickupId: loc.id,
              name: loc.name,
              address: loc.address
            }));
          });
        });
        
        // 마커가 모두 표시되도록 지도 범위 재설정
        if (window.pickupMarkers.length > 0) {
          const bounds = new kakao.maps.LatLngBounds();
          window.pickupMarkers.forEach(marker => {
            bounds.extend(marker.getPosition());
          });
          window.map.setBounds(bounds);
        }
        
        console.log("마커 추가 완료");
      } catch (error) {
        console.error('마커 추가 오류:', error);
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'MARKER_ERROR',
          message: error.message
        }));
      }
      true; // 이 값을 반환하여 스크립트 실행 완료 확인
    `;
    
    console.log('WebView에 스크립트 주입');
    webViewRef.current.injectJavaScript(script);
  };

  // WebView 메시지 처리
  const handleWebViewMessage = (event) => {
    try {
      if (!event || !event.nativeEvent || !event.nativeEvent.data) return;
      
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'MARKER_CLICK') {
        const coordInfo = pickupCoordinates?.find?.(c => c.id === data.pickupId);
        if (coordInfo && coordInfo.pickup) {
          handleMarkerClick(coordInfo.pickup);
        }
      } else if (data.type === 'MAP_LOADED') {
        // 지도 로드 완료 시 마커 추가
        setTimeout(() => sendPickupLocationsToWebView(), 500);
      } else if (data.type === 'MAP_ERROR' || data.type === 'MARKER_ERROR') {
        console.error('WebView 에러:', data.message);
      }
    } catch (e) {
      console.error('WebView 메시지 처리 오류:', e);
    }
  };

  // 웹뷰가 로드된 후 수거지 마커 추가
  useEffect(() => {
    if (location && pickupCoordinates && pickupCoordinates.length > 0 && webViewRef && webViewRef.current) {
      setTimeout(() => {
        sendPickupLocationsToWebView();
      }, 1000); // 웹뷰 로드 후 마커 추가를 위해 약간의 딜레이
    }
  }, [location, pickupCoordinates]);

  // 수거 시작 함수
  const startPickup = async (pickupId) => {
    Alert.alert('수거 시작', '이 수거를 시작하시겠습니까?', [
      {
        text: '취소',
        style: 'cancel'
      },
      {
        text: '확인',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
              Alert.alert('로그인 필요', '로그인이 필요합니다.');
              return;
            }
            
            // 수거 시작 API 호출
            const response = await fetch(
              `https://refresh-f5-server.o-r.kr/api/pickup/start`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  pickupId: pickupId,
                  startTime: new Date().toISOString()
                })
              }
            );
            
            if (!response.ok) {
              throw new Error('수거 시작 처리 실패');
            }
            
            Alert.alert('수거 시작', '수거가 시작되었습니다.');
            // 목록 새로고침
            fetchPickups();
          } catch (error) {
            console.error('수거 시작 처리 오류:', error);
            Alert.alert('오류', '수거 시작 처리 중 문제가 발생했습니다.');
          }
        }
      }
    ]);
  };

  // 시간 포맷팅 함수 (HH:MM 형식으로 변환)
  const formatTime = (dateTimeString) => {
    if (!dateTimeString) return '';
    
    const date = new Date(dateTimeString);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${hours}:${minutes}`;
  };

  // 스와이프 가능한 카드 렌더링 함수
  const renderPickupCard = ({ item }) => {
    return (
      <View style={[styles.pickupCard, {width: SCREEN_WIDTH - 40}]}>
        <View style={styles.pickupCardHeader}>
          <Text style={styles.pickupTitle}>{item.address.roadNameAddress}</Text>
          <View style={styles.navigationIcon}>
            <View style={styles.circle}>
              <Text style={styles.navText}>▲</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.pickupDetails}>
          <Text style={styles.detailLabel}>수거자 명: <Text style={styles.detailValue}>{item.address.name}</Text></Text>
          <Text style={styles.detailLabel}>전화번호: <Text style={styles.detailValue}>{item.address.phone}</Text></Text>
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={{
              flex: 1, 
              backgroundColor: '#e57373', 
              borderRadius: 5, 
              paddingVertical: 12, 
              alignItems: 'center',
              marginRight: 10
            }}
          >
            <Text style={{color: 'white', fontWeight: 'bold'}}>취소하기</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.collectButton}
            onPress={() => startPickup(item.pickupId)}
          >
            <Text style={styles.collectButtonText}>수거하기</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // 상세 정보 패널 (하단에서 올라오는 뷰)
  const renderDetailPanel = () => {
    // 현재 선택된 수거지가 없으면 렌더링하지 않음
    if (!pickupList || pickupList.length === 0 || activeCardIndex < 0 || activeCardIndex >= pickupList.length) return null;
    
    // 현재 선택된 수거지
    const selectedPickup = pickupList[activeCardIndex];
    
    if (!selectedPickup) return null;
    
    return (
      <Animated.View
        style={[
          styles.detailsSlideContainer,
          { transform: [{ translateY: detailPanelY }] }
        ]}
      >
        <TouchableOpacity 
          style={styles.slideHandle} 
          onPress={hideDetailPanel}
        >
          <View style={styles.handleBar} />
          <Text style={styles.sectionTitle}>수거 상세 정보</Text>
        </TouchableOpacity>
        
        {isDetailLoading ? (
          <View style={styles.detailLoadingContainer}>
            <ActivityIndicator size="large" color="#5c8d62" />
            <Text style={styles.detailLoadingText}>상세 정보를 불러오는 중...</Text>
          </View>
        ) : pickupDetails ? (
          <ScrollView style={styles.detailsContent}>
            {/* 수거 정보 섹션 */}
            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>수거 정보</Text>
              
              <View style={styles.infoTable}>
                <View style={styles.tableRow}>
                  <View style={styles.tableCell}>
                    <Text style={styles.cellTitle}>수거 주소</Text>
                  </View>
                  <View style={{
                    padding: 12,
                    flex: 2
                  }}>
                    <Text style={styles.cellContent}>
                      {pickupDetails.roadNameAddress} {pickupDetails.detailedAddress}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.tableRow}>
                  <View style={styles.tableCell}>
                    <Text style={styles.cellTitle}>수거 날짜 및 시간</Text>
                  </View>
                  <View style={{
                    padding: 12,
                    flex: 2
                  }}>
                    <Text style={styles.cellContent}>
                      {selectedPickup?.pickupDate?.substring(0, 16).replace('T', ' ')}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.tableRow}>
                  <View style={styles.tableCell}>
                    <Text style={styles.cellTitle}>수거 예상 금액</Text>
                  </View>
                  <View style={{
                    padding: 12,
                    flex: 2
                  }}>
                    <Text style={styles.cellContent}>
                      {pickupDetails.pricePreview?.toLocaleString()}원
                    </Text>
                  </View>
                </View>
                
                <View style={styles.tableRow}>
                  <View style={styles.tableCell}>
                    <Text style={styles.cellTitle}>수거 실재 금액</Text>
                  </View>
                  <View style={{
                    padding: 12,
                    flex: 2
                  }}>
                    <Text style={styles.cellContent}>
                      {pickupDetails.price ? pickupDetails.price.toLocaleString() + '원' : '-'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* 폐기물 세부 내역 섹션 */}
            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>폐기물 세부 내역</Text>
              
              <View style={styles.infoTable}>
                {pickupDetails.details?.map((item, index) => (
                  <View key={index} style={styles.tableRow}>
                    <View style={styles.tableCell}>
                      <Text style={styles.cellTitle}>품목 {index + 1}</Text>
                    </View>
                    <View style={{
                      padding: 12,
                      flex: 2
                    }}>
                      <Text style={styles.cellContent}>품목: {item.wasteName}</Text>
                      <Text style={styles.cellContent}>무게: {item.weight}kg</Text>
                      <Text style={styles.cellContent}>
                        예상 금액: {item.pricePreview?.toLocaleString()}원
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        ) : (
          <View style={styles.detailLoadingContainer}>
            <Text style={styles.detailLoadingText}>수거지를 선택하면 상세 정보가 표시됩니다.</Text>
          </View>
        )}
      </Animated.View>
    );
  };

  // 수거지 목록 렌더링 아이템
  const renderPickupItem = ({ item }) => {
    const isCompleted = item.status === '완료';
    const buttonColor = isCompleted ? styles.completedButton : styles.pendingButton;
    const buttonText = isCompleted ? '완료' : '미완료';
    
    return (
      <TouchableOpacity
        style={styles.pickupListItem}
        onPress={() => handlePickupSelect(item)}
      >
        <View style={styles.pickupListItemContent}>
          <Text style={styles.pickupListItemAddress}>{item.address.roadNameAddress}</Text>
          <View style={styles.pickupListItemDetails}>
            <Text style={styles.pickupListItemText}>
              {item.address.name} {item.address.waste || ''}
            </Text>
            <Text style={styles.pickupListItemTime}>
              {formatTime(item.pickupDate)} 예정
            </Text>
          </View>
        </View>
        <View style={[styles.pickupStatusButton, buttonColor]}>
          <Text style={styles.pickupStatusButtonText}>{buttonText}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={toggleListModal}>
          <Text style={styles.menuButtonText}>≡ 지도보기</Text>
        </TouchableOpacity>
        
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>REFRESH</Text>
          <Text style={styles.logoSubtext}>DRIVER</Text>
        </View>
        
        <TouchableOpacity style={styles.loginButton}>
          <Text style={styles.loginButtonText}>확인하기</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === '미완료' && styles.activeTab]}
          onPress={() => setActiveTab('미완료')}
        >
          <Text style={[styles.tabText, activeTab === '미완료' && styles.activeTabText]}>미완료 수거</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === '완료' && styles.activeTab]}
          onPress={() => setActiveTab('완료')}
        >
          <Text style={[styles.tabText, activeTab === '완료' && styles.activeTabText]}>완료</Text>
        </TouchableOpacity>
      </View>

      {/* Map View */}
      <View style={styles.mapContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>위치를 불러오는 중...</Text>
          </View>
        ) : location ? (
          <WebView
            ref={webViewRef}
            style={styles.mapPlaceholder}
            originWhitelist={['*']}
            source={{
              html: createMapScript()
            }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            onMessage={handleWebViewMessage}
            onError={(e) => console.error('WebView 오류:', e.nativeEvent)}
          />
        ) : (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>위치 정보를 찾을 수 없습니다.</Text>
          </View>
        )}
      </View>
      
      {/* 스와이프 가능한 카드 컨테이너 */}
      {pickupList.length > 0 && (
        <View style={{position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10}}>
          {/* Carousel 대신 FlatList 사용 */}
          <FlatList
            data={pickupList}
            renderItem={renderPickupCard}
            keyExtractor={(item) => item.pickupId.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const index = Math.floor(
                event.nativeEvent.contentOffset.x / (SCREEN_WIDTH - 40)
              );
              setActiveCardIndex(index);
              // 카드 변경 시 해당 수거지 상세 정보 가져오기
              if (pickupList && pickupList[index] && pickupList[index].pickupId) {
                fetchPickupDetails(pickupList[index].pickupId);
              }
              
              // 지도 중심 이동 (해당 위치로)
              const coordinate = pickupCoordinates && pickupCoordinates.find && pickupList && pickupList[index]
                ? pickupCoordinates.find(c => c.id === pickupList[index].pickupId)
                : null;
                
              if (coordinate && webViewRef && webViewRef.current) {
                const moveMapScript = `
                  if (typeof kakao !== 'undefined' && kakao.maps && window.map) {
                    const newCenter = new kakao.maps.LatLng(${coordinate.latitude}, ${coordinate.longitude});
                    window.map.setCenter(newCenter);
                    // 해당 마커 클릭 이벤트 발생시키기
                    if (window.pickupMarkers && window.pickupMarkers[${index}]) {
                      kakao.maps.event.trigger(window.pickupMarkers[${index}], 'click');
                    }
                  }
                `;
                webViewRef.current.injectJavaScript(moveMapScript);
              }
            }}
            contentContainerStyle={{
              paddingHorizontal: 20
            }}
          />
        </View>
      )}
      
      {/* 상세 정보 패널 */}
      {renderDetailPanel()}
      
      {/* 수거지 목록 모달 */}
      <Modal
        visible={showListModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowListModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={{flex: 1, backgroundColor: 'white'}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>수거지 목록</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowListModal(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.tabContainer}>
              <TouchableOpacity 
                style={[styles.tab, activeTab === '미완료' && styles.activeTab]}
                onPress={() => setActiveTab('미완료')}
              >
                <Text style={[styles.tabText, activeTab === '미완료' && styles.activeTabText]}>미완료 수거</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tab, activeTab === '완료' && styles.activeTab]}
                onPress={() => setActiveTab('완료')}
              >
                <Text style={[styles.tabText, activeTab === '완료' && styles.activeTabText]}>완료 수거</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={pickupList ? pickupList.filter(item => activeTab === '완료' ? item.status === '완료' : item.status !== '완료') : []}
              renderItem={renderPickupItem}
              keyExtractor={item => item.pickupId.toString()}
              contentContainerStyle={styles.pickupListContainer}
              ListEmptyComponent={
                <View style={styles.emptyListContainer}>
                  <Text style={styles.emptyListText}>
                    {activeTab === '완료' ? '완료된 수거가 없습니다.' : '미완료 수거가 없습니다.'}
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default PickupDeliverPage;