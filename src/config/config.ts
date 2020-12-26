import dotenv from 'dotenv';
import joi from 'joi';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envVarsSchema = joi
  .object()
  .keys({
    NODE_ENV: joi.string().valid('production', 'development').required(),
    PORT: joi.number().default(3000),

    CPANEL_SSH_HOST: joi.string().ip().required(),
    CPANEL_SSH_PORT: joi.number().positive().default(22),
    CPANEL_USERNAME: joi.string().required(),
    CPANEL_AUTH_METHOD: joi.string().default('password'),
    CPANEL_PASSWORD: joi.string().required(),

    MYSQL_HOST: joi.string().ip().default('127.0.0.1').required(),
    MYSQL_PORT: joi.number().positive().default(3306),
    MYSQL_USER: joi.string().required(),
    MYSQL_PASSWORD: joi.string().required(),
    MYSQL_DATABASE: joi.string().required(),

    EXPO_ACCESS_TOKEN: joi.string(),
    PUSH_NOTIFICATIONS_ENABLED: joi.boolean().default(false),
  })
  .unknown();

const { value: envVars, error } = envVarsSchema
  .prefs({ errors: { label: 'key' } })
  .validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export default {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  logOutputPath: envVars.LOG_OUTPUT_PATH,
  expoAccessToken: envVars.EXPO_ACCESS_TOKEN,
  pushNotificationsEnabled: envVars.PUSH_NOTIFICATIONS_ENABLED,
  cpanel: {
    host: envVars.CPANEL_SSH_HOST,
    port: envVars.CPANEL_SSH_PORT,
    username: envVars.CPANEL_USERNAME,
    password: envVars.CPANEL_PASSWORD,
    method: envVars.CPANEL_AUTH_METHOD,
  },
  mysql: {
    host: envVars.MYSQL_HOST,
    port: envVars.MYSQL_PORT,
    user: envVars.MYSQL_USER,
    password: envVars.MYSQL_PASSWORD,
    database: envVars.MYSQL_DATABASE,
  },
};
