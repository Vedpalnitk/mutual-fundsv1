import { Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { ClsService } from 'nestjs-cls'
import { randomUUID } from 'crypto'

export const CLS_CORRELATION_ID = 'correlationId'

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  constructor(private readonly cls: ClsService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const correlationId =
      (req.headers['x-request-id'] as string) || randomUUID()

    this.cls.set(CLS_CORRELATION_ID, correlationId)
    res.setHeader('X-Request-ID', correlationId)

    next()
  }
}
