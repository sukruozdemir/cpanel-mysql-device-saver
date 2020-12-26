import httpStatus from 'http-status';
import { Expo } from 'expo-server-sdk';
import { database, closeConnection } from '../utils/database';
import { ApiError } from '../utils/api-error';

export const createDevice = async (postData: any) => {
  const connection = await database();
  const queryResult = await connection.execute(
    'SELECT * FROM `devices` WHERE `uniqueAppDeviceId` = ?',
    [postData.uniqueAppDeviceId],
  );

  if (queryResult.length > 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Device already added');
  }

  let queryString =
    'INSERT INTO `devices` (`uniqueAppDeviceId`, `brand`, `manufacturer`, `modelName`, `modelId`, `designName`, `productName`, `deviceYearClass`, `totalMemory`, `osName`, `osVersion`, `osBuildId`, `osInternalBuildId`, `osBuildFingerprint`, `platformApiLevel`, `deviceName`, `deviceType`, `networkStateType`, `networkIpAddress`, `networkMacAddress`) ';
  queryString +=
    'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

  await connection.execute(queryString, [
    postData.uniqueAppDeviceId,
    postData.brand,
    postData.manufacturer,
    postData.modelName,
    postData.modelId,
    postData.designName,
    postData.productName,
    postData.deviceYearClass,
    postData.totalMemory,
    postData.osName,
    postData.osVersion,
    postData.osBuildId,
    postData.osInternalBuildId,
    postData.osBuildFingerprint,
    postData.platformApiLevel,
    postData.deviceName,
    postData.deviceType,
    postData.networkStateType,
    postData.networkIpAddress,
    postData.networkMacAddress,
  ]);

  await closeConnection();
  return { message: 'OK' };
};

export const saveDeviceToken = async (uniqueAppDeviceId: string, token: string) => {
  const connection = await database();
  const queryResult = await connection.execute(
    'SELECT * FROM `devices` WHERE `uniqueAppDeviceId` = ?',
    [uniqueAppDeviceId],
  );

  if (queryResult.length <= 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Device couldn't found");
  }

  const updateQuery =
    'UPDATE `devices` SET `token = ? WHERE `uniqueAppDeviceId` = ?';
  await connection.execute(updateQuery, [token, uniqueAppDeviceId]);
  await closeConnection();
  return { message: 'OK' };
};
