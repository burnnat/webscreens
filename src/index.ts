import * as http from 'http';

import express from './config/express';
import config from './config/config';

export function start() {
  const app = express();

  const server: http.Server = new http.Server(app);

  server.listen(config.port);

  server.on('error', (e: Error) => {
    console.log('Error starting server' + e);
  });

  server.on('listening', () => {
    console.log(`Server started on port ${config.port}`);
  });
}