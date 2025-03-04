import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  SafeAreaView,
  Image,
  Alert,
  ActivityIndicator
} from 'react-native';
import WebView from 'react-native-webview';
import * as Location from 'expo-location';
import { Card, Avatar, Button, Title, Paragraph } from 'react-native-paper';
import { 
  Clock, 
  MapPin, 
  Truck, 
  CheckSquare, 
  Check, 
  X 
} from 'react-native-feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';


// Time format function (unchanged)
const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};



const PickupDeliverPage = () => {
  // State variables
  const [driverLocation, setDriverLocation] = useState(null);
  const [pickupLocations, setPickupLocations] = useState([]);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [pickups, setPickups] = useState([]);
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [pickupDetails, setPickupDetails] = useState([]);
  const [tracking, setTracking] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(null);
  const [locationSubscription, setLocationSubscription] = useState(null);
  const [pickupList, setPickupList] = useState([]);
  const [selectedPickupStatus, setSelectedPickupStatus] = useState({});
  const [trackingId, setTrackingId] = useState(null);
  const [webViewContent, setWebViewContent] = useState('');
  const [locationPermission, setLocationPermission] = useState(null);

  const navigation = useNavigation(); // navigation 오류 방지
  const [location, setLocation] = useState(null);
  const [hasPermission, setHasPermission] = useState(false);
  
  // Refs
  const webViewRef = useRef(null);

  // API keys - 실제 키로 대체해야 합니다
  const KAKAO_MAP_KEY = '95a754a05dd6038bbb636a608681308a';

  // useEffect(() => {
  //   const requestLocationPermissions = async () => {
  //     try {
  //       // 위치 권한 요청 (foreground)
  //       const { status } = await Location.requestForegroundPermissionsAsync();

  //       if (status !== 'granted') {
  //         Alert.alert(
  //           '위치 권한 필요',
  //           '이 앱은 사용자의 위치 권한을 필요로 합니다.'
  //         );
  //         setLocationPermission(false); // 권한 거부 시 false로 설정
  //         return;
  //       }

  //       // 배경 위치 권한 요청 (optional)
  //       const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();

  //       if (backgroundStatus !== 'granted') {
  //         Alert.alert(
  //           '배경 위치 권한 필요',
  //           '배경에서도 위치 정보를 사용하기 위해 권한이 필요합니다.'
  //         );
  //       }

  //       // 모든 권한이 허용된 경우
  //       setLocationPermission(true); // 권한이 모두 허용되면 true로 설정

  //     } catch (error) {
  //       console.error('위치 권한 요청 오류:', error);
  //       setLocationPermission(false); // 오류 발생 시 false로 설정
  //     }
  //   };

  //   // 권한 요청 함수 호출
  //   requestLocationPermissions();
  // }, []);
  
  useEffect(() => {
    const getLocationPermission = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('위치 권한이 필요합니다.');
        setHasPermission(false);
      } else {
        setHasPermission(true);
      }
    };

    const getCurrentLocation = async () => {
      if (hasPermission) {
        try {
          const { coords } = await Location.getCurrentPositionAsync({});
          setLocation({
            latitude: coords.latitude,
            longitude: coords.longitude,
          });
        } catch (error) {
          console.error('위치 정보를 가져오는 데 실패했습니다:', error);
        }
      }
    };

    getLocationPermission(); // 권한 요청
    getCurrentLocation();    // 위치 정보 가져오기
  }, [hasPermission]);

  // 오늘 날짜 가져오기
  const getToday = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 서버로 위치 업데이트 전송
  const sendLocationUpdate = async (pickupId, latitude, longitude) => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      const response = await fetch('https://refresh-f5-server.o-r.kr/api/pickup/update-location', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          pickupId, 
          latitude, 
          longitude,
          timestamp: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        console.error('위치 업데이트 실패:', response.status);
        const errorData = await response.json().catch(() => ({}));
        console.error('에러 상세:', errorData);
      } else {
        console.log('위치 업데이트 성공');
      }
    } catch (error) {
      console.error('위치 업데이트 오류:', error);
    }
  };




  // 위치 및 지도 초기화
  const initializeLocation = async () => {
    const hasPermission = await requestLocationPermissions();
    if (!hasPermission) return;

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      const { latitude, longitude } = location.coords;
      setDriverLocation({ latitude, longitude });
      
      // WebView에 현재 위치 정보 전달
      updateMapInWebView(latitude, longitude, pickupLocations);
    } catch (error) {
      console.error('현재 위치 가져오기 오류:', error);
      Alert.alert('위치 오류', '현재 위치를 가져올 수 없습니다.');
    }
  };

  // WebView에 지도 업데이트 (카카오맵)
  const updateMapInWebView = (driverLat, driverLng) => {
    // 지도만 표시하는 HTML 코드

  
    setWebViewContent(html); // WebView에 HTML 콘텐츠 설정
  };
  
  const handleWebViewMessage = (event) => {
    if (event.nativeEvent.data === 'map_loaded') {
      setWebViewContent(null); // 로딩 완료 후 "로딩 중" 메시지 숨기기
    }
  };

  // const html = `
  // <html>
  //   <head>
  //     <meta name="viewport" content="width=device-width, initial-scale=1.0">
  //     <script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=f7f8de4a1581a131a576ac4b46a55f35&libraries=services"></script>
  //     <style>
  //       body { margin: 0; padding: 0; height: 100%; }
  //       html { height: 100%; }
  //       #map { width: 100%; height: 100%; }
  //     </style>
  //   </head>
  //   <body>
  //     <div id="map"></div>
  //     <script>
  //       window.onload = function() {
  //         if (typeof kakao !== 'undefined' && kakao.maps) {
  //           const mapContainer = document.getElementById('map');
  //           const mapOption = {
  //             center: new kakao.maps.LatLng(${location.latitude}, ${location.longitude}),
  //             level: 3
  //           };
  //           const map = new kakao.maps.Map(mapContainer, mapOption);
  //           const markerPosition = new kakao.maps.LatLng(${location.latitude}, ${location.longitude});
  //           const marker = new kakao.maps.Marker({
  //             position: markerPosition
  //           });
  //           marker.setMap(map);
  //         }
  //       };
  //     </script>
  //   </body>
  // </html>
  // `;

  function KakaoMap({ latitude, longitude }) {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=f7f8de4a1581a131a576ac4b46a55f35&libraries=services"></script>
        
        </head>
        <body>
          <div id="map" style="width:500px;height:500px;"></div>
          <script>
            window.onload = function() {
              console.log('Kakao Map API Loaded');
              if (typeof kakao !== 'undefined' && kakao.maps) {
                console.log('Kakao Maps is available');
                const mapContainer = document.getElementById('map');
                const mapOption = {
                  center: new kakao.maps.LatLng(${latitude}, ${longitude}),
                  level: 3
                };
                const map = new kakao.maps.Map(mapContainer, mapOption);
  
                // 마커 추가 (선택 사항)
                const markerPosition = new kakao.maps.LatLng(${latitude}, ${longitude});
                const marker = new kakao.maps.Marker({
                  position: markerPosition
                });
                marker.setMap(map);
              } else {
                console.error('Kakao Maps is not available');
              }
            };
          </script>
        </body>
      </html>
    `;

  
    return (
    
        <WebView
          originWhitelist={['*']}
          source={{ html: htmlContent }}
  
          javaScriptEnabled={true}
          domStorageEnabled={true}
          onLoad={() => console.log('WebView loaded successfully')}
          onError={(e) => console.error('WebView error: ', e.nativeEvent)}
          injectedJavaScript={`(function() {
            window.console.log = function(message) {
              window.ReactNativeWebView.postMessage(message);
            }
          })();`}
          onMessage={(event) => console.log(event.nativeEvent.data)}
        />
 
    );
  }
  

  
  // 수거지 목록 가져오기
  const fetchPickups = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      
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
        const errorData = await response.json().catch(() => ({}));
        console.error('수거지 목록 조회 실패:', response.status, errorData);
        throw new Error('수거지 목록을 불러오는데 실패했습니다');
      }
      
      const data = await response.json();
      setPickups(data);
      setPickupList(data);

      // 수거지 상태 초기화
      const initialStatus = data.reduce((acc, pickup) => {
        acc[pickup.pickupId] = false;
        return acc;
      }, {});
      setSelectedPickupStatus(initialStatus);

      // 주소를 좌표로 변환
      await geocodeAddresses(data);
    } catch (error) {
      console.error('수거지 목록 조회 오류:', error);
      Alert.alert('데이터 오류', '수거지 목록을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 주소를 좌표로 변환 (카카오 API 사용)
  const geocodeAddresses = async (pickupData) => {
    try {
      const locations = await Promise.all(
        pickupData.map(async (pickup) => {
          try {
            // 1. Kakao Geocoding API 호출
            const response = await fetch(
              `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(pickup.address.roadNameAddress)}`,
              {
                headers: {
                  Authorization: `KakaoAK ${KAKAO_MAP_KEY}`,
                },
              }
            );
  
            const data = await response.json();
  
            // 2. 응답 데이터가 있는지 확인
            if (data.documents.length === 0) {
              console.warn(`주소 변환 실패: ${pickup.address.roadNameAddress}`);
              return null;
            }
  
            // 3. 첫 번째 결과의 좌표 가져오기
            const { x, y } = data.documents[0]; // x: longitude, y: latitude
  
            return {
              latitude: parseFloat(y),
              longitude: parseFloat(x),
              pickupId: pickup.pickupId,
              title: pickup.address.name,
              description: pickup.address.roadNameAddress,
            };
          } catch (error) {
            console.error('주소 지오코딩 오류:', error);
            return null;
          }
        })
      );
  
      const validLocations = locations.filter((loc) => loc !== null);
      setPickupLocations(validLocations);
  
      // 운전자 위치가 있으면 지도 업데이트
      if (driverLocation) {
        updateMapInWebView(driverLocation.latitude, driverLocation.longitude, validLocations);
      }
    } catch (error) {
      console.error('지오코딩 처리 오류:', error);
      Alert.alert('위치 변환 오류', '주소를 좌표로 변환하는데 실패했습니다.');
    }
  };

  // 수거지 상세 정보 가져오기
  const fetchPickupDetails = async (pickupId) => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      
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
        const errorData = await response.json().catch(() => ({}));
        console.error('수거지 상세 조회 실패:', response.status, errorData);
        throw new Error('수거지 상세 정보를 불러오는데 실패했습니다');
      }
      
      const data = await response.json();
      setPickupDetails(data.details);
    } catch (error) {
      console.error('수거지 상세 조회 오류:', error);
      Alert.alert('데이터 오류', '수거지 상세 정보를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 수거지 목록 항목 선택 처리
  const handlePickupListItemClick = (pickup) => {
    // 이미 추적 중인 다른 수거지가 있을 경우 방지
    if (trackingId && trackingId !== pickup.pickupId) {
      Alert.alert('추적 진행 중', '추적이 활성화된 상태에서는 다른 수거지를 선택할 수 없습니다.');
      return;
    }

    // 선택한 수거지 설정
    setSelectedPickup(pickup);

    // 선택한 수거지의 상세 정보 가져오기
    fetchPickupDetails(pickup.pickupId);

    // 선택 상태 업데이트
    setSelectedPickupStatus((prev) => {
      const newStatus = { ...prev };
      Object.keys(newStatus).forEach((key) => {
        newStatus[key] = key === pickup.pickupId.toString();
      });
      return newStatus;
    });

    // 해당 위치 찾기
    const location = pickupLocations.find(loc => loc.pickupId === pickup.pickupId);
    if (location && driverLocation) {
      // WebView에 위치 정보 업데이트 및 지도 중심 이동
      const script = `
        var newCenter = new kakao.maps.LatLng(${location.latitude}, ${location.longitude});
        map.setCenter(newCenter);
        map.setLevel(3);
      `;
      webViewRef.current?.injectJavaScript(script);
    }
  };

  // 추적 시작
  const startTracking = async () => {
    if (!selectedPickup) {
      Alert.alert('선택 필요', '추적을 시작하려면 수거지를 선택해주세요.');
      return;
    }

    const hasPermission = await requestLocationPermissions();
    if (!hasPermission) return;

    setTrackingId(selectedPickup.pickupId);
    setTracking(true);

    // 타이머 시작
    const timerId = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    setTimer(timerId);

    // 위치 추적 시작
    const subscription = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 10 },
      (location) => {
        const { latitude, longitude } = location.coords;
        
        // 운전자 위치 업데이트
        setDriverLocation({ latitude, longitude });
        
        // 서버에 위치 업데이트 전송
        sendLocationUpdate(selectedPickup.pickupId, latitude, longitude);
        
        // 목적지가 있으면 경로 업데이트
        const destination = pickupLocations.find(loc => loc.pickupId === selectedPickup.pickupId);
        if (destination) {
          // WebView에 위치 정보 업데이트
          const script = `
            // 드라이버 마커 위치 업데이트
            var newPosition = new kakao.maps.LatLng(${latitude}, ${longitude});
            driverMarker.setPosition(newPosition);
            
            // 경로 업데이트 (기존 경로 삭제 후 새로 그리기)
            var paths = [
              new kakao.maps.LatLng(${latitude}, ${longitude}),
              new kakao.maps.LatLng(${destination.latitude}, ${destination.longitude})
            ];
            
            // 기존 폴리라인 모두 제거
            if (window.currentPolyline) {
              window.currentPolyline.setMap(null);
            }
            
            // 새 폴리라인 생성
            window.currentPolyline = new kakao.maps.Polyline({
              path: paths,
              strokeWeight: 5,
              strokeColor: '#FF6B6B',
              strokeOpacity: 0.7,
              strokeStyle: 'solid'
            });
            
            window.currentPolyline.setMap(map);
          `;
          webViewRef.current?.injectJavaScript(script);
          
          // 경로 상태 업데이트
          setRouteCoordinates([
            { latitude, longitude },
            { latitude: destination.latitude, longitude: destination.longitude }
          ]);
        }
      }
    );
    
    setLocationSubscription(subscription);
  };

  // 추적 중지
  const stopTracking = async (pickupId) => {
    if (!pickupId) {
      console.error('수거 ID가 제공되지 않았습니다.');
      return;
    }
    
    // 추적 상태 초기화
    setTrackingId(null);
    setTracking(false);
    clearInterval(timer);
    setTimer(null);
    
    // 위치 업데이트 중지
    if (locationSubscription) {
      locationSubscription.remove();
      setLocationSubscription(null);
    }
    
    // 경로 초기화
    setRouteCoordinates([]);
    
    console.log(`수거 ID ${pickupId}에 대한 위치 추적 중지됨`);
    
    // WebView에서 경로 제거
    const script = `
      if (window.currentPolyline) {
        window.currentPolyline.setMap(null);
        window.currentPolyline = null;
      }
    `;
    webViewRef.current?.injectJavaScript(script);
    
    // 위치 데이터 삭제
    try {
      const token = await AsyncStorage.getItem('token');
      
      const response = await fetch(
        `https://refresh-f5-server.o-r.kr/api/pickup/delete-location?pickupId=${pickupId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('위치 데이터 삭제 실패:', response.status, errorData);
        throw new Error('위치 데이터 삭제에 실패했습니다');
      }
      console.log(`수거 ID ${pickupId}에 대한 위치 데이터가 성공적으로 삭제되었습니다`);
      
      // 수거 완료 요청
      await completePickup(pickupId);
    } catch (error) {
      console.error('위치 삭제 오류:', error);
      Alert.alert('오류', '위치 데이터 삭제 중 문제가 발생했습니다.');
    }
  };
  
  // 수거 완료 처리
  const completePickup = async (pickupId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      const response = await fetch(
        `https://refresh-f5-server.o-r.kr/api/pickup/complete`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            pickupId,
            completionTime: new Date().toISOString(),
            elapsedTimeSeconds: elapsedTime
          })
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('수거 완료 처리 실패:', response.status, errorData);
        throw new Error('수거 완료 처리에 실패했습니다');
      }
      
      console.log(`수거 ID ${pickupId} 완료 처리됨`);
      Alert.alert('완료', '수거가 성공적으로 완료되었습니다.');
      
      // 수거 목록 새로고침
      fetchPickups();
    } catch (error) {
      console.error('수거 완료 처리 오류:', error);
      Alert.alert('오류', '수거 완료 처리 중 문제가 발생했습니다.');
    }
  };

  // 로그아웃 함수
  const handleLogout = async () => {
    try {
      // 로그아웃 API 호출
      const token = await AsyncStorage.getItem('token');
      
      const response = await fetch(
        `https://refresh-f5-server.o-r.kr/api/auth/logout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          }
        }
      );
      
      // 로컬 스토리지 데이터 삭제
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('email');
      await AsyncStorage.removeItem('role');
      await AsyncStorage.removeItem('id');
      
      // 로그인 페이지로 이동
      navigation.navigate('Login');
    } catch (error) {
      console.error('로그아웃 중 오류:', error);
      
      // 오류가 발생해도 로컬 스토리지는 삭제하고 로그인 페이지로 이동
      await AsyncStorage.multiRemove(['token', 'email', 'role', 'id']);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  };

  // 위치 및 지도 초기화 효과
  useEffect(() => {
    initializeLocation();
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
      if (timer) {
        clearInterval(timer);
      }
    };
  }, []);

  // 수거지 목록 가져오기 효과
  useEffect(() => {
    fetchPickups();
    
    // 주기적으로 수거지 목록 새로고침 (5분마다)
    const refreshInterval = setInterval(() => {
      fetchPickups();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, []);

  // 수거지 목록 항목 렌더링
  const renderPickupItem = ({ item }) => {
    const isSelected = selectedPickupStatus[item.pickupId];
    const isTracking = trackingId === item.pickupId;
    const isDisabled = trackingId && trackingId !== item.pickupId;
    
    return (
      <TouchableOpacity
        style={[
          styles.pickupItem,
          isSelected && styles.selectedPickupItem,
          isDisabled && styles.disabledPickupItem
        ]}
        onPress={() => handlePickupListItemClick(item)}
        disabled={isDisabled}
      >
        <View style={styles.pickupItemContent}>
          <View style={styles.pickupItemAvatar}>
            {isSelected ? (
              <Check width={20} height={20} color="#fff" />
            ) : (
              <X width={20} height={20} color="#fff" />
            )}
          </View>
          <View style={styles.pickupItemDetails}>
            <Text style={styles.pickupItemTitle}>{item.address.name}</Text>
            <Text style={styles.pickupItemDescription}>{item.address.roadNameAddress}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[
            styles.actionButton,
            isTracking ? styles.stopButton : styles.startButton,
            isDisabled && styles.disabledButton
          ]}
          onPress={() => isTracking ? stopTracking(item.pickupId) : startTracking()}
          disabled={isDisabled && !isTracking}
        >
          <Text style={styles.actionButtonText}>
            {isTracking ? '수거 종료' : '수거 시작'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>수거지 현황</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>로그아웃</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.mapContainer}>
      {location ? (
        <KakaoMap latitude={location.latitude} longitude={location.longitude} />
      ) : (
        <Text>위치를 가져오는 중입니다...</Text>
      )}
        </View>

        {/* 수거지 상세 정보 카드 */}
        {selectedPickup && (
          <Card style={styles.detailsCard}>
            <Card.Title title="선택한 수거지 정보" />
            <Card.Content>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>수거지:</Text>
                <Text style={styles.detailValue}>{selectedPickup.address.name}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>주소:</Text>
                <Text style={styles.detailValue}>{selectedPickup.address.roadNameAddress}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>수거 ID:</Text>
                <Text style={styles.detailValue}>{selectedPickup.pickupId}</Text>
              </View>
              {tracking && trackingId === selectedPickup.pickupId && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>경과 시간:</Text>
                  <Text style={styles.detailValue}>{formatTime(elapsedTime)}</Text>
                </View>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Pickup List */}
        <View style={styles.pickupListContainer}>
          <Text style={styles.sectionTitle}>오늘의 수거지</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#0000ff" />
          ) : (
            <FlatList
              data={pickupList}
              renderItem={renderPickupItem}
              keyExtractor={(item) => item.pickupId.toString()}
              contentContainerStyle={styles.pickupList}
            />
          )}
        </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#388E3C',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  logoutButton: {
    padding: 8,
    backgroundColor: '#d32f2f',
    borderRadius: 4,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  mainContent: {
    flex: 1,
  },
  mapContainer: {
    height: '50%',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  map: {
    flex: 1,
  },
  driverMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#388E3C',
  },
  detailsCard: {
    margin: 10,
    elevation: 4,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontWeight: 'bold',
    width: 80,
  },
  detailValue: {
    flex: 1,
    color: '#388E3C',
  },
  pickupListContainer: {
    flex: 1,
    padding: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  pickupList: {
    paddingBottom: 20,
  },
  pickupItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedPickupItem: {
    backgroundColor: '#e8f5e9',
  },
  disabledPickupItem: {
    opacity: 0.5,
  },
  pickupItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickupItemAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#757575',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  pickupItemDetails: {
    flex: 1,
  },
  pickupItemTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  pickupItemDescription: {
    fontSize: 14,
    color: '#757575',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#388E3C',
  },
  stopButton: {
    backgroundColor: '#d32f2f',
  },
  disabledButton: {
    backgroundColor: '#bdbdbd',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default PickupDeliverPage;