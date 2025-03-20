import { StyleSheet, Dimensions } from 'react-native';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;

const main = StyleSheet.create({
  // 기본 컨테이너 스타일
  container: {
    flex: 1,
    backgroundColor: '#f6f6f6',
    position: 'relative',
  },
  
  // 헤더 스타일
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1e2432',
  },
  menuButton: {
    borderWidth: 1,
    borderColor: '#5c8d62',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  menuButtonText: {
    color: '#5c8d62',
    fontSize: 14,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoText: {
    color: '#5c8d62',
    fontSize: 24,
    fontWeight: 'bold',
  },
  logoSubtext: {
    color: '#5c8d62',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#5c8d62',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 14,
  },
  
  // 탭 스타일
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#5c8d62',
  },
  tabText: {
    fontSize: 16,
    color: '#888',
  },
  activeTabText: {
    color: '#5c8d62',
  },
  
  // 검색바 스타일
  searchContainer: {
    margin: 10,
    position: 'relative',
  },
  searchInput: {
    backgroundColor: 'white',
    borderRadius: 20,
    paddingVertical: 12,
    paddingLeft: 15,
    paddingRight: 40,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#eaeaea',
  },
  searchIconContainer: {
    position: 'absolute',
    right: 15,
    top: 12,
  },
  searchIcon: {
    fontSize: 20,
    color: '#5c8d62',
  },
  
  // 지도 스타일
  mapContainer: {
    height: SCREEN_HEIGHT * 0.5, // 수거 상세를 위해 지도 높이 50%로 설정
    width: '100%',
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#e5e5e5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e5e5e5',
  },
  loadingText: {
    fontSize: 16,
    color: '#555',
  },
  
  // 수거지 카드 스타일
  pickupCard: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 20, // 수거카드가 다른 요소들보다 위에 표시되도록
  },
  pickupCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  pickupTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  navigationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  pickupDetails: {
    marginBottom: 15,
  },
  detailLabel: {
    fontSize: 16,
    color: '#555',
    marginBottom: 6,
  },
  detailValue: {
    fontWeight: 'bold',
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  collectButton: {
    flex: 1,
    backgroundColor: '#5c8d62',
    borderRadius: 5,
    paddingVertical: 12,
    alignItems: 'center',
  },
  collectButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  
  // 수거 상세 내역 슬라이딩 패널 스타일
  detailsSlideContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '80%', // 화면 높이의 80%까지 차지하도록
    zIndex: 30, // 다른 모든 요소들보다 위에 표시되도록
  },
  slideHandle: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  handleBar: {
    width: 40,
    height: 5,
    backgroundColor: '#ddd',
    borderRadius: 5,
  },
  detailsContent: {
    paddingBottom: 20, // 하단 여백 추가
    maxHeight: SCREEN_HEIGHT * 0.7, // 패널 최대 높이 제한
  },
  detailsSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  infoTable: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tableCell: {
    padding: 12,
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#eee',
  },
  cellTitle: {
    fontSize: 14,
    color: '#666',
  },
  cellContent: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
  },
  detailLoadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  detailLoadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  
  // 목록 핸들 스타일
  listHandle: {
    backgroundColor: 'white',
    padding: 15,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10, // 상세보기 및 수거 카드보다 낮은 zIndex
  },
  listHandleHidden: {
    display: 'none', // 수거지 선택 시 핸들 숨김
  },
  listHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  
  // 수거지 목록 모달 스타일
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#5c8d62',
  },
  placeholder: {
    width: 50,
  },
  modalTabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalTabText: {
    fontSize: 16,
    color: '#888',
  },
  
  // 수거지 목록 아이템 스타일
  pickupListContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  pickupListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#5c8d62',
  },
  pickupListItemContent: {
    flex: 1,
  },
  pickupListItemAddress: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  pickupListItemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickupListItemText: {
    fontSize: 14,
    color: '#666',
  },
  pickupListItemTime: {
    fontSize: 14,
    color: '#888',
  },
  pickupStatusButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: 10,
  },
  pendingButton: {
    backgroundColor: '#ffd54f',
  },
  completedButton: {
    backgroundColor: '#81c784',
  },
  pickupStatusButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  emptyListContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyListText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
});

export default main;