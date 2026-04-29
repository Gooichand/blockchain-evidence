const { createClient } = require('redis');
const NodeCache = require('node-cache');

class CacheService {
  constructor() {
    this.memoryCache = new NodeCache({ stdTTL: 60, checkperiod: 120 });
    this.redisClient = null;
    this.isRedisConnected = false;

    if (process.env.REDIS_URL) {
      this.initRedis();
    } else {
      console.log('📦 Caching Layer: Using fallback in-memory cache (Redis URL not provided)');
    }
  }

  async initRedis() {
    try {
      this.redisClient = createClient({
        url: process.env.REDIS_URL
      });

      this.redisClient.on('error', (err) => {
        console.error('Redis Client Error', err);
        this.isRedisConnected = false;
      });

      this.redisClient.on('connect', () => {
        console.log('📦 Caching Layer: Connected to Redis successfully');
        this.isRedisConnected = true;
      });

      await this.redisClient.connect();
    } catch (error) {
      console.warn('Failed to connect to Redis, falling back to memory cache:', error.message);
      this.isRedisConnected = false;
    }
  }

  async get(key) {
    if (this.isRedisConnected && this.redisClient) {
      try {
        const data = await this.redisClient.get(key);
        return data ? JSON.parse(data) : null;
      } catch (error) {
        console.warn(`Redis get error for key ${key}:`, error.message);
      }
    }
    return this.memoryCache.get(key);
  }

  async set(key, value, ttlSeconds = 60) {
    if (this.isRedisConnected && this.redisClient) {
      try {
        await this.redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
        return true;
      } catch (error) {
        console.warn(`Redis set error for key ${key}:`, error.message);
      }
    }
    return this.memoryCache.set(key, value, ttlSeconds);
  }

  async invalidate(key) {
    if (this.isRedisConnected && this.redisClient) {
      try {
        await this.redisClient.del(key);
      } catch (error) {
        console.warn(`Redis del error for key ${key}:`, error.message);
      }
    }
    this.memoryCache.del(key);
  }
}

module.exports = new CacheService();
