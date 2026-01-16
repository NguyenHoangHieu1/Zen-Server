import { RedisClientType, createClient } from 'redis';
import { config } from 'dotenv';

config();

export const client: RedisClientType = createClient({
  socket: {
    host: process.env.CLOUD_REDIS_HOST,
    port: parseInt(process.env.CLOUD_REDIS_PORT),
  },
  password: process.env.CLOUD_REDIS_PASSWORD,
});

client.on('error', (err) => console.error(err));
client.connect();
