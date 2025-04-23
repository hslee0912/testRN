// NotificationViewModel.js
import { useState, useEffect } from 'react';
import messaging from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';
import NotificationData from './NotificationData';
import { Platform } from 'react-native';

export default class NotificationViewModel {
  constructor() {
    this._messages = [];
    this._fcmToken = '';
    this._onMessagesChanged = null;
    this._onTokenChanged = null;
  }

  // 메시지 목록 getter
  get messages() {
    return this._messages;
  }

  // FCM 토큰 getter
  get fcmToken() {
    return this._fcmToken;
  }

  // 메시지 변경 리스너 설정
  setOnMessagesChanged(callback) {
    this._onMessagesChanged = callback;
  }

  // 토큰 변경 리스너 설정
  setOnTokenChanged(callback) {
    this._onTokenChanged = callback;
  }

  // 메시지 목록 업데이트
  _updateMessages(messages) {
    this._messages = messages;
    if (this._onMessagesChanged) {
      this._onMessagesChanged(messages);
    }
  }

  // 토큰 업데이트
  _updateToken(token) {
    this._fcmToken = token;
    if (this._onTokenChanged) {
      this._onTokenChanged(token);
    }
  }

  // FCM 권한 요청
  async requestUserPermission() {
    if (Platform.OS === 'ios') {
      const authStatus = await messaging().requestPermission();
      return authStatus === messaging.AuthorizationStatus.AUTHORIZED || 
             authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    }
    
    // Android 13+ (API 33+)에서는 명시적 권한 요청이 필요
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const permissions = await Notifications.requestPermissionsAsync({
        android: {
          channelId: 'default',
        },
      });
      return permissions.granted;
    }
    
    return true; // 이전 Android 버전은 기본적으로 권한 있음
  }

  // 로컬 알림 표시
  async showLocalNotification(title, body, data = {}) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: title,
        body: body,
        data: data,
      },
      trigger: null, // 즉시 표시
    });
  }

  // 메시지 추가
  async addMessage(message) {
    const updatedMessages = [...this._messages, message];
    this._updateMessages(updatedMessages);
  }

  // 메시지 삭제
  async removeMessage(id) {
    const filteredMessages = this._messages.filter(msg => msg.id !== id);
    this._updateMessages(filteredMessages);
  }

  // Android용 알림 채널 생성
  async createNotificationChannel() {
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: '기본 알림',
          description: '모든 알림이 표시됩니다',
          importance: Notifications.AndroidImportance.HIGH, // 중요도 HIGH로 설정
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          enableLights: true,
          enableVibrate: true,
        });
    }
  }

  // FCM 초기화 및 리스너 설정
  async initialize() {
    try {
      // 알림 채널 생성
      await this.createNotificationChannel();
      
      // FCM 권한 요청
      const hasPermission = await this.requestUserPermission();
      if (!hasPermission) {
        console.log('FCM 알림 권한이 거부되었습니다.');
        return false;
      }

      // 앱이 종료된 상태에서 알림을 클릭한 경우 처리
      const initialMsg = await messaging().getInitialNotification();
      if (initialMsg) {
        console.log('앱 종료상태에서 알림 클릭:', initialMsg);
        const notificationData = NotificationData.fromRemoteMessage(initialMsg);
        await this.addMessage(notificationData);
      }
            
      // FCM 토큰 가져오기
      const token = await messaging().getToken();
      this._updateToken(token);
      console.log('FCM 토큰:', token);
      
      // 리스너 설정
      this.setupListeners();
      
      return true;
    } catch (error) {
      console.error('FCM 초기화 오류:', error);
      return false;
    }
  }

  // FCM 리스너 설정
  setupListeners() {
    // 포그라운드 메시지 핸들러 (앱 사용 중일 때)
    const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
      console.log('포그라운드 메시지:', remoteMessage);
      
      const notificationData = NotificationData.fromRemoteMessage(remoteMessage);
      
      // 포그라운드에서도 알림 표시
      await this.showLocalNotification(
        notificationData.title,
        notificationData.body,
        notificationData.data
      );
      
      await this.addMessage(notificationData);
    });

    // 백그라운드에서 알림 클릭 처리
    const unsubscribeBackground = messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('백그라운드에서 알림 클릭:', remoteMessage);
      
      const notificationData = NotificationData.fromRemoteMessage(remoteMessage);
      this.addMessage(notificationData);
    });

    // 토큰 갱신 처리
    const unsubscribeTokenRefresh = messaging().onTokenRefresh(token => {
      this._updateToken(token);
      console.log('FCM 토큰 갱신:', token);
    });

    // Expo Notifications 리스너 (로컬 알림 클릭 처리)
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const { notification } = response;
      console.log('로컬 알림 응답:', notification);
    });

    // 리스너 해제 함수 반환
    return () => {
      unsubscribeForeground();
      unsubscribeBackground();
      unsubscribeTokenRefresh();
      subscription.remove();
    };
  }
  
  // React Hook으로 NotificationViewModel 사용하기 위한 훅 함수
  static useNotificationViewModel() {
    const [viewModel] = useState(() => new NotificationViewModel());
    const [messages, setMessages] = useState([]);
    const [fcmToken, setFcmToken] = useState('');
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
      // 메시지 변경 리스너 설정
      viewModel.setOnMessagesChanged(updatedMessages => {
        setMessages([...updatedMessages]);
      });
      
      // 토큰 변경 리스너 설정
      viewModel.setOnTokenChanged(updatedToken => {
        setFcmToken(updatedToken);
      });
      
      // 초기화
      const initializeViewModel = async () => {
        await viewModel.initialize();
        setLoading(false);
      };
      
      initializeViewModel();
      
    }, [viewModel]);
    
    return { viewModel, messages, fcmToken, loading };
  }
}