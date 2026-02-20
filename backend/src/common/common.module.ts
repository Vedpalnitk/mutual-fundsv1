import { Global, Module } from '@nestjs/common'
import { PanCryptoService } from './services/pan-crypto.service'

@Global()
@Module({
  providers: [PanCryptoService],
  exports: [PanCryptoService],
})
export class CommonModule {}
