const { createClient } = require('redis');

const client = createClient({
    username: 'default',
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    }
});
client.on('error', (err) => {
    console.error('Redis Client Error:', err);
});

const initRedis = async () => {
    try {
        await client.connect();
        console.log('Connected to Redis');
    } catch (error) {
        console.error('Redis connection failed:', error);

    }
};

const getClient = () => client;

module.exports = {
    getClient,
    initRedis
};
