import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

@Injectable()
export class DistributedLockService implements OnModuleDestroy {
  private readonly redis: Redis
  private readonly instanceId = `${process.pid}-${Date.now()}`
  private readonly logger = new Logger(DistributedLockService.name)

  // Atomic Lua script: only delete the key if we still own it (prevents TOCTOU race)
  private readonly RELEASE_SCRIPT = [
    'if redis.call("get", KEYS[1]) == ARGV[1] then',
    '  return redis.call("del", KEYS[1])',
    'else',
    '  return 0',
    'end',
  ].join('\n')

  constructor(private config: ConfigService) {
    this.redis = new Redis({
      host: this.config.get('redis.host') || 'localhost',
      port: this.config.get('redis.port') || 6379,
      lazyConnect: true,
    })
  }

  async acquire(lockName: string, ttlSeconds = 60): Promise<boolean> {
    try {
      const result = await this.redis.set(
        `lock:${lockName}`,
        this.instanceId,
        'EX',
        ttlSeconds,
        'NX',
      )
      return result === 'OK'
    } catch (error) {
      this.logger.warn(`Failed to acquire lock ${lockName}`, error)
      return false
    }
  }

  async release(lockName: string): Promise<void> {
    try {
      // Atomic release via Redis Lua script — prevents TOCTOU race between GET and DEL
      await (this.redis as any).call(
        'EVAL', this.RELEASE_SCRIPT, 1, `lock:${lockName}`, this.instanceId,
      )
    } catch (error) {
      this.logger.warn(`Failed to release lock ${lockName}`, error)
    }
  }

  async onModuleDestroy() {
    await this.redis.quit()
  }
}
