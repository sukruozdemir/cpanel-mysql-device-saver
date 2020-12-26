import expressAsyncHandler from 'express-async-handler';
import httpStatus from 'http-status';
import { deviceService } from '../services';

export const createDevice = expressAsyncHandler(async (req, res) => {
  const result = await deviceService.createDevice(req.body);
  res.status(httpStatus.CREATED).send(result);
});

export const saveToken = expressAsyncHandler(async (req, res) => {
  const result = await deviceService.saveDeviceToken(
    req.body.uniqueAppDeviceId,
    req.body.token,
  );
  res.status(httpStatus.OK).send(result);
});
