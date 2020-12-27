import httpStatus from 'http-status';
import { Expo } from 'expo-server-sdk';
import { database, closeConnection } from '../utils/database';
import { ApiError } from '../utils/api-error';
import { RowDataPacket } from 'mysql2';

export const createDevice = async (postData: any) => {
  const connection = await database();

  const [rows] = await connection.execute<RowDataPacket[]>(
    'SELECT COUNT(*) AS count FROM devices WHERE uniqueAppDeviceId = ?',
    [postData.uniqueAppDeviceId],
  );

  if (rows[0].count > 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Device already added');
  }

  await connection.query('INSERT INTO devices SET ?', postData);
  await closeConnection();
  return { message: 'OK' };
};

export const saveDeviceToken = async (uniqueAppDeviceId: string, token: string) => {
  const connection = await database();

  const [rows] = await connection.execute<RowDataPacket[]>(
    'SELECT COUNT(*) AS count FROM devices WHERE uniqueAppDeviceId = ?',
    [uniqueAppDeviceId],
  );

  if (rows[0].count === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Device couldn't found");
  }

  const updateQuery = 'UPDATE devices SET token = ? WHERE uniqueAppDeviceId = ?';
  await connection.query(updateQuery, [token, uniqueAppDeviceId]);
  await closeConnection();
  return { message: 'OK' };
};
