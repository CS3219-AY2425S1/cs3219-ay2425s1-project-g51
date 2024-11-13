import * as dotenv from 'dotenv';

dotenv.config();

export const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || 'redis',
  port: process.env.REDIS_PORT || 6379,
  keys: {
    matchRequests: 'match_requests',
    matchDetails: 'match_details:',
    userMatches: 'user_matches:',
  },
};