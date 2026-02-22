import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { Request, Response } from 'express'
import { ConfigService } from '@nestjs/config'
import { ClsService } from 'nestjs-cls'
import { CLS_CORRELATION_ID } from '../middleware/correlation-id.middleware'

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name)

  constructor(
    private readonly configService: ConfigService,
    private readonly cls: ClsService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()
    const isProduction =
      this.configService.get<string>('nodeEnv') === 'production'
    const correlationId = this.cls.get<string>(CLS_CORRELATION_ID)

    let status: number
    let message: string | string[]

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const exceptionResponse = exception.getResponse()
      message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message || exception.message
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR
      message = 'Internal server error'

      this.logger.error(
        `[${correlationId}] Unhandled exception on ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      )
    }

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(correlationId ? { requestId: correlationId } : {}),
      ...(isProduction
        ? {}
        : {
            stack:
              exception instanceof Error ? exception.stack : undefined,
          }),
    })
  }
}
