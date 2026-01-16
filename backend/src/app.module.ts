import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import configuration from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { PersonasModule } from './personas/personas.module';
import { AllocationsModule } from './allocations/allocations.module';
import { MlModelsModule } from './ml-models/ml-models.module';
import { MlGatewayModule } from './ml-gateway/ml-gateway.module';
import { FundsModule } from './funds/funds.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    PrismaModule,
    AuthModule,
    PersonasModule,
    AllocationsModule,
    MlModelsModule,
    MlGatewayModule,
    FundsModule,
  ],
  controllers: [],
  providers: [
    // Global JWT guard - all routes require auth by default
    // Use @Public() decorator to make routes public
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
