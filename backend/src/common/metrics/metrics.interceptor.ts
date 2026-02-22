import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Observable, tap } from 'rxjs'
import { Request, Response } from 'express'
import { MetricsService } from './metrics.service'

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<Request>()
    const start = process.hrtime.bigint()

    // Normalize route to avoid high-cardinality labels
    const route = req.route?.path || req.path

    return next.handle().pipe(
      tap({
        next: () => {
          const res = context.switchToHttp().getResponse<Response>()
          this.record(req.method, route, res.statusCode, start)
        },
        error: () => {
          const res = context.switchToHttp().getResponse<Response>()
          this.record(req.method, route, res.statusCode || 500, start)
        },
      }),
    )
  }

  private record(method: string, route: string, statusCode: number, start: bigint) {
    const durationSec = Number(process.hrtime.bigint() - start) / 1e9
    this.metricsService.httpRequestsTotal.inc({ method, route, status_code: String(statusCode) })
    this.metricsService.httpRequestDuration.observe({ method, route }, durationSec)
  }
}
