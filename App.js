import { StatusBar } from 'expo-status-bar';
import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, SafeAreaView, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Import screen components
import HomeScreen from './Screens/HomeScreen';
import MapScreen from './Screens/MapScreen';
import BlueToothScreen from './Screens/BlueToothScreen';
import MessageScreen from './Screens/MessageScreen';
import CameraScreen from './Screens/CameraScreen';

const { width } = Dimensions.get('window');

const App = () => {
  // 현재 활성화된 탭의 인덱스 상태
  const [activeTab, setActiveTab] = useState(0);
  
  // ScrollView에 대한 참조 생성
  const scrollViewRef = useRef(null);

  // 탭 정보 정의
  const topTabs = [
    { icon: 'home', label: 'Home' },
    { icon: 'map', label: 'Map' },
    { icon: 'bluetooth', label: 'Bluetooth' },
    { icon: 'email', label: 'Message' },
    { icon: 'camera-alt', label: 'Camera' },
  ];

  // 각 화면 컴포넌트
  const screens = [
    <HomeScreen key="home" />,
    <MapScreen key="map" />,
    <BlueToothScreen key="bluetooth" />,
    <MessageScreen key="message" />,
    <CameraScreen key="camera" />
  ];

  // 페이지 변경 함수
  const changePage = (index) => {
    if (index < 0) index = 0;
    if (index >= screens.length) index = screens.length - 1;
    
    // 해당 위치로 스크롤
    scrollViewRef.current?.scrollTo({
      x: index * width,
      y: 0,
      animated: true,
    });
    
    setActiveTab(index);
  };

  // 스크롤 이벤트 핸들러
  const handleScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / width);
    
    // 현재 보여지는 페이지의 인덱스가 변경되었을 때만 상태 업데이트
    if (page !== activeTab) {
      setActiveTab(page);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top App Bar */}
      <View style={styles.topBar}>
        <Text style={styles.title}>App 타이틀</Text>
        <View style={styles.tabBar}>
          {topTabs.map((tab, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.tab, activeTab === index ? styles.activeTab : null]}
              onPress={() => changePage(index)}
            >
              <Icon name={tab.icon} size={24} color={activeTab === index ? '#000' : '#666'} />
              <Text style={[styles.tabText, activeTab === index ? styles.activeTabText : null]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ScrollView 기반 페이지 스와이퍼 */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEnabled={true} // 항상 스와이프 활성화
        contentContainerStyle={styles.scrollContainer}
        style={styles.scrollView}
      >
        {screens.map((screen, index) => (
          <View key={index} style={[styles.slide, { width }]}>
            {screen}
          </View>
        ))}
      </ScrollView>

      <StatusBar style="auto" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  topBar: {
    backgroundColor: '#ADD8E6', // Light blue similar to the screenshot
    paddingTop: 40,
    paddingBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tab: {
    alignItems: 'center',
    padding: 5,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#000',
  },
  tabText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  activeTabText: {
    color: '#000',
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    flexDirection: 'row',
  },
  slide: {
    flex: 1,
    height: '100%',
  },
});

export default App;