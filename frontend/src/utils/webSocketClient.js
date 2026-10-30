import { Client } from '@stomp/stompjs';

function getWebSocketBrokerUrl() {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    const wsProto = apiUrl.startsWith('https') ? 'wss://' : 'ws://';
    const host = apiUrl.replace(/^https?:\/\//, '').replace(/\/api\/v1\/?$/, '');
    return `${wsProto}${host}/ws`;
  }
  const isHttps = window.location.protocol === 'https:';
  return `${isHttps ? 'wss://' : 'ws://'}localhost:8080/ws`;
}

class WebSocketManager {
  constructor() {
    this.client = null;
    this.subscriptions = new Map();
    this.statusListeners = new Set();
    this.isConnected = false;
  }

  notifyStatus(status) {
    this.statusListeners.forEach((callback) => {
      try {
        callback(status);
      } catch (err) {
        console.warn('Status listener error:', err);
      }
    });
  }

  onStatusChange(callback) {
    this.statusListeners.add(callback);
    return () => this.statusListeners.delete(callback);
  }

  connect(token) {
    if (this.client && this.client.active) {
      return;
    }

    if (!token) {
      console.warn('WebSocket STOMP connection aborted: No auth token');
      return;
    }

    this.notifyStatus('CONNECTING');

    this.client = new Client({
      brokerURL: getWebSocketBrokerUrl(),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 4000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        this.isConnected = true;
        this.notifyStatus('CONNECTED');
        // Resubscribe active subscriptions upon reconnect
        this.subscriptions.forEach((subObj, key) => {
          this._bindSubscription(key, subObj);
        });
      },
      onDisconnect: () => {
        this.isConnected = false;
        this.notifyStatus('DISCONNECTED');
      },
      onStompError: (frame) => {
        console.warn('STOMP broker error occurred:', frame.headers['message']);
        this.notifyStatus('ERROR');
      },
      onWebSocketClose: () => {
        this.isConnected = false;
        this.notifyStatus('DISCONNECTED');
      },
    });

    this.client.activate();
  }

  _bindSubscription(key, subObj) {
    if (!this.client || !this.client.connected) {
      return;
    }
    // Unsubscribe existing stomp sub if any
    if (subObj.stompSub) {
      try {
        subObj.stompSub.unsubscribe();
      } catch {}
    }

    subObj.stompSub = this.client.subscribe(subObj.destination, (message) => {
      try {
        const payload = JSON.parse(message.body);
        subObj.callback(payload);
      } catch (err) {
        console.warn('Failed to parse incoming WebSocket message body:', err);
      }
    });
  }

  /**
   * Subscribe to conversation messages & read receipts.
   */
  subscribeConversation(conversationId, onMessage, onReadReceipt) {
    const topicDest = `/topic/conversations/${conversationId}`;
    const readDest = `/topic/conversations/${conversationId}/read`;

    const subMessage = { destination: topicDest, callback: onMessage, stompSub: null };
    const subRead = { destination: readDest, callback: onReadReceipt, stompSub: null };

    this.subscriptions.set(topicDest, subMessage);
    this.subscriptions.set(readDest, subRead);

    this._bindSubscription(topicDest, subMessage);
    this._bindSubscription(readDest, subRead);

    return () => {
      if (subMessage.stompSub) subMessage.stompSub.unsubscribe();
      if (subRead.stompSub) subRead.stompSub.unsubscribe();
      this.subscriptions.delete(topicDest);
      this.subscriptions.delete(readDest);
    };
  }

  /**
   * Subscribe to user-scoped private message queue.
   */
  subscribeUserQueue(onMessage) {
    const userDest = '/user/queue/messages';
    const sub = { destination: userDest, callback: onMessage, stompSub: null };

    this.subscriptions.set(userDest, sub);
    this._bindSubscription(userDest, sub);

    return () => {
      if (sub.stompSub) sub.stompSub.unsubscribe();
      this.subscriptions.delete(userDest);
    };
  }

  disconnect() {
    this.subscriptions.forEach((sub) => {
      if (sub.stompSub) {
        try {
          sub.stompSub.unsubscribe();
        } catch {}
      }
    });
    this.subscriptions.clear();

    if (this.client) {
      try {
        this.client.deactivate();
      } catch (err) {
        console.warn('Error during WebSocket deactivation:', err);
      }
      this.client = null;
    }
    this.isConnected = false;
    this.notifyStatus('DISCONNECTED');
  }
}

export const webSocketClient = new WebSocketManager();
