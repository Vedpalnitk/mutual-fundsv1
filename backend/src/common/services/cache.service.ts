import { Injectable, OnModuleInit, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { caching, Cache } from 'cache-manager'
import { redisStore } from 'cache-manager-ioredis-yet'

@Injectable()
export class CacheService implements OnModuleInit {
  private cache!: Cache
  private readonly logger = new Logger(CacheService.name)

  constructor(private config: ConfigService) {}

  async onModuleInit() {
    try {
      this.cache = await caching(redisStore, {
        host: this.config.get('redis.cacheHost') || this.config.get('redis.host') || 'localhost',
        port: this.config.get('redis.cachePort') || this.config.get('redis.port') || 6379,
        ttl: 60 * 1000, // default 60s in ms
      })
      this.logger.log('Redis cache initialized')
    } catch (error) {
      this.logger.warn('Failed to initialize Redis cache, falling back to no-op', error)
      // Create a no-op cache so the app still works without Redis
      this.cache = {
        get: async () => undefined,
        set: async () => {},
        del: async () => {},
        wrap: async (_key: string, fn: () => Promise<any>) => fn(),
        reset: async () => {},
        store: {} as any,
      } as unknown as Cache
    }
  }

  async get<T>(key: string): Promise<T | undefined> {
    return this.cache.get<T>(key)
  }

  async set(key: string, value: any, ttlMs?: number): Promise<void> {
    await this.cache.set(key, value, ttlMs)
  }

  async del(key: string): Promise<void> {
    await this.cache.del(key)
  }

  async wrap<T>(key: string, fn: () => Promise<T>, ttlMs?: number): Promise<T> {
    return this.cache.wrap(key, fn, ttlMs) as Promise<T>
  }
}
