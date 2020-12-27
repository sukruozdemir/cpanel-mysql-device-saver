import compression from 'compression';
import cors from 'cors';
import express, { Application, NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import httpStatus from 'http-status';
import responseTime from 'response-time';
import xss from 'xss-clean';
import * as cron from 'node-cron';

import routes from './routes';
import * as morgan from './config/morgan';
import { errorConverter, errorHandler } from './middlewares/error.middleware';
import { ApiError } from './utils/api-error';
import { deviceService } from './services';

const app: Application = express();

app.use(morgan.successHandler);
app.use(morgan.errorHandler);

app.use(responseTime());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(xss());
app.use(compression());
app.use(cors());
app.options('*', cors());
app.use('/', routes);

// send back a 404 error for any unknown api request
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

cron.schedule('*/5 * * * *', async () => {
  await deviceService.sendNewProductNotifications();
});

export default app;
