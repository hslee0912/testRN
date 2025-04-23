import { useState, useEffect } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import * as Device from 'expo-device';
import base64 from 'react-native-base64';

// BLE 상태 상수 정의
const BLE_STATUS = {
  UNKNOWN: 'unknown',
  READY: 'ready',
  SCANNING: 'scanning',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ERROR: 'error',
};

// BluetoothManager 훅 정의
export const useBluetoothManager = () => {
  // BleManager 인스턴스
  const [manager, setManager] = useState(null);
  
  // 상태 관리
  const [bleStatus, setBleStatus] = useState(BLE_STATUS.UNKNOWN);
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [devices, setDevices] = useState([]);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [logs, setLogs] = useState([]);

  // 로그 추가 함수
  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prevLogs) => [`${timestamp}: ${message}`, ...prevLogs]);
  };

  // 안드로이드 권한 요청
  const requestAndroidPermissions = async () => {
    if (Platform.OS === 'android' && Platform.Version >= 23) {
      const bluetoothScanPermission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        {
          title: '블루투스 스캔 권한',
          message: '주변 블루투스 기기를 스캔하기 위한 권한이 필요합니다.',
          buttonNeutral: '나중에 묻기',
          buttonNegative: '거부',
          buttonPositive: '허용',
        }
      );

      const bluetoothConnectPermission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        {
          title: '블루투스 연결 권한',
          message: '블루투스 기기에 연결하기 위한 권한이 필요합니다.',
          buttonNeutral: '나중에 묻기',
          buttonNegative: '거부',
          buttonPositive: '허용',
        }
      );

      const fineLocationPermission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: '위치 권한',
          message: '블루투스 기기를 스캔하기 위해 위치 권한이 필요합니다.',
          buttonNeutral: '나중에 묻기',
          buttonNegative: '거부',
          buttonPositive: '허용',
        }
      );

      return (
        bluetoothScanPermission === PermissionsAndroid.RESULTS.GRANTED &&
        bluetoothConnectPermission === PermissionsAndroid.RESULTS.GRANTED &&
        fineLocationPermission === PermissionsAndroid.RESULTS.GRANTED
      );
    }
    return true;
  };

  // BLE 초기화 함수
  const initializeBluetooth = async () => {
    try {
      // BleManager 인스턴스 생성 (이미 생성되어 있지 않은 경우)
      if (!manager) {
        const bleManager = new BleManager();
        setManager(bleManager);
        addLog('BLE 매니저 생성됨');
      }

      // 안드로이드 권한 요청
      if (Platform.OS === 'android') {
        addLog('블루투스 권한 요청 중...');
        const granted = await requestAndroidPermissions();
        setHasPermission(granted);

        if (!granted) {
          addLog('블루투스 권한이 거부되었습니다.');
          setBleStatus(BLE_STATUS.ERROR);
          return false;
        }
      }

      // 블루투스 상태 확인
      addLog('블루투스 상태 확인 중...');
      
      return new Promise((resolve) => {
        manager.state().then((state) => {
          if (state === 'PoweredOn') {
            addLog('블루투스가 켜져 있습니다.');
            setBleStatus(BLE_STATUS.READY);
            resolve(true);
          } else {
            addLog(`블루투스가 꺼져 있거나 사용할 수 없습니다. (상태: ${state})`);
            setBleStatus(BLE_STATUS.ERROR);
            resolve(false);
          }
        });
      });
    } catch (error) {
      addLog(`초기화 오류: ${error.message}`);
      console.error('BLE 초기화 오류:', error);
      setBleStatus(BLE_STATUS.ERROR);
      return false;
    }
  };

  // 블루투스 스캔 시작
  const startScan = async () => {
    try {
      if (!manager) {
        const initialized = await initializeBluetooth();
        if (!initialized) return;
      }

      if (isScanning) {
        return;
      }

      // 기존 장치 목록 초기화
      setDevices([]);
      setIsScanning(true);
      setBleStatus(BLE_STATUS.SCANNING);
      addLog('장치 스캔 시작...');

      // scanAndConnect 사용하여 장치 스캔
      manager.startDeviceScan(
        null, // 모든 서비스 UUID 스캔
        { allowDuplicates: false },
        (error, device) => {
          if (error) {
            addLog(`스캔 오류: ${error.message}`);
            setIsScanning(false);
            setBleStatus(BLE_STATUS.ERROR);
            return;
          }

          // 장치가 null이 아니고 이름이 있는 경우에만 처리
          if (device && (device.name || device.localName)) {
            setDevices((prevDevices) => {
              // 이미 발견된 장치인지 확인
              const existingDeviceIndex = prevDevices.findIndex(
                (d) => d.id === device.id
              );

              if (existingDeviceIndex >= 0) {
                // 기존 장치 업데이트
                const updatedDevices = [...prevDevices];
                updatedDevices[existingDeviceIndex] = device;
                return updatedDevices;
              } else {
                // 새 장치 추가
                addLog(`발견된 장치: ${device.name || device.localName || '이름 없음'} (${device.id})`);
                return [...prevDevices, device];
              }
            });
          }
        }
      );

      // 10초 후 스캔 중지
      setTimeout(() => {
        if (isScanning) {
          stopScan();
        }
      }, 10000);
    } catch (error) {
      setIsScanning(false);
      setBleStatus(BLE_STATUS.ERROR);
      addLog(`스캔 오류: ${error.message}`);
    }
  };

  // 블루투스 스캔 중지
  const stopScan = () => {
    if (manager && isScanning) {
      manager.stopDeviceScan();
      setIsScanning(false);
      setBleStatus(BLE_STATUS.READY);
      addLog('장치 스캔 중지');
    }
  };

  // 장치 연결
  const connectToDevice = async (device) => {
    if (!manager) return false;

    try {
      setBleStatus(BLE_STATUS.CONNECTING);
      addLog(`연결 중: ${device.name || device.localName || '이름 없음'} (${device.id})`);

      // 연결 시도
      const connectedDevice = await manager.connectToDevice(device.id, {
        autoConnect: true,
      });
      
      // 서비스와 특성 검색
      await connectedDevice.discoverAllServicesAndCharacteristics();
      
      setConnectedDevice(connectedDevice);
      setBleStatus(BLE_STATUS.CONNECTED);
      addLog(`연결 성공: ${connectedDevice.name || connectedDevice.localName || '이름 없음'}`);
            
      // 연결 해제 모니터링
      connectedDevice.onDisconnected((error, disconnectedDevice) => {
        addLog(`장치 연결 해제: ${disconnectedDevice.name || disconnectedDevice.localName || '이름 없음'}`);
        setConnectedDevice(null);
        setBleStatus(BLE_STATUS.READY);
      });
      
      return true;
    } catch (error) {
      setBleStatus(BLE_STATUS.ERROR);
      addLog(`연결 오류: ${error.message}`);
      return false;
    }
  };

  // 장치 연결 해제
  const disconnectFromDevice = async () => {
    if (!manager || !connectedDevice) return;
    
    try {
      await manager.cancelDeviceConnection(connectedDevice.id);
      setConnectedDevice(null);
      setBleStatus(BLE_STATUS.READY);
      addLog(`연결 해제: ${connectedDevice.name || connectedDevice.localName || '이름 없음'}`);
    } catch (error) {
      addLog(`연결 해제 오류: ${error.message}`);
    }
  };

  // 특성 찾기 함수
  const findWritableCharacteristic = async (serviceUUID, characteristicUUID) => {
    try {
      if (!connectedDevice) {
        addLog('연결된 장치가 없습니다.');
        return null;
      }
      
      // 서비스 검색
      const services = await connectedDevice.services();
      let targetService = null;
      let targetCharacteristic = null;
      
      // 특정 서비스 UUID와 특성 UUID가 제공된 경우
      if (serviceUUID && characteristicUUID) {
        for (const service of services) {
          if (service.uuid === serviceUUID) {
            targetService = service;
            const characteristics = await service.characteristics();
            for (const characteristic of characteristics) {
              if (characteristic.uuid === characteristicUUID) {
                if (characteristic.isWritableWithResponse || characteristic.isWritableWithoutResponse) {
                  return characteristic;
                }
              }
            }
          }
        }
      } else {
        // 첫 번째 쓰기 가능한 특성 찾기
        for (const service of services) {
          const characteristics = await service.characteristics();
          for (const characteristic of characteristics) {
            if (characteristic.isWritableWithResponse || characteristic.isWritableWithoutResponse) {
              addLog(`쓰기 가능한 특성 찾음: ${characteristic.uuid}`);
              return characteristic;
            }
          }
        }
      }
      
      addLog('쓰기 가능한 특성을 찾을 수 없습니다.');
      return null;
    } catch (error) {
      addLog(`특성 검색 오류: ${error.message}`);
      return null;
    }
  };

  // 데이터 전송 (서비스 UUID와 특성 UUID를 선택적으로 제공)
  const sendData = async (data, serviceUUID = null, characteristicUUID = null) => {
    if (!manager || !connectedDevice) {
      addLog('연결된 장치가 없습니다.');
      return false;
    }

    try {
      // 적절한 특성 찾기
      const characteristic = await findWritableCharacteristic(serviceUUID, characteristicUUID);
      
      if (!characteristic) {
        addLog('쓰기 가능한 특성을 찾을 수 없습니다.');
        return false;
      }
      
      // 데이터를 Base64로 인코딩
      const encodedData = base64.encode(data);
      
      // 데이터 쓰기 (응답 여부에 따라 다른 메서드 사용)
      if (characteristic.isWritableWithResponse) {
        await characteristic.writeWithResponse(encodedData);
      } else {
        await characteristic.writeWithoutResponse(encodedData);
      }
      
      addLog(`데이터 전송 성공: ${data}`);
      return true;
    } catch (error) {
      addLog(`데이터 전송 오류: ${error.message}`);
      return false;
    }
  };

  // 컴포넌트 마운트 시 블루투스 초기화
  useEffect(() => {
    const bleManager = new BleManager();
    setManager(bleManager);
    
    // 블루투스 초기화
    initializeBluetooth();
        
    return () => {
      // 컴포넌트 언마운트 시 연결 해제 및 BleManager 파기
      if (bleManager) {
        if (connectedDevice) {
          bleManager.cancelDeviceConnection(connectedDevice.id).catch(console.error);
        }
        bleManager.destroy();
      }
    };
  }, []);

  return {
    bleStatus,
    isScanning,
    hasPermission,
    devices,
    connectedDevice,
    logs,
    initializeBluetooth,
    startScan,
    stopScan,
    connectToDevice,
    disconnectFromDevice,
    sendData,
  };
};

export default useBluetoothManager;