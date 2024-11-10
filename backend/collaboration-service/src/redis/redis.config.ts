import * as dotenv from 'dotenv';

dotenv.config();

export const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || 'redis',
  port: process.env.REDIS_PORT || 6379,
  keys: {
    sessionData: 'session_data',
    sessionWebSocket: 'session_websocket',
  },
};
