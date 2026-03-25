const redis = require('redis');

const client = redis.createClient({
  url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`
});

client.on('error', (err) => console.error('Redis Client Error', err));

const connectRedis = async () => {
    await client.connect();
    console.log('Redis Connected');
}

module.exports = { client, connectRedis };
