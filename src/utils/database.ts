import mysql from 'mysql2/promise';
import { Client as SSHClient } from 'ssh2';
import config from '../config/config';

const ssh = new SSHClient();

export const database = (): Promise<mysql.Connection> =>
  new Promise((resolve, reject) => {
    ssh
      .on('ready', () => {
        ssh.forwardOut(
          '127.0.0.1',
          12345,
          config.mysql.host,
          config.mysql.port,
          (err, stream) => {
            if (err) {
              ssh.end();
              return reject('SSH connection failed');
            }

            const connection = mysql.createConnection({
              host: config.mysql.host,
              port: config.mysql.port,
              user: config.mysql.user,
              password: config.mysql.password,
              database: config.mysql.database,
              stream,
            });
            resolve(connection);
          },
        );
      })
      .connect({
        host: config.cpanel.host,
        port: config.cpanel.port,
        username: config.cpanel.username,
        password: config.cpanel.password,
      });
  });

export const closeConnection = () =>
  new Promise((resolve, reject) => {
    database()
      .then(connection => connection.end().catch(reject))
      .then(() => {
        ssh.end();
      })
      .catch(reject);
    resolve('Closed');
  });
