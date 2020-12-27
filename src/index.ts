import { Server } from 'http';

import app from './app';
import config from './config/config';
import { loggerService } from './services';

let server: Server;

server = app.listen(config.port, () => {
  loggerService.writeLog(
    'info',
    `App listening on port ${config.port}`,
    'ServerListen',
  );
});

const exitHandler = () => {
  if (server) {
    server.close(() => {
      loggerService.writeLog('info', 'Server closed', 'ExitHandler');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error: any) => {
  loggerService.writeLog('error', error, 'UnexpectedErrorHandler');
  exitHandler();
};

// Test
process.setMaxListeners(0);
process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  loggerService.writeLog('info', 'SIGTERM received', 'SIGTERM');
  if (server) {
    server.close();
  }
});
