import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { MlGatewayService } from './ml-gateway.service';
import { MlGatewayController } from './ml-gateway.controller';

@Module({
  imports: [
    ConfigModule,
    ClientsModule.registerAsync([
      {
        name: 'ML_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'ml_service',
            protoPath: join(process.cwd(), '../proto/ml_service.proto'),
            url: configService.get<string>('mlService.url') || 'localhost:50051',
            loader: {
              keepCase: true,
              longs: String,
              enums: String,
              defaults: true,
              oneofs: true,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [MlGatewayController],
  providers: [MlGatewayService],
  exports: [MlGatewayService],
})
export class MlGatewayModule {}
