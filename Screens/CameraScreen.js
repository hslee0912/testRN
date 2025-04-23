import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import { Camera, CameraView  } from 'expo-camera';

const CameraScreen = () => {
  // 권한 상태
  const [hasPermission, setHasPermission] = useState(null);
  // 카메라 설정 상태 - 최신 API 사용
  const [cameraType, setCameraType] = useState("back"); // "back" 또는 "front"
  // 캡처된 이미지
  const [capturedImage, setCapturedImage] = useState(null);
  
  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        // 카메라 권한 요청 - 함수 호출 괄호 추가
        const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
        
        // 미디어 라이브러리 권한 요청
        const { status: mediaStatus } = await MediaLibrary.requestPermissionsAsync();
        
        setHasPermission(cameraStatus === 'granted' && mediaStatus === 'granted');
        
        console.log('카메라 권한:', cameraStatus);
        console.log('미디어 라이브러리 권한:', mediaStatus);
      } catch (error) {
        console.error('권한 요청 오류:', error);
      }
    })();
  }, []);

  // 사진 촬영
  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        setCapturedImage(photo);
        
        // 갤러리에 저장
        await MediaLibrary.saveToLibraryAsync(photo.uri);
        Alert.alert('성공', '사진이 갤러리에 저장되었습니다.');
        setCapturedImage(null);
      } catch (error) {
        Alert.alert('오류', '사진 촬영 중 문제가 발생했습니다.');
        console.log('카메라 오류:', error);
      }
    }
  };

  // 카메라 전환
  const switchCamera = () => {
    setCameraType(cameraType === "back" ? "front" : "back");
  };

  // 갤러리 열기
  const openGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('권한 필요', '갤러리 접근 권한이 필요합니다.');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setCapturedImage(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('오류', '갤러리 접근 중 문제가 발생했습니다.');
      console.log('갤러리 오류:', error);
    }
  };

  // 권한 확인 중
  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <View style={styles.cameraView}>
          <Text style={styles.placeholder}>권한을 확인하는 중입니다...</Text>
        </View>
      </View>
    );
  }

  // 권한 없음
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <View style={styles.cameraView}>
          <Text style={styles.placeholder}>카메라 및 갤러리 접근 권한이 필요합니다.</Text>
          <TouchableOpacity 
            style={styles.permissionButton}
            onPress={() => {
              Camera.reqrequestCameraPermissionsAsync();
              MediaLibrary.requestPermissionsAsync();
            }}
          >
            <Text style={styles.permissionButtonText}>권한 요청</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 카메라 화면 또는 캡처된 이미지 */}
      <View style={styles.cameraView}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={cameraType}
            onMountError={(error) => {
              console.error("카메라 마운트 오류:", error);
              Alert.alert("카메라 오류", "카메라를 시작하는 중 문제가 발생했습니다.");
            }}
          />       
      </View>
      
      {/* 하단 컨트롤 - 갤러리, 촬영, 카메라 전환 버튼 */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.button} onPress={openGallery}>
          <Icon name="photo-library" size={30} color="white" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.captureButton}
          onPress={capturedImage ? () => setCapturedImage(null) : takePicture}
        >
          <View style={styles.captureButtonInner} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={switchCamera}
          disabled={!!capturedImage}
        >
          <Icon 
            name="flip-camera-android" 
            size={30} 
            color="white" 
            style={capturedImage ? { opacity: 0.5 } : {}}
          />
        </TouchableOpacity>
      </View>      
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'brown',
  },
  cameraView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    margin: 15,
    borderRadius: 10,
    overflow: 'hidden',
  },
  camera: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  placeholder: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginHorizontal: 20,
  },
  permissionButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 5,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
  },
  topControls: {
    position: 'absolute',
    top: 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    zIndex: 10,
  },
  topButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 20,
  },
  button: {
    padding: 15,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  zoomControls: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  zoomButton: {
    padding: 5,
  },
  zoomText: {
    color: 'white',
    marginHorizontal: 5,
  }
});

export default CameraScreen;