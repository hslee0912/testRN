import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';

// Google Maps API 키 설정
// 실제 키로 변경해야 합니다
const GOOGLE_MAPS_API_KEY = 'AIzaSyAh8n4O4pnvogA0KZPsK0B0_sIJBCpRVfg';

const MapScreen = () => {
  // 상태 관리
  const [currentLocation, setCurrentLocation] = useState(null);
  const [selectedLocationName, setSelectedLocationName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // 지도 참조
  const mapRef = useRef(null);
  
  // 초기 위치 - 서울시청
  const initialLocation = {
    latitude: 37.5665,
    longitude: 126.9780,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01
  };

  // 컴포넌트 마운트 시 위치 권한 요청 및 현재 위치 가져오기
  useEffect(() => {
    (async () => {
      try {
        // 위치 권한 요청
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            '위치 권한 필요',
            '위치 기능을 사용하기 위해 권한이 필요합니다.',
            [{ text: '확인' }]
          );
          setIsLoading(false);
          return;
        }

        // 현재 위치 가져오기
        let location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
        });
        
        const currentCoords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01
        };
        
        setCurrentLocation(currentCoords);
        
        // 현재 위치의 주소 정보 가져오기
        try {
          const reverseGeocode = await Location.reverseGeocodeAsync({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          });
          
          if (reverseGeocode.length > 0) {
            const address = reverseGeocode[0];
            let locationName = '';
            
            if (address.street) {
              locationName += address.street;
            }
            
            if (address.city) {
              if (locationName) locationName += ', ';
              locationName += address.city;
            }
            
            setSelectedLocationName(locationName || '내 위치');
          } else {
            setSelectedLocationName('내 위치');
          }
        } catch (error) {
          console.error('주소 변환 오류:', error);
          setSelectedLocationName('내 위치');
        }
      } catch (error) {
        console.error('위치 가져오기 오류:', error);
        Alert.alert('오류', '위치 정보를 가져오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // 주소로 위치 검색하는 함수
  const searchLocation = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('알림', '검색할 주소를 입력해주세요.');
      return;
    }

    setIsSearching(true);
    Keyboard.dismiss();

    try {
      // Expo Location의 geocodeAsync 함수 사용
      const geocodeResults = await Location.geocodeAsync(searchQuery);
      
      if (geocodeResults.length > 0) {
        const { latitude, longitude } = geocodeResults[0];
        
        // 검색된 위치로 이동
        moveToLocation(latitude, longitude, searchQuery);
      } else {
        Alert.alert('알림', '검색 결과가 없습니다. 다른 주소를 입력해보세요.');
      }
    } catch (error) {
      console.error('위치 검색 오류:', error);
      Alert.alert('오류', '위치 검색에 실패했습니다.');
    } finally {
      setIsSearching(false);
    }
  };

  // 검색한 위치로 이동하는 함수
  const moveToLocation = (latitude, longitude, address) => {
    const newLocation = {
      latitude,
      longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01
    };
    
    setCurrentLocation(newLocation);
    setSelectedLocationName(address || '선택한 위치');
    
    // 지도 이동
    mapRef.current?.animateToRegion(newLocation, 1000);
  };

  // 현재 위치로 이동하는 함수
  const goToMyLocation = async () => {
    setIsLoading(true);
    try {
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });
      
      const currentCoords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01
      };
      
      setCurrentLocation(currentCoords);
      
      // 지도 이동
      mapRef.current?.animateToRegion(currentCoords, 1000);
      
      // 현재 위치 주소 가져오기
      try {
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });
        
        if (reverseGeocode.length > 0) {
          const address = reverseGeocode[0];
          let locationName = '';
          
          if (address.street) {
            locationName += address.street;
          }
          
          if (address.city) {
            if (locationName) locationName += ', ';
            locationName += address.city;
          }
          
          setSelectedLocationName(locationName || '내 위치');
        } else {
          setSelectedLocationName('내 위치');
        }
      } catch (error) {
        console.error('주소 변환 오류:', error);
        setSelectedLocationName('내 위치');
      }
    } catch (error) {
      console.error('위치 가져오기 오류:', error);
      Alert.alert('오류', '현재 위치를 가져오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 지도를 탭했을 때 호출되는 함수
  const handleMapPress = async (event) => {
    const { coordinate } = event.nativeEvent;
    
    setCurrentLocation({
      ...coordinate,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01
    });
    
    // 선택한 위치의 주소 정보 가져오기
    try {
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: coordinate.latitude,
        longitude: coordinate.longitude
      });
      
      if (reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        let locationName = '';
        
        if (address.street) {
          locationName += address.street;
        }
        
        if (address.city) {
          if (locationName) locationName += ', ';
          locationName += address.city;
        }
        
        if (address.country) {
          if (locationName) locationName += ', ';
          locationName += address.country;
        }
        
        setSelectedLocationName(locationName || '선택한 위치');
      } else {
        setSelectedLocationName('선택한 위치');
      }
    } catch (error) {
      console.error('주소 변환 오류:', error);
      setSelectedLocationName('선택한 위치');
    }
  };

  return (
    <View style={styles.container}>
      {/* 헤더 영역 */}
      <View style={styles.header}>
        <FontAwesome5 name="map-marker-alt" size={36} color="white" />
        <Text style={styles.title}>위치 검색</Text>
        
        {/* 검색 입력창 */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="위치를 입력하세요"
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={searchLocation}
            returnKeyType="search"
          />
          <TouchableOpacity 
            style={styles.searchButton} 
            onPress={searchLocation}
            disabled={isSearching}
          >
            {isSearching ? (
              <ActivityIndicator size="small" color="#666" />
            ) : (
              <FontAwesome5 name="search" size={18} color="#666" />
            )}
          </TouchableOpacity>
        </View>
                
        {/* 선택된 위치 표시 */}
        {selectedLocationName ? (
          <Text style={styles.locationText}>현재 위치: {selectedLocationName}</Text>
        ) : null}
      </View>
      
      {/* 지도 영역 */}
      <View style={styles.mapContainer}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
        ) : (
          <TouchableWithoutFeedback
            // 지도 영역의 터치 이벤트 가로채기
            onTouchStart={(e) => {
              // 이벤트가 상위로 전파되지 않도록 중지
              e.stopPropagation();
            }}
          >
            <View style={styles.mapWrapperFull}>
              <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={currentLocation || initialLocation}
                region={currentLocation}
                showsUserLocation={true}
                showsMyLocationButton={false}
                onPress={handleMapPress}
                // 지도에 터치 관련 속성 추가
                rotateEnabled={true}
                scrollEnabled={true}
                pitchEnabled={true}
                zoomEnabled={true}
                // 지도 컨트롤 설정
                moveOnMarkerPress={false}
                // 손가락으로 지도 조작 가능하게 설정
                toolbarEnabled={true}
              >
                {currentLocation && (
                  <Marker
                    coordinate={{
                      latitude: currentLocation.latitude,
                      longitude: currentLocation.longitude
                    }}
                    title={selectedLocationName || "선택된 위치"}
                  />
                )}
              </MapView>
            </View>
          </TouchableWithoutFeedback>
        )}
        
        {/* 현재 위치 버튼 */}
        <TouchableOpacity style={styles.myLocationButton} onPress={goToMyLocation}>
          <MaterialIcons name="my-location" size={24} color="#2196F3" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'green',
  },
  header: {
    padding: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 8,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    width: '100%',
    height: 46,
    alignItems: 'center',
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    height: 46,
    color: '#000',
    fontSize: 16,
    paddingHorizontal: 8,
  },
  searchButton: {
    padding: 8,
    borderRadius: 4,
  },
  locationText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
  },
  mapContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'white',
  },
  mapWrapperFull: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  myLocationButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: 'white',
    borderRadius: 30,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MapScreen;