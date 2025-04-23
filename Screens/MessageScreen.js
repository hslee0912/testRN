// MessageScreen.js
import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Platform, SafeAreaView, StatusBar, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import Icon from 'react-native-vector-icons/MaterialIcons';
import NotificationViewModel from '../FCM/NotificationViewModel';

// 푸시 알림 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const MessageScreen = () => {
  // NotificationViewModel 훅 사용
  const { viewModel, messages, fcmToken } = NotificationViewModel.useNotificationViewModel();

  // FCM 토큰 복사 알림
  const showToken = () => {
    Alert.alert(
      'FCM 토큰',
      fcmToken,
      [
        { text: '확인', style: 'cancel' }
      ]
    );
  };

  // 메시지 삭제
  const removeMessage = (id) => {
    viewModel.removeMessage(id);
  };

  // 중복 메시지 제거
  const uniqueMessages = messages.filter((msg, index, self) =>
    index === self.findIndex((m) => m.id === msg.id)
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#4169E1" barStyle="light-content" />
      
      {/* 상단 헤더
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity onPress={showToken} style={styles.tokenButton}>
          <Text style={styles.tokenButtonText}>토큰 확인</Text>
        </TouchableOpacity>
      </View>
 */}

      {/* 메인 콘텐츠 */}
      <View style={styles.content}>
      
        {/* 메시지 아이콘 */}
        <View style={styles.messageIconContainer}>
          <Icon
            name="email" // MaterialIcons에서 제공하는 아이콘 이름
            size={110} // 아이콘 크기 설정
            color="#fff" // 아이콘 색상 설정
            style={styles.messageIcon}
          />
          <Text style={styles.messageIconText}>Messages</Text>
        </View>

        {/* 메시지 목록 */}
        <ScrollView style={styles.messagesContainer}>
          {
            uniqueMessages.map((msg) => (
              <View key={msg.id} style={styles.messageCard}>
                <View style={styles.messageHeader}>
                  <Text style={styles.messageTitle}>{msg.title}</Text>
                  <TouchableOpacity onPress={() => removeMessage(msg.id)}>
                    <Text style={styles.closeButton}>✕</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.messageBody}>{msg.body}</Text>
                <Text style={styles.messageDate}>{msg.date}</Text>
              </View>
            ))
          }
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  header: {
    backgroundColor: '#4169E1',
    paddingVertical: 15,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  tokenButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  tokenButtonText: {
    color: 'white',
    fontSize: 14,
  },
  content: {
    flex: 1,
    backgroundColor: '#0000FF',
    padding: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  testButton: {
    backgroundColor: '#FFFF00',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
    flex: 1,
    marginRight: 5,
  },
  clearButton: {
    backgroundColor: '#FF9900',
    marginLeft: 5,
    marginRight: 0,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  messagesContainer: {
    flex: 1,
  },
  messageCard: {
    backgroundColor: '#FFFF00',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  messageTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 5,
  },
  messageBody: {
    fontSize: 16,
    marginBottom: 10,
  },
  dataContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  dataTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  dataItem: {
    fontSize: 12,
    color: '#333',
    marginBottom: 2,
  },
  messageDate: {
    fontSize: 12,
    color: '#666',
    alignSelf: 'flex-end',
  },
  emptyMessage: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyMessageText: {
    fontSize: 16,
    color: 'white',
  },
  messageIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 0.5,
    marginVertical: 20,
  },
  messageIcon: {
    tintColor: 'white', // 아이콘 색상을 흰색으로 설정
  },
  messageIconText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
  },
});

export default MessageScreen;
