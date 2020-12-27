import {
  Expo,
  ExpoPushMessage,
  ExpoPushReceipt,
  ExpoPushTicket,
} from 'expo-server-sdk';
import httpStatus from 'http-status';
import { RowDataPacket } from 'mysql2';

import config from '../config/config';
import { loggerService } from '../services';
import { ApiError } from '../utils/api-error';
import { closeConnection, database } from '../utils/database';

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

export const sendNewProductNotifications = async () => {
  const connection = await database();

  let orders;
  let devices;

  [devices] = await connection.execute<RowDataPacket[]>(
    'SELECT * FROM devices WHERE token IS NOT NULL',
  );
  [orders] = await connection.execute<RowDataPacket[]>(
    'SELECT P.product_title, O.amount, O.piece FROM `order` O JOIN `site` S ON O.order_site = S.site_id JOIN `products` P ON S.site_product_id = P.product_id WHERE O.notification_sent IS NULL OR O.notification_sent = FALSE',
  );

  const devicePushTokens = devices.map(device => device.token);

  // Create a new Expo SDK client
  // optionally providing an access token if you have enabled push security
  const expo = new Expo({ accessToken: config.expoAccessToken });

  // Create the messages that you want to send to clients
  const messages: ExpoPushMessage[] = [];
  for (const pushToken of devicePushTokens) {
    // Each push token looks like ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]

    // Check that all your push tokens appear to be valid Expo push tokens
    if (!Expo.isExpoPushToken(pushToken)) {
      loggerService.writeLog(
        'error',
        `Push token ${pushToken} is not a valid Expo push token`,
        'Expo send notification',
      );
      continue;
    }

    orders.forEach(order => {
      messages.push({
        to: pushToken,
        sound: 'default',
        title: 'Yeni Sipariş Geldi',
        body: `${order.product_title} - ${order.amount} TL - ${order.piece} Adet`,
      });
    });

    // for (const order of orders) {
    //   // Construct a message (see https://docs.expo.io/push-notifications/sending-notifications/)
    //   messages.push({
    //     to: pushToken,
    //     sound: 'default',
    //     title: 'Yeni Sipariş Geldi',
    //     body: `${order[0]} - ${order[1]} TL - ${order[2]} Adet`,
    //   });
    // }
  }

  // The Expo push notification service accepts batches of notifications so
  // that you don't need to send 1000 requests to send 1000 notifications. We
  // recommend you batch your notifications to reduce the number of requests
  // and to compress them (notifications with similar content will get
  // compressed).
  const chunks = expo.chunkPushNotifications(messages);
  const tickets: any = [];
  (async () => {
    // Send the chunks to the Expo push notification service. There are
    // different strategies you could use. A simple one is to send one chunk at a
    // time, which nicely spreads the load out over time:
    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        // console.log(ticketChunk);
        tickets.push(...ticketChunk);
        // NOTE: If a ticket contains an error code in ticket.details.error, you
        // must handle it appropriately. The error codes are listed in the Expo
        // documentation:
        // https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
      } catch (error) {
        loggerService.writeLog('error', error, 'EXPO TICKETS');
        // TODO: Handle ticket error
      }
    }
  })();

  // Later, after the Expo push notification service has delivered the
  // notifications to Apple or Google (usually quickly, but allow the the service
  // up to 30 minutes when under load), a "receipt" for each notification is
  // created. The receipts will be available for at least a day; stale receipts
  // are deleted.
  //
  // The ID of each receipt is sent back in the response "ticket" for each
  // notification. In summary, sending a notification produces a ticket, which
  // contains a receipt ID you later use to get the receipt.
  //
  // The receipts may contain error codes to which you must respond. In
  // particular, Apple or Google may block apps that continue to send
  // notifications to devices that have blocked notifications or have uninstalled
  // your app. Expo does not control this policy and sends back the feedback from
  // Apple and Google so you can handle it appropriately.
  const receiptIds: string[] = [];
  for (const ticket of tickets) {
    // NOTE: Not all tickets have IDs; for example, tickets for notifications
    // that could not be enqueued will have error information and no receipt ID.
    if (ticket.id) {
      receiptIds.push(ticket.id);
    }
  }

  const receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
  (async () => {
    // Like sending notifications, there are different strategies you could use
    // to retrieve batches of receipts from the Expo service.
    for (const chunk of receiptIdChunks) {
      try {
        const receipts: any = await expo.getPushNotificationReceiptsAsync(chunk);
        loggerService.writeLog('info', receipts.toString(), 'receiptIdChunks');

        // The receipts specify whether Apple or Google successfully received the
        // notification and information about an error, if one occurred.
        // tslint:disable-next-line: forin
        for (const receiptId in receipts) {
          const { status, message, details } = receipts[receiptId];
          if (status === 'ok') {
            continue;
          } else if (status === 'error') {
            loggerService.writeLog(
              'error',
              `There was an error sending a notification: ${message}`,
              'receiptIdChunks',
            );

            if (details && details.error) {
              // The error codes are listed in the Expo documentation:
              // https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
              // You must handle the errors appropriately.
              loggerService.writeLog(
                'error',
                `The error code is ${details.error}`,
                'receiptIdChunks',
              );
            }
          }
        }
      } catch (error) {
        loggerService.writeLog(
          'error',
          `The error code is ${error}`,
          'receiptIdChunks',
        );
      }
    }
  })();

  const updateQuery =
    'UPDATE `order` SET notification_sent = TRUE WHERE notification_sent IS NULL OR notification_sent = FALSE';
  await connection.query(updateQuery);
  await closeConnection();
};
