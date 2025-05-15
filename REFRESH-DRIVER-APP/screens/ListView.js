// ListView.js
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView,
  TextInput,
  StyleSheet,
  Switch,
  Alert,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import main from '../styles/main';

const ListView = ({ 
  activeTab, 
  setActiveTab, 
  pickupList, 
  selectedPickups,
  togglePickupSelection,
  routeOptimized,
  toggleRouteOptimization,
  startRouteWithSelectedPickups,
  toggleViewMode,
  completePickup,
  launchKakaoNavigation
}) => {
  // 검색어 상태
  const [searchTerm, setSearchTerm] = useState('');
  
  // 필터링된 수거지 목록
  const filteredPickups = pickupList.filter(pickup => {
    const searchLower = searchTerm.toLowerCase();
    
    // 검색어가 없으면 전체 표시
    if (!searchTerm) return true;
    
    // 회사명, 지역명, 주소 등으로 검색
    return (
      (pickup.address?.name && pickup.address.name.toLowerCase().includes(searchLower)) ||
      (pickup.address?.roadNameAddress && pickup.address.roadNameAddress.toLowerCase().includes(searchLower)) ||
      (pickup.address?.jibunAddress && pickup.address.jibunAddress.toLowerCase().includes(searchLower)) ||
      (pickup.address?.detail && pickup.address.detail.toLowerCase().includes(searchLower))
    );
  });
  
  // 완료 필터링
  const completedPickups = filteredPickups.filter(pickup => pickup.status === 'COMPLETED');
  const incompletePickups = filteredPickups.filter(pickup => pickup.status !== 'COMPLETED');
  
  // 선택된 수거지의 ID 목록
  const selectedPickupIds = selectedPickups.map(p => p.id);
  
  // 현재 활성 탭에 따라 표시할 목록 선택
  const displayPickups = activeTab === '완료' ? completedPickups : incompletePickups;
  
  // 아이템 렌더링
  const renderItem = ({ item }) => {
    const isSelected = selectedPickupIds.includes(item.pickupId);
    
    return (
      <TouchableOpacity 
        style={[
          styles.pickupItem,
          isSelected && styles.selectedPickupItem
        ]}
        onPress={() => togglePickupSelection(item)}
      >
        <View style={styles.pickupIconContainer}>
          <View style={[styles.pickupIcon, isSelected && styles.selectedPickupIcon]}>
            <Ionicons 
              name={isSelected ? "checkmark-circle" : "location-outline"} 
              size={24} 
              color={isSelected ? "#5c8d62" : "#999"} 
            />
          </View>
        </View>
        
        <View style={styles.pickupContent}>
          <Text style={styles.pickupName}>
            {item.address?.name || '이름 없음'}
          </Text>
          <Text style={styles.pickupAddress}>
            {item.address?.roadNameAddress || '주소 없음'}
          </Text>
          {item.address?.detail && (
            <Text style={styles.pickupDetail}>
              {item.address.detail}
            </Text>
          )}
          
          {item.reservationTime && (
            <View style={styles.pickupTimeContainer}>
              <Ionicons name="time-outline" size={14} color="#5c8d62" />
              <Text style={styles.pickupTime}>
                {item.reservationTime.substring(11, 16)}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.pickupActions}>
          {activeTab === '미완료' && (
            <>
              <TouchableOpacity 
                style={[styles.pickupButton, styles.completeButton]}
                onPress={() => completePickup(item.pickupId)}
              >
                <Text style={styles.buttonText}>완료</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.pickupButton, 
                  styles.selectButton,
                  isSelected && styles.selectedButton
                ]}
                onPress={() => togglePickupSelection(item)}
              >
                <Text style={[
                  styles.selectButtonText,
                  isSelected && styles.selectedButtonText
                ]}>
                  {isSelected ? '선택됨' : '선택'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  };
  
  // 탭 변경 핸들러
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  
  // 선택된 수거지가 있는지 확인
  const hasSelectedPickups = selectedPickups.length > 0;
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>REFRESH</Text>
          <Text style={styles.logoSubtext}>DRIVER</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.mapViewIconButton}
          onPress={toggleViewMode}
        >
          <Ionicons name="map-outline" size={24} color="#5c8d62" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search-outline" size={18} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="수거지 검색..."
            placeholderTextColor="#999"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm('')}>
              <Ionicons name="close-circle" size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === '미완료' && styles.activeTab]}
          onPress={() => handleTabChange('미완료')}
        >
          <Text style={[
            styles.tabText, 
            activeTab === '미완료' && styles.activeTabText
          ]}>
            미완료 ({incompletePickups.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === '완료' && styles.activeTab]}
          onPress={() => handleTabChange('완료')}
        >
          <Text style={[
            styles.tabText, 
            activeTab === '완료' && styles.activeTabText
          ]}>
            완료 ({completedPickups.length})
          </Text>
        </TouchableOpacity>
      </View>
      
      {hasSelectedPickups && (
        <View style={styles.selectedInfoContainer}>
          <View style={styles.selectedInfoHeader}>
            <View style={styles.selectedCountBadge}>
              <Text style={styles.selectedCountText}>{selectedPickups.length}</Text>
            </View>
            <Text style={styles.selectedInfoText}>
              수거지 선택됨
            </Text>
          </View>
          
          <View style={styles.optimizationContainer}>
            <Text style={styles.optimizationText}>경로 최적화</Text>
            <Switch
              trackColor={{ false: "#ccc", true: "#a5d6a7" }}
              thumbColor={routeOptimized ? "#5c8d62" : "#f4f3f4"}
              ios_backgroundColor="#ccc"
              onValueChange={toggleRouteOptimization}
              value={routeOptimized}
            />
          </View>
          
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.mapButton]}
              onPress={startRouteWithSelectedPickups}
            >
              <Ionicons name="map" size={18} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.actionButtonText}>경로 시작</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.naviButton]}
              onPress={launchKakaoNavigation}
            >
              <Ionicons name="navigate" size={18} color="#3c1e1e" style={styles.buttonIcon} />
              <Text style={styles.naviButtonText}>
                카카오내비 실행
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {displayPickups.length === 0 ? (
        <View style={styles.emptyListContainer}>
          <Ionicons name="information-circle-outline" size={48} color="#ccc" />
          <Text style={styles.emptyListText}>
            {activeTab === '완료' ? '완료된 수거지가 없습니다.' : '수거지가 없습니다.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayPickups}
          renderItem={renderItem}
          keyExtractor={item => item.pickupId.toString()}
          style={styles.pickupList}
          contentContainerStyle={styles.pickupListContent}
        />
      )}
      
      {!hasSelectedPickups && (
        <TouchableOpacity 
          style={styles.mapViewButton}
          onPress={toggleViewMode}
        >
          <Ionicons name="map" size={18} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.mapViewButtonText}>지도 보기</Text>
        </TouchableOpacity>
      )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  logoContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
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
  mapViewIconButton: {
    padding: 8,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 15,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 14,
    color: '#333',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#5c8d62',
  },
  tabText: {
    fontSize: 14,
    color: '#7c7c7c',
  },
  activeTabText: {
    color: '#5c8d62',
    fontWeight: 'bold',
  },
  selectedInfoContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  selectedInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  selectedCountBadge: {
    backgroundColor: '#5c8d62',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  selectedCountText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  selectedInfoText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  optimizationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  optimizationText: {
    fontSize: 14,
    color: '#666',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  buttonIcon: {
    marginRight: 6,
  },
  mapButton: {
    backgroundColor: '#5c8d62',
  },
  naviButton: {
    backgroundColor: '#f9e000',
  },
  actionButtonText: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#fff',
  },
  naviButtonText: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#3c1e1e',
  },
  pickupList: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  pickupListContent: {
    paddingVertical: 8,
  },
  pickupItem: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  pickupIconContainer: {
    marginRight: 12,
    justifyContent: 'center',
  },
  pickupIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedPickupIcon: {
    backgroundColor: '#e6f0e9',
  },
  pickupContent: {
    flex: 1,
    justifyContent: 'center',
  },
  pickupName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  pickupAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  pickupDetail: {
    fontSize: 13,
    color: '#888',
  },
  pickupTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  pickupTime: {
    fontSize: 13,
    color: '#5c8d62',
    marginLeft: 4,
  },
  pickupActions: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  pickupButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    marginBottom: 6,
  },
  completeButton: {
    backgroundColor: '#5c8d62',
  },
  selectButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedButton: {
    backgroundColor: '#e6f0e9',
    borderColor: '#5c8d62',
  },
  buttonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  selectButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  selectedButtonText: {
    color: '#5c8d62',
  },
  selectedPickupItem: {
    backgroundColor: '#e6f0e9',
    borderLeftWidth: 4,
    borderLeftColor: '#5c8d62',
  },
  emptyListContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyListText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
  mapViewButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    backgroundColor: '#5c8d62',
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  mapViewButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ListView;
