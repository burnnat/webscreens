import http from 'http';

import express from './config/express.js';
import config from './config/config.js';

export async function start() {
  const app = await express();

  const server: http.Server = new http.Server(app);

  server.listen(config.port);

  server.on('error', (e: Error) => {
    console.log('Error starting server' + e);
  });

  server.on('listening', () => {
    console.log(`Server started on port ${config.port}`);
  });
}