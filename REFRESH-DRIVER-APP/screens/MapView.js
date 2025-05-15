import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Alert,
  Platform
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import * as Linking from 'expo-linking';
import * as IntentLauncher from 'expo-intent-launcher';
import * as WebBrowser from 'expo-web-browser';

const { width, height } = Dimensions.get('window');

const MapView = ({ toggleViewMode, pickupCoordinates, selectedPickups, clearAllSelections, handleMarkerClick }) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentLocation, setCurrentLocation] = useState({
    latitude: 37.566826,  // 기본값: 서울 시청
    longitude: 126.9786567
  });
  const [locationError, setLocationError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [routeInfo, setRouteInfo] = useState(null);
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const webViewRef = useRef(null);

  // 위치 권한 요청 및 현재 위치 가져오기
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationError('위치 접근 권한이 필요합니다');
          Alert.alert('위치 권한 필요', '이 앱은 사용자의 위치 권한을 필요로 합니다.');
          setIsLoading(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High
        });
        
        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });
        
      } catch (error) {
        console.error('위치 정보를 가져오는 데 실패했습니다:', error);
        setLocationError('위치 정보를 가져오는 데 실패했습니다');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // 지도가 로드된 후 현재 위치와 수거지 마커 업데이트
  useEffect(() => {
    if (mapLoaded && webViewRef.current) {
      // 현재 위치 업데이트
      webViewRef.current.postMessage(JSON.stringify({
        type: 'UPDATE_LOCATION',
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude
      }));
      
      // 수거지 마커 추가
      if (pickupCoordinates && pickupCoordinates.length > 0) {
        webViewRef.current.postMessage(JSON.stringify({
          type: 'ADD_PICKUPS',
          locations: pickupCoordinates
        }));
      }
    }
  }, [mapLoaded, currentLocation, pickupCoordinates]);

  // 선택된 수거지가 변경되면 경로 업데이트
  useEffect(() => {
    if (mapLoaded && webViewRef.current) {
      if (selectedPickups && selectedPickups.length > 0) {
        webViewRef.current.postMessage(JSON.stringify({
          type: 'SHOW_ROUTE',
          locations: selectedPickups
        }));
      } else {
        webViewRef.current.postMessage(JSON.stringify({
          type: 'CLEAR_ROUTE'
        }));
        setOptimizedRoute(null);
      }
    }
  }, [mapLoaded, selectedPickups]);

  // 카카오 내비 실행 함수
 // 카카오 내비 실행 함수
// 카카오 내비 실행 함수
// 카카오 내비 실행 함수 - 수정된 버전
// 카카오 내비 실행 함수 - 경유지 형식 수정
// 카카오 내비 실행 함수 - 경유지 형식 수정
// 카카오 내비 실행 함수 - 수정된 버전
const launchKakaoNavi = async () => {
    try {
      if (!selectedPickups || selectedPickups.length === 0) {
        Alert.alert('알림', '내비게이션을 시작하려면 최소 한 개의 수거지를 선택해주세요.');
        return;
      }
  
      // 출발지는 현재 위치
      const startX = currentLocation.longitude;
      const startY = currentLocation.latitude;
      
      // 목적지는 마지막 수거지
      const destination = selectedPickups[selectedPickups.length - 1];
      const destX = destination.longitude;
      const destY = destination.latitude;
      
      // 경유지는 중간 수거지들 (최대 3개)
      const waypoints = selectedPickups.slice(0, -1).slice(0, 3);
      
      // 카카오맵 앱 URL 생성 - 기본 경로
      let appURL = `kakaomap://route?sp=${startY},${startX}&ep=${destY},${destX}&by=CAR`;
      
      // 경유지 추가 (최대 3개)
      if (waypoints.length > 0) {
        waypoints.forEach((point, index) => {
          appURL += `&via${index+1}=${point.latitude},${point.longitude}`;
        });
      }
      
      console.log('카카오맵 URL:', appURL);
      
      // 바로 앱 URL 열기 시도
      Linking.openURL(appURL).catch(err => {
        console.log('앱 실행 오류:', err);
        
        // 앱이 없는 경우에만 여기로 오게 됨
        Alert.alert(
          '카카오맵 필요',
          '경유지를 포함한 내비게이션을 사용하려면 카카오맵 앱이 필요합니다. 설치하시겠습니까?',
          [
            {
              text: '취소',
              style: 'cancel'
            },
            {
              text: '설치하기',
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('https://itunes.apple.com/app/id304608425');
                } else {
                  Linking.openURL('market://details?id=net.daum.android.map');
                }
              }
            }
          ]
        );
      });
    } catch (error) {
      console.error('내비게이션 실행 오류:', error);
      Alert.alert('오류', '내비게이션을 실행할 수 없습니다: ' + error.message);
    }
  };
  
  

  // 내비게이션 시작
  const startNavigation = () => {
    if (!selectedPickups || selectedPickups.length === 0) {
      Alert.alert('알림', '내비게이션을 시작하려면 최소 한 개의 수거지를 선택해주세요.');
      return;
    }

    // 최적화된 경로가 있으면 그 경로 사용, 없으면 선택된 순서대로 사용
    const routeToUse = optimizedRoute || selectedPickups;
    
    // 목적지는 마지막 수거지
    const destination = {
      name: '최종 목적지',
      latitude: routeToUse[routeToUse.length - 1].latitude,
      longitude: routeToUse[routeToUse.length - 1].longitude
    };
    
    // 경유지는 중간 수거지들
    const waypoints = routeToUse.slice(0, -1).map((pickup, index) => ({
      name: `수거지 ${index + 1}`,
      latitude: pickup.latitude,
      longitude: pickup.longitude
    }));
    
    // 카카오 내비 실행
    launchKakaoNavi(destination, waypoints);
  };

  // 지도 HTML 생성 - 현재 위치 반영
  const generateMapHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <style>
            body, html { 
              margin: 0; 
              padding: 0; 
              width: 100%; 
              height: 100%; 
              overflow: hidden;
            }
            #map { 
              width: 100%; 
              height: 100%; 
              background-color: #f5f5f5;
            }
            .custom-overlay {
              position: absolute;
              background: #fff;
              border: 1px solid #ccc;
              border-radius: 5px;
              padding: 5px 10px;
              font-size: 12px;
              box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            }
            .current-location-overlay {
              position: absolute;
              background: #3B88C3;
              color: white;
              border-radius: 5px;
              padding: 5px 10px;
              font-size: 12px;
              box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            }
            .route-info {
              position: absolute;
              bottom: 20px;
              left: 50%;
              transform: translateX(-50%);
              background-color: #5c8d62;
              color: white;
              padding: 10px 15px;
              border-radius: 20px;
              font-size: 14px;
              font-weight: bold;
              box-shadow: 0 2px 5px rgba(0,0,0,0.2);
              z-index: 100;
              display: none;
            }
            .route-options {
              position: absolute;
              top: 10px;
              left: 50%;
              transform: translateX(-50%);
              background-color: white;
              border-radius: 5px;
              box-shadow: 0 2px 5px rgba(0,0,0,0.2);
              padding: 8px 12px;
              display: flex;
              align-items: center;
              z-index: 100;
            }
            .option-label {
              font-size: 12px;
              margin-right: 8px;
            }
            .option-buttons {
              display: flex;
            }
            .option-button {
              border: 1px solid #ddd;
              background-color: white;
              padding: 4px 8px;
              margin: 0 2px;
              font-size: 12px;
              cursor: pointer;
              border-radius: 3px;
            }
            .option-button.active {
              background-color: #4B89DC;
              color: white;
              border-color: #4B89DC;
            }
            .loading-indicator {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              background-color: rgba(0, 0, 0, 0.7);
              color: white;
              padding: 15px 20px;
              border-radius: 10px;
              font-size: 14px;
              display: none;
              z-index: 1000;
            }
          </style>
          <script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=30a7f8ffd1d5af779f063d9fa779b8b4&libraries=services&autoload=false"></script>
        </head>
        <body>
          <div id="map"></div>
          <div id="routeInfo" class="route-info">경로 정보 로딩 중...</div>
          <div id="routeOptions" class="route-options">
            <div class="option-label">경로 옵션:</div>
            <div class="option-buttons">
              <button id="optRecommend" class="option-button active">추천</button>
              <button id="optTime" class="option-button">최단시간</button>
              <button id="optDistance" class="option-button">최단거리</button>
            </div>
          </div>
          <div id="loadingIndicator" class="loading-indicator">경로 계산 중...</div>
          
          <script>
            // 디버깅용 오류 핸들러
            window.onerror = function(message, source, lineno, colno, error) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'ERROR',
                message: message
              }));
              console.log('Error:', message);
              return true;
            };
            
            var map;
            var currentMarker;
            var pickupMarkers = [];
            var pickupOverlays = [];
            var polylines = [];
            
            // 현재 경로 옵션 및 경로 위치 저장
            window.currentRouteOption = 'RECOMMEND';
            window.currentRouteLocations = [];
            
            // 카카오맵 로드
            kakao.maps.load(function() {
              console.log('카카오맵 로드 완료');
              initMap();
            });
            
            // 지도 초기화
            function initMap() {
              try {
                var mapContainer = document.getElementById('map');
                var mapOptions = {
                  center: new kakao.maps.LatLng(${currentLocation.latitude}, ${currentLocation.longitude}),
                  level: 5
                };
                
                map = new kakao.maps.Map(mapContainer, mapOptions);
                console.log('지도 초기화 완료');
                
                // 현재 위치 마커 추가
                currentMarker = new kakao.maps.Marker({
                  position: new kakao.maps.LatLng(${currentLocation.latitude}, ${currentLocation.longitude}),
                  image: new kakao.maps.MarkerImage(
                    'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png',
                    new kakao.maps.Size(24, 35)
                  )
                });
                currentMarker.setMap(map);
                
                // 현재 위치 오버레이
                var currentOverlay = new kakao.maps.CustomOverlay({
                  position: new kakao.maps.LatLng(${currentLocation.latitude}, ${currentLocation.longitude}),
                  content: '<div class="current-location-overlay">현재 위치</div>',
                  yAnchor: 1.5
                });
                currentOverlay.setMap(map);
                
                // 경로 옵션 이벤트 설정
                setupRouteOptions();
                
                // 지도 로드 완료 메시지
                window.ReactNativeWebView.postMessage('MAP_LOADED');
              } catch (error) {
                console.log('지도 초기화 오류:', error);
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'ERROR',
                  message: '지도 초기화 오류: ' + error.message
                }));
              }
            }
            
            // 경로 옵션 설정
            function setupRouteOptions() {
              document.getElementById('optRecommend').addEventListener('click', function() {
                setRouteOption('RECOMMEND');
              });
              
              document.getElementById('optTime').addEventListener('click', function() {
                setRouteOption('TIME');
              });
              
              document.getElementById('optDistance').addEventListener('click', function() {
                setRouteOption('DISTANCE');
              });
            }
            
            // 경로 옵션 변경
            function setRouteOption(option) {
              // 활성 버튼 스타일 변경
              document.querySelectorAll('.option-button').forEach(btn => {
                btn.classList.remove('active');
              });
              
              let activeBtn;
              switch(option) {
                case 'RECOMMEND':
                  activeBtn = document.getElementById('optRecommend');
                  break;
                case 'TIME':
                  activeBtn = document.getElementById('optTime');
                  break;
                case 'DISTANCE':
                  activeBtn = document.getElementById('optDistance');
                  break;
              }
              
              if (activeBtn) activeBtn.classList.add('active');
              
              // 현재 경로 옵션 저장
              window.currentRouteOption = option;
              
              // 현재 표시된 경로가 있으면 다시 계산
              if (window.currentRouteLocations && window.currentRouteLocations.length > 0) {
                showRoute(window.currentRouteLocations);
              }
            }
            
            // 수거지 마커 추가
            function addPickupMarkers(locations) {
              try {
                // 기존 마커 제거
                clearPickupMarkers();
                
                if (!locations || locations.length === 0) return;
                
                var bounds = new kakao.maps.LatLngBounds();
                
                // 현재 위치 포함
                bounds.extend(currentMarker.getPosition());
                
                // 각 수거지 마커 추가
                locations.forEach(function(loc, index) {
                  var position = new kakao.maps.LatLng(loc.latitude, loc.longitude);
                  bounds.extend(position);
                  
                  var marker = new kakao.maps.Marker({
                    position: position,
                    map: map
                  });
                  
                  pickupMarkers.push(marker);
                  
                  // 마커 클릭 이벤트
                  kakao.maps.event.addListener(marker, 'click', function() {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'MARKER_CLICKED',
                      id: loc.id,
                      index: index
                    }));
                  });
                  
                  // 수거지 오버레이
                  var overlayContent = '<div class="custom-overlay">수거지 ' + (index + 1) + '</div>';
                  var overlay = new kakao.maps.CustomOverlay({
                    position: position,
                    content: overlayContent,
                    yAnchor: 1.5
                  });
                  
                  overlay.setMap(map);
                  pickupOverlays.push(overlay);
                });
                
                // 모든 마커가 보이도록 지도 범위 조정
                map.setBounds(bounds);
              } catch (error) {
                console.log('수거지 마커 추가 오류:', error);
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'ERROR',
                  message: '수거지 마커 추가 오류: ' + error.message
                }));
              }
            }
            
            // 수거지 마커 제거
            function clearPickupMarkers() {
              pickupMarkers.forEach(function(marker) {
                marker.setMap(null);
              });
              pickupMarkers = [];
              
              pickupOverlays.forEach(function(overlay) {
                overlay.setMap(null);
              });
              pickupOverlays = [];
            }
            
            // 카카오 모빌리티 API를 이용한 경로 탐색
            async function fetchRouteWithKakaoMobility(origin, waypoints, destination) {
              try {
                const REST_API_KEY = '90fc3c147a2997ec441fd2cd8e87e2a8'; // 실제 사용 시 보안을 위해 서버에서 처리하는 것이 좋습니다
                
                // 출발지 좌표 설정
                const originObj = {
                  x: origin.getLng().toString(),
                  y: origin.getLat().toString()
                };
                
                // 목적지 좌표 설정
                const destinationObj = {
                  x: destination.getLng().toString(),
                  y: destination.getLat().toString()
                };
                
                // 경유지 좌표 배열 생성
                const waypointsArr = waypoints.map(point => ({
                  x: point.getLng().toString(),
                  y: point.getLat().toString()
                }));
                
                // API 요청 데이터 구성
                const requestData = {
                  origin: originObj,
                  destination: destinationObj,
                  waypoints: waypointsArr,
                  priority: window.currentRouteOption, // 경로 우선순위
                  car_fuel: 'GASOLINE',
                  alternatives: false,
                  road_details: true
                };
                
                // API 호출
                const response = await fetch('https://apis-navi.kakaomobility.com/v1/waypoints/directions', {
                  method: 'POST',
                  headers: {
                    'Authorization': \`KakaoAK \${REST_API_KEY}\`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(requestData)
                });
                
                if (!response.ok) {
                  throw new Error(\`API 호출 실패: \${response.status}\`);
                }
                
                const data = await response.json();
                return data;
              } catch (error) {
                console.error('카카오 모빌리티 API 호출 오류:', error);
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'ERROR',
                  message: '경로 탐색 오류: ' + error.message
                }));
                return null;
              }
            }
            
            // 카카오 모빌리티 API를 이용한 경로 표시
            async function showRoute(locations) {
              try {
                // 로딩 표시
                document.getElementById('loadingIndicator').style.display = 'block';
                
                // 현재 경로 저장
                window.currentRouteLocations = locations;
                
                // 기존 경로 제거
                clearPolylines();
                
                if (!locations || locations.length === 0) {
                  document.getElementById('routeInfo').style.display = 'none';
                  document.getElementById('loadingIndicator').style.display = 'none';
                  return;
                }
                
                // 좌표 배열 생성
                var points = [];
                const origin = currentMarker.getPosition(); // 현재 위치
                points.push(origin);
                
                // 경유지 좌표 배열
                var waypoints = [];
                
                // 각 수거지 위치 추가
                locations.forEach(function(loc, index) {
                  if (index < locations.length - 1) {
                    // 마지막이 아닌 지점은 경유지로 처리
                    waypoints.push(new kakao.maps.LatLng(loc.latitude, loc.longitude));
                  } else {
                    // 마지막 지점은 목적지로 처리
                    points.push(new kakao.maps.LatLng(loc.latitude, loc.longitude));
                  }
                });
                
                // 모든 지점을 points에 추가 (시각화용)
                waypoints.forEach(wp => points.push(wp));
                
                // 목적지 설정 (마지막 수거지 또는 현재 위치로 돌아오기)
                const destination = locations.length > 0 
                  ? new kakao.maps.LatLng(locations[locations.length - 1].latitude, locations[locations.length - 1].longitude)
                  : origin;
                
                // 카카오 모빌리티 API 호출
                const routeData = await fetchRouteWithKakaoMobility(origin, waypoints, destination);
                
                // 로딩 숨기기
                document.getElementById('loadingIndicator').style.display = 'none';
                
                if (!routeData || !routeData.routes || routeData.routes.length === 0) {
                  throw new Error('경로 데이터를 받아오지 못했습니다.');
                }
                
                // 첫 번째 경로 사용
                const route = routeData.routes[0];
                
                // 총 거리 및 시간
                const totalDistance = route.summary.distance;  // 미터 단위
                const totalDuration = route.summary.duration;  // 초 단위
                
                // 경로 좌표 추출
                const pathCoordinates = [];
                
                // 각 구간의 좌표 추출
                route.sections.forEach(section => {
                  section.roads.forEach(road => {
                    road.vertexes.forEach((vertex, i) => {
                      if (i % 2 === 0 && i + 1 < road.vertexes.length) {
                        const lat = road.vertexes[i + 1];
                        const lng = road.vertexes[i];
                        pathCoordinates.push(new kakao.maps.LatLng(lat, lng));
                      }
                    });
                  });
                });
                
                // 경로 선 그리기
                const polyline = new kakao.maps.Polyline({
                  path: pathCoordinates,
                  strokeWeight: 5,
                  strokeColor: '#4B89DC',
                  strokeOpacity: 0.8,
                  strokeStyle: 'solid'
                });
                
                polyline.setMap(map);
                polylines.push(polyline);
                
                // 경로 정보 표시
                var routeInfoElement = document.getElementById('routeInfo');
                routeInfoElement.textContent = \`총 거리: \${(totalDistance / 1000).toFixed(1)}km, 예상 시간: \${Math.round(totalDuration / 60)}분\`;
                routeInfoElement.style.display = 'block';
                
                // 경로 정보 전송
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'ROUTE_INFO',
                  distance: totalDistance,
                  duration: totalDuration,
                  viaCount: waypoints.length,
                  isEstimated: false
                }));
                
                // 모든 지점이 보이도록 지도 범위 조정
                var bounds = new kakao.maps.LatLngBounds();
                points.forEach(function(point) {
                  bounds.extend(point);
                });
                map.setBounds(bounds);
              } catch (error) {
                console.log('경로 표시 오류:', error);
                document.getElementById('loadingIndicator').style.display = 'none';
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'ERROR',
                  message: '경로 표시 오류: ' + error.message
                }));
                
                // 오류 발생 시 기존 방식으로 직선 경로 표시 (대체 방안)
                showSimpleRoute(locations);
              }
            }
            
            // 단순 직선 경로 표시 (API 호출 실패 시 대체 방안)
            function showSimpleRoute(locations) {
              try {
                // 기존 경로 제거
                clearPolylines();
                
                if (!locations || locations.length === 0) {
                  document.getElementById('routeInfo').style.display = 'none';
                  return;
                }
                
                // 좌표 배열 생성
                var points = [];
                points.push(currentMarker.getPosition()); // 현재 위치
                
                // 각 수거지 위치 추가
                locations.forEach(function(loc) {
                  points.push(new kakao.maps.LatLng(loc.latitude, loc.longitude));
                });
                
                // 각 구간을 다른 색상으로 표시
                var colors = ['#4B89DC', '#FF5E3A', '#FFCC00', '#5AD427', '#9B59B6'];
                
                // 총 거리 및 시간 계산용
                var totalDistance = 0;
                
                // 각 구간별로 선 그리기
                for (var i = 0; i < points.length - 1; i++) {
                  var color = colors[i % colors.length];
                  var start = points[i];
                  var end = points[i + 1];
                  
                  // 직선 거리 계산
                  var distance = calculateDistance(
                    start.getLat(), start.getLng(),
                    end.getLat(), end.getLng()
                  );
                  totalDistance += distance;
                  
                  // 선 그리기
                  var line = new kakao.maps.Polyline({
                    path: [start, end],
                    strokeWeight: 5,
                    strokeColor: color,
                    strokeOpacity: 0.9,
                    strokeStyle: 'solid'
                  });
                  
                  line.setMap(map);
                  polylines.push(line);
                }
                
                // 예상 시간 (km당 약 3분)
                var estimatedMinutes = Math.round(totalDistance * 3);
                
                // 경로 정보 표시
                var routeInfoElement = document.getElementById('routeInfo');
                routeInfoElement.textContent = '총 거리: ' + totalDistance.toFixed(1) + 'km, 예상 시간: ' + estimatedMinutes + '분 (추정)';
                routeInfoElement.style.display = 'block';
                
                // 경로 정보 전송
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'ROUTE_INFO',
                  distance: totalDistance * 1000, // m 단위로 변환
                  duration: estimatedMinutes * 60, // 초 단위로 변환
                  viaCount: points.length - 2,
                  isEstimated: true
                }));
                
                // 모든 지점이 보이도록 지도 범위 조정
                var bounds = new kakao.maps.LatLngBounds();
                points.forEach(function(point) {
                  bounds.extend(point);
                });
                map.setBounds(bounds);
              } catch (error) {
                console.log('단순 경로 표시 오류:', error);
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'ERROR',
                  message: '단순 경로 표시 오류: ' + error.message
                }));
              }
            }
            
            // 두 지점 간 거리 계산 (Haversine 공식)
            function calculateDistance(lat1, lon1, lat2, lon2) {
              var R = 6371; // 지구 반경 (km)
              var dLat = deg2rad(lat2 - lat1);
              var dLon = deg2rad(lon2 - lon1);
              var a = 
                Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
                Math.sin(dLon/2) * Math.sin(dLon/2); 
              var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
              var distance = R * c; // 거리 (km)
              return distance;
            }
            
            // 각도를 라디안으로 변환
            function deg2rad(deg) {
              return deg * (Math.PI/180);
            }
            
            // 경로 제거
            function clearPolylines() {
              polylines.forEach(function(polyline) {
                polyline.setMap(null);
              });
              polylines = [];
              document.getElementById('routeInfo').style.display = 'none';
            }
            
            // 메시지 수신 처리
            window.addEventListener('message', function(e) {
              try {
                var data = JSON.parse(e.data);
                
                switch(data.type) {
                  case 'UPDATE_LOCATION':
                    // 현재 위치 업데이트
                    var newPosition = new kakao.maps.LatLng(data.latitude, data.longitude);
                    currentMarker.setPosition(newPosition);
                    break;
                    
                  case 'ADD_PICKUPS':
                    // 수거지 마커 추가
                    addPickupMarkers(data.locations);
                    break;
                    
                  case 'SHOW_ROUTE':
                    // 경로 표시
                    showRoute(data.locations);
                    break;
                    
                  case 'CLEAR_ROUTE':
                    // 경로 제거
                    clearPolylines();
                    window.currentRouteLocations = [];
                    break;
                }
              } catch (error) {
                console.log('메시지 처리 오류:', error);
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'ERROR',
                  message: '메시지 처리 오류: ' + error.message
                }));
              }
            });
          </script>
        </body>
      </html>
    `;
  };
  
  // 웹뷰 메시지 핸들러
  const handleWebViewMessage = (event) => {
    try {
      const message = event.nativeEvent.data;
      
      if (message === 'MAP_LOADED') {
        console.log('지도 로드 완료');
        setMapLoaded(true);
      } else {
        // JSON 메시지 처리
        try {
          const data = JSON.parse(message);
          switch (data.type) {
            case 'MARKER_CLICKED':
              console.log('마커 클릭:', data.id, data.index);
              if (handleMarkerClick && pickupCoordinates) {
                const clickedPickup = pickupCoordinates.find(p => p.id === data.id);
                if (clickedPickup) {
                  handleMarkerClick(clickedPickup.pickup);
                }
              }
              break;
              
            case 'ROUTE_INFO':
              console.log('경로 정보:', data);
              setRouteInfo({
                distance: data.distance,
                duration: data.duration,
                viaCount: data.viaCount,
                isEstimated: data.isEstimated
              });
              break;
              
            case 'OPTIMAL_ROUTE':
              console.log('최적 경로:', data);
              setOptimizedRoute(data.route);
              break;
              
            case 'ERROR':
              console.error('웹뷰 오류:', data.message);
              break;
          }
        } catch (jsonError) {
          // 단순 문자열 메시지
          console.log('웹뷰 메시지(문자열):', message);
        }
      }
    } catch (error) {
      console.error('메시지 처리 오류:', error);
    }
  };

  // 헤더 컴포넌트
  const Header = () => (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.menuButton}
        onPress={toggleViewMode}
      >
        <Text style={styles.menuButtonText}>≡ 목록보기</Text>
      </TouchableOpacity>
      
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>수거 지도</Text>
        <Text style={styles.logoSubtext}>경로 안내</Text>
      </View>
      
      <TouchableOpacity 
        style={styles.optimizeButton}
        onPress={startNavigation}
      >
        <Text style={styles.optimizeButtonText}>내비게이션</Text>
      </TouchableOpacity>
    </View>
  );

  // 로딩 컴포넌트
  const LoadingIndicator = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#5c8d62" />
      <Text style={styles.loadingText}>지도를 불러오는 중...</Text>
    </View>
  );

  // 경로 정보 컴포넌트
  const RouteInfoPanel = () => (
    <View style={styles.routeInfoContainer}>
      <Text style={styles.routeInfoText}>
        {selectedPickups.length}개 수거지 - {routeInfo?.distance ? (routeInfo.distance / 1000).toFixed(1) + 'km' : '계산 중...'}
      </Text>
      <Text style={styles.routeInfoSubtext}>
        예상 소요시간: {routeInfo?.duration ? Math.round(routeInfo.duration / 60) + '분' : '계산 중...'}
        {routeInfo?.isEstimated && ' (추정)'}
      </Text>
      <View style={styles.buttonContainer}>
        {clearAllSelections && (
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={clearAllSelections}
          >
            <Text style={styles.clearButtonText}>선택 초기화</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          style={styles.naviButton}
          onPress={startNavigation}
        >
          <Text style={styles.naviButtonText}>내비게이션 시작</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header />
      
      <View style={styles.mapContainer}>
        {isLoading ? (
          <LoadingIndicator />
        ) : (
          <WebView
            ref={webViewRef}
            source={{ html: generateMapHTML() }}
            onMessage={handleWebViewMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            originWhitelist={['*']}
            mixedContentMode="compatibility"
            allowsInlineMediaPlayback={true}
            useWebKit={Platform.OS === 'ios'}
            startInLoadingState={true}
            scalesPageToFit={false}
            bounces={false}
            scrollEnabled={false}
            renderLoading={() => <LoadingIndicator />}
            style={styles.mapView}
            onError={(error) => console.log('WebView 오류:', error)}
          />
        )}
        
        {locationError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{locationError}</Text>
          </View>
        )}
        
        {routeInfo && selectedPickups && selectedPickups.length > 0 && (
          <RouteInfoPanel />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    zIndex: 10,
  },
  menuButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  menuButtonText: {
    fontSize: 16,
    color: '#5c8d62',
    fontWeight: '600',
  },
  logoContainer: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#5c8d62',
  },
  logoSubtext: {
    fontSize: 12,
    color: '#7c7c7c',
  },
  optimizeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#5c8d62',
    borderRadius: 20,
  },
  optimizeButtonText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#e0e0e0',
  },
  mapView: {
    flex: 1,
    width: width,
    height: height - 60,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 5,
  },
  errorText: {
    color: 'white',
    textAlign: 'center',
  },
  routeInfoContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  routeInfoText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  routeInfoSubtext: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#666',
    fontSize: 14,
  },
  naviButton: {
    backgroundColor: '#4B89DC',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
  },
  naviButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  }
});

export default MapView;
