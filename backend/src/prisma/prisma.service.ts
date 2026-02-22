import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { softDeleteExtension } from './prisma-soft-delete.extension';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private config: ConfigService) {
    const url = config.get<string>('database.url')
    const poolSize = config.get<number>('databasePoolSize') || 25
    const separator = url?.includes('?') ? '&' : '?'
    super({
      datasources: {
        db: { url: url ? `${url}${separator}connection_limit=${poolSize}` : undefined },
      },
    });
    return this.$extends(softDeleteExtension) as this;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
