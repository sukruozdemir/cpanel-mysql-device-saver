import winston, { format } from 'winston';
import 'winston-daily-rotate-file';
import config from './config';

const enumerateErrorFormat = format(info => {
  if (info instanceof Error) {
    Object.assign(info, { message: info.stack });
  }
  return info;
});

const formater = format.printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${level}] ${label} : ${message}`;
});

const options = {
  error: {
    level: 'error',
    format: format.combine(
      enumerateErrorFormat(),
      format.timestamp(),
      formater,
      format.splat(),
    ),
    filename: `${process.cwd()}/${config.logOutputPath}/logs/%DATE%-error.log`,
    handleException: true,
    json: true,
    colorize: false,
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
  },
  info: {
    level: 'info',
    format: format.combine(
      enumerateErrorFormat(),
      format.timestamp(),
      formater,
      format.splat(),
    ),
    filename: `${process.cwd()}/${config.logOutputPath}/logs/%DATE%-combined.log`,
    handleException: false,
    json: true,
    colorize: false,
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
  },
  console: {
    format: format.combine(enumerateErrorFormat(), format.timestamp(), formater),
    level: 'debug',
    handleExceptions: true,
    json: false,
    colorize: true,
  },
};

const logger = winston.createLogger({
  level: config.env === 'development' ? 'debug' : 'info',
  transports: [
    new winston.transports.DailyRotateFile(options.error),
    new winston.transports.DailyRotateFile(options.info),
  ],
  exitOnError: false,
});

if (config.env === 'development') {
  logger.add(new winston.transports.Console(options.console));
}

export { logger };
