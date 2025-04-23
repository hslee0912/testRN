import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useBluetoothManager } from '../Bluetooth/BluetoothManager';

const BlueToothScreen = () => {
  // BluetoothManager 훅 사용
  const {
    bleStatus,
    isScanning,
    devices,
    connectedDevice,
    logs,
    initializeBluetooth,
    startScan,
    stopScan,
    connectToDevice,
    disconnectFromDevice,
    sendData,
  } = useBluetoothManager();

  // 상태 관리
  const [inputData, setInputData] = useState('');

  // 장치 스캔 핸들러
  const handleScan = async () => {
    if (isScanning) {
      await stopScan();
    } else {
      await startScan();
    }
  };

  // 장치 연결 핸들러
  const handleConnect = async (device) => {
    if (connectedDevice && connectedDevice.id === device.id) {
      await disconnectFromDevice();
    } else {
      await connectToDevice(device);
    }
  };

  // 데이터 전송 핸들러
  const handleSendData = async () => {
    if (!inputData.trim()) return;
    
    await sendData(inputData);
    setInputData('');
  };

  // 장치 항목 렌더링
  const renderDeviceItem = ({ item }) => {
    const isConnected = connectedDevice && connectedDevice.id === item.id;
    
    return (
      <TouchableOpacity
        style={[
          styles.deviceItem,
          isConnected && styles.connectedDeviceItem
        ]}
        onPress={() => handleConnect(item)}
      >
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceName}>
            {item.name || '이름 없음'}
          </Text>
          <Text style={styles.deviceId}>
            {item.id}
          </Text>
        </View>
        {isConnected && (
          <View style={styles.connectedIcon}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        {/* 스캔 버튼 */}
        <View style={styles.scanContainer}>
          <Text style={styles.scanText}>블루투스 장치 스캔</Text>
          <TouchableOpacity
            style={styles.scanButton}
            onPress={handleScan}
          >
            <Text style={styles.scanButtonText}>스캔</Text>
          </TouchableOpacity>
        </View>

        {/* 발견된 장치 목록 */}
        <View style={styles.devicesContainer}>
          <Text style={styles.sectionTitle}>발견된 장치 ({devices.length})</Text>
          {devices.length === 0 ? (
            <View style={styles.emptyDevices}>
              <Text style={styles.emptyText}>발견된 장치가 없습니다</Text>
            </View>
          ) : (
            <FlatList
              data={devices}
              renderItem={renderDeviceItem}
              keyExtractor={(item) => item.id}
              style={styles.devicesList}
            />
          )}
        </View>
        
        {/* 로그 출력 */}
        <View style={styles.logsContainer}>
          <Text style={styles.sectionTitle}>데이터 로그</Text>
          <ScrollView style={styles.logs}>
            {logs.map((log, index) => (
              <Text key={index} style={styles.logText}>{log}</Text>
            ))}
            {logs.length === 0 && (
              <Text style={styles.emptyText}>로그가 없습니다</Text>
            )}
          </ScrollView>
        </View>

        {/* 데이터 전송 */}
        <View style={styles.dataInputContainer}>
          <View style={styles.checkboxContainer}>
            <View style={styles.checkbox}>
              {connectedDevice && <Text style={styles.checkboxCheck}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>
              연결됨: {connectedDevice ? connectedDevice.name || '이름 없음' : '없음'}
            </Text>
          </View>
          
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.dataInput}
              value={inputData}
              onChangeText={setInputData}
              placeholder="전송할 데이터"
              placeholderTextColor="#888"
              editable={!!connectedDevice}
            />
            <TouchableOpacity
              style={[styles.sendButton, !connectedDevice && styles.disabledButton]}
              onPress={handleSendData}
              disabled={!connectedDevice}
            >
              <Text style={styles.sendButtonText}>▶</Text>
            </TouchableOpacity>
          </View>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFF00',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  scanContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#222',
    borderRadius: 8,
    margin: 16,
  },
  scanText: {
    color: '#fff',
    fontSize: 16,
  },
  scanButton: {
    backgroundColor: '#4169E1',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 4,
  },
  scanButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  devicesContainer: {
    margin: 16,
    flex: 2,
  },
  sectionTitle: {
    color: '#000',
    fontSize: 16,
    marginBottom: 8,
  },
  devicesList: {
    backgroundColor: '#222',
    borderRadius: 8,
  },
  deviceItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  connectedDeviceItem: {
    backgroundColor: '#304878',
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deviceId: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 4,
  },
  connectedIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4169E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#000',
    fontWeight: 'bold',
  },
  emptyDevices: {
    backgroundColor: '#222',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
  },
  dataInputContainer: {
    margin: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#4169E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: connectedDevice => connectedDevice ? '#4169E1' : 'transparent',
  },
  checkboxCheck: {
    color: '#000',
    fontWeight: 'bold',
  },
  checkboxLabel: {
    color: '#000',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    borderRadius: 8,
    overflow: 'hidden',
  },
  dataInput: {
    flex: 1,
    color: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  sendButton: {
    backgroundColor: '#4169E1',
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#444',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  logsContainer: {
    margin: 16,
    flex: 3,
  },
  logs: {
    backgroundColor: '#222',
    padding: 16,
    borderRadius: 8,
  },
  logText: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 4,
  },
});

export default BlueToothScreen;