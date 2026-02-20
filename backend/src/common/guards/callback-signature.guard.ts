import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
  SetMetadata,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import * as crypto from 'crypto'

export const CALLBACK_SECRET_KEY = 'callback_secret'
export const CallbackSecret = (configKey: string) =>
  SetMetadata(CALLBACK_SECRET_KEY, configKey)

@Injectable()
export class CallbackSignatureGuard implements CanActivate {
  private readonly logger = new Logger(CallbackSignatureGuard.name)

  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const configKey = this.reflector.get<string>(
      CALLBACK_SECRET_KEY,
      context.getHandler(),
    )
    if (!configKey) return true // No secret configured for this endpoint

    const secret = this.configService.get<string>(configKey)
    if (!secret) {
      // No secret configured — log warning but allow (fail-open for dev, should be set in prod)
      this.logger.warn(
        `No callback secret configured for ${configKey}. Skipping signature verification.`,
      )
      return true
    }

    const request = context.switchToHttp().getRequest()
    const signature =
      request.headers['x-callback-signature'] ||
      request.headers['x-hub-signature-256']

    if (!signature) {
      this.logger.warn('Callback received without signature header')
      throw new ForbiddenException('Missing callback signature')
    }

    const body = JSON.stringify(request.body)
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex')

    const sigBuffer = Buffer.from(signature)
    const expectedBuffer = Buffer.from(expectedSignature)

    if (sigBuffer.length !== expectedBuffer.length) {
      this.logger.warn('Invalid callback signature received (length mismatch)')
      throw new ForbiddenException('Invalid callback signature')
    }

    const isValid = crypto.timingSafeEqual(sigBuffer, expectedBuffer)

    if (!isValid) {
      this.logger.warn('Invalid callback signature received')
      throw new ForbiddenException('Invalid callback signature')
    }

    return true
  }
}
