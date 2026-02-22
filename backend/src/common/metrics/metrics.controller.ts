import { Controller, Get, Header } from '@nestjs/common'
import { Public } from '../decorators/public.decorator'
import { MetricsService } from './metrics.service'

@Controller('metrics')
export class MetricsController {
  constructor(private metricsService: MetricsService) {}

  @Get()
  @Public()
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  async getMetrics(): Promise<string> {
    return this.metricsService.getMetrics()
  }
}
