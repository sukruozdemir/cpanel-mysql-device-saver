import { Request, Response } from 'express';
import morgan from 'morgan';

import { loggerService } from '../services';
import config from './config';

morgan.token(
  'message',
  (req: Request, res: Response) => res.locals.errorMessage || '',
);

const getIpFormat = () => (config.env === 'production' ? ':remote-addr - ' : '');
const successResponseFormat = `${getIpFormat()}:method :url :status - :response-time ms`;
const errorResponseFormat = `${getIpFormat()}:method :url :status - :response-time ms - message: :message`;

const successHandler = morgan(successResponseFormat, {
  skip: (req: Request, res: Response) => res.statusCode >= 400,
  stream: {
    write: message => loggerService.writeLog('info', message.trim(), 'Request'),
  },
});

const errorHandler = morgan(errorResponseFormat, {
  skip: (req: Request, res: Response) => res.statusCode < 400,
  stream: {
    write: message => loggerService.writeLog('error', message.trim(), 'Request'),
  },
});

export { successHandler, errorHandler };
