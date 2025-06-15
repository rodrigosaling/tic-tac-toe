import React, { useState, useCallback, useEffect } from 'react';
import './index.css';
import { useWebSocket } from './use-websocket';
import { Button } from './components/ui/button';

export function App() {
  const socketUrl = 'ws://localhost:3000/api';
  const [messageHistory, setMessageHistory] = useState<MessageEvent<string>[]>(
    [],
  );

  // const { sendMessage, lastMessage, connectionStatus, isConnected, connect } =
  //   useWebSocket(socketUrl, {
  //     reconnectAttempts: 5,
  //     reconnectInterval: 2000,
  //     shouldReconnect: false,
  //   });

  useEffect(() => {
    if (lastMessage !== null) {
      setMessageHistory((prev) => prev.concat(lastMessage));
    }
  }, [lastMessage]);

  const handleClickSendMessage = useCallback(() => sendMessage('Hello'), []);

  return (
    <>
      <h1>Tic-Tac-Toe</h1>
      <Button onClick={connect}>Connect</Button>
      <Button onClick={handleClickSendMessage} disabled={!isConnected}>
        Click Me to send Hello
      </Button>
      <span>The WebSocket is currently {connectionStatus}</span>
      {lastMessage ? <span>Last message: {lastMessage.data}</span> : null}
      <ul>
        {messageHistory.map((message, idx) => (
          <span key={idx}>{message ? message.data : null}</span>
        ))}
      </ul>
    </>
  );
}

export default App;
