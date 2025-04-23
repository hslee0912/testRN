// NotificationData.js
export default class NotificationData {
    constructor(id, title, body, date, data) {
      this.id = id;
      this.title = title || '새 알림';
      this.body = body || '';
      this.date = date || new Date().toLocaleString();
      this.data = data || {};
    }
  
    // Firebase 원격 메시지에서 NotificationData 객체 생성
    static fromRemoteMessage(remoteMessage) {
      const notificationData = remoteMessage.notification;
      return new NotificationData(
        remoteMessage.messageId || Date.now().toString(),
        notificationData?.title || '새 알림',
        notificationData?.body || '',
        new Date().toLocaleString(),
        remoteMessage.data
      );
    }
  
    // JSON 객체에서 NotificationData 객체 생성 (AsyncStorage에서 데이터 로딩 시 사용)
    static fromJSON(json) {
      return new NotificationData(
        json.id,
        json.title,
        json.body,
        json.date,
        json.data
      );
    }
  }