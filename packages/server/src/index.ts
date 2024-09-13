import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

wss.on('listening', function listening() {
  console.log('Listening on 8080');
});

wss.on('connection', function connection(ws) {
  console.log('client connected.');

  ws.on('error', console.error);

  ws.on('message', function message(data) {
    console.log('received: %s', data);
  });

  ws.send('something');

  ws.on('close', () => {
    // Log a message when a client disconnects
    console.log('Client disconnected');
  });
});
