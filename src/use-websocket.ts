import { useState, useEffect, useRef, useCallback } from 'react';

export const useWebSocket = (url, options = {}) => {
  const {
    onOpen,
    onMessage,
    onError,
    onClose,
    reconnectAttempts = 3,
    reconnectInterval = 3000,
    protocols = [],
    shouldReconnect = true,
  } = options;

  // Message queue for messages sent before connection is ready
  const messageQueue = useRef([]);

  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [lastMessage, setLastMessage] = useState(null);
  const [messageHistory, setMessageHistory] = useState([]);

  const ws = useRef(null);
  const reconnectTimeoutId = useRef(null);
  const reconnectCount = useRef(0);
  const isManualClose = useRef(false);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      setConnectionStatus('Connecting');
      ws.current = new WebSocket(url, protocols);

      ws.current.onopen = (event) => {
        setConnectionStatus('Connected');
        reconnectCount.current = 0;
        isManualClose.current = false;

        // Send any queued messages
        while (messageQueue.current.length > 0) {
          const queuedMessage = messageQueue.current.shift();
          try {
            ws.current.send(queuedMessage);
          } catch (error) {
            console.error('Error sending queued message:', error);
          }
        }

        onOpen?.(event);
      };

      ws.current.onmessage = (event) => {
        const message = {
          data: event.data,
          timestamp: new Date(),
        };
        setLastMessage(message);
        setMessageHistory((prev) => [...prev, message]);
        onMessage?.(event);
      };

      ws.current.onerror = (event) => {
        setConnectionStatus('Error');
        onError?.(event);
      };

      ws.current.onclose = (event) => {
        setConnectionStatus('Disconnected');
        onClose?.(event);

        // Attempt to reconnect if not manually closed and reconnection is enabled
        if (
          !isManualClose.current &&
          shouldReconnect &&
          reconnectCount.current < reconnectAttempts
        ) {
          reconnectCount.current++;
          reconnectTimeoutId.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };
    } catch (error) {
      setConnectionStatus('Error');
      console.error('WebSocket connection error:', error);
    }
  }, [
    url,
    protocols,
    onOpen,
    onMessage,
    onError,
    onClose,
    shouldReconnect,
    reconnectAttempts,
    reconnectInterval,
  ]);

  // Send message with queueing option
  const sendMessage = useCallback((message, queueIfNotReady = false) => {
    if (!ws.current) {
      console.warn('WebSocket is not initialized. Message not sent:', message);
      return false;
    }

    const readyState = ws.current.readyState;
    const messageToSend =
      typeof message === 'string' ? message : JSON.stringify(message);

    if (readyState === WebSocket.OPEN) {
      try {
        ws.current.send(messageToSend);
        return true;
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        return false;
      }
    } else if (queueIfNotReady && readyState === WebSocket.CONNECTING) {
      // Queue the message if connection is in progress
      messageQueue.current.push(messageToSend);
      console.log('Message queued until connection is ready:', message);
      return true;
    } else {
      const statusMap = {
        [WebSocket.CONNECTING]: 'connecting',
        [WebSocket.CLOSING]: 'closing',
        [WebSocket.CLOSED]: 'closed',
      };
      console.warn(
        `WebSocket is ${statusMap[readyState] || 'not ready'}. Message not sent:`,
        message,
      );
      return false;
    }
  }, []);

  // Send JSON message with queueing option
  const sendJsonMessage = useCallback(
    (message, queueIfNotReady = false) => {
      return sendMessage(JSON.stringify(message), queueIfNotReady);
    },
    [sendMessage],
  );

  // Manually disconnect
  const disconnect = useCallback(() => {
    isManualClose.current = true;
    if (reconnectTimeoutId.current) {
      clearTimeout(reconnectTimeoutId.current);
    }
    if (ws.current) {
      ws.current.close();
    }
  }, []);

  // Reconnect manually
  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(connect, 100);
  }, [connect, disconnect]);

  // Clear message history
  const clearMessageHistory = useCallback(() => {
    setMessageHistory([]);
    setLastMessage(null);
  }, []);

  // Get connection state
  const getReadyState = useCallback(() => {
    return ws.current?.readyState ?? WebSocket.CLOSED;
  }, []);

  // Initialize connection on mount
  useEffect(() => {
    if (url) {
      connect();
    }

    return () => {
      isManualClose.current = true;
      if (reconnectTimeoutId.current) {
        clearTimeout(reconnectTimeoutId.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect, url]);

  return {
    // Connection state
    connectionStatus,
    readyState: getReadyState(),

    // Messages
    lastMessage,
    messageHistory,

    // Actions
    sendMessage,
    sendJsonMessage,
    connect,
    disconnect,
    reconnect,
    clearMessageHistory,

    // Utilities
    isConnected: connectionStatus === 'Connected',
    isConnecting: connectionStatus === 'Connecting',
    isDisconnected: connectionStatus === 'Disconnected',
  };
};
