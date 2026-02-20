import { Module } from '@nestjs/common';
import { TaxesController } from './taxes.controller';
import { TaxesService } from './taxes.service';
import { FaTaxController } from './fa-tax.controller';
import { FaTaxService } from './fa-tax.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TaxesController, FaTaxController],
  providers: [TaxesService, FaTaxService],
  exports: [TaxesService, FaTaxService],
})
export class TaxesModule {}
