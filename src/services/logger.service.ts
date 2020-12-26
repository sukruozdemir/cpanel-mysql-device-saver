import { logger } from '../config/logger';

export function writeLog(level: string, message: string, label: string) {
  logger.log(level, message, { label });
}
