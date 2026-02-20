import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

@Injectable()
export class PanCryptoService {
  private readonly logger = new Logger(PanCryptoService.name)
  private readonly algorithm = 'aes-256-gcm'
  private readonly keyBuffer: Buffer

  constructor(private config: ConfigService) {
    const key = this.config.get<string>('pan.encryptionKey')
    if (key) {
      this.keyBuffer = Buffer.from(key, 'base64')
    } else {
      // Generate a temporary key for dev mode — encrypted data won't survive restarts
      this.keyBuffer = randomBytes(32)
      this.logger.warn(
        'PAN_ENCRYPTION_KEY not set — using ephemeral key. Set it in production!',
      )
    }
  }

  /**
   * Encrypt a plaintext PAN.
   * Returns a single string in the format `iv:authTag:ciphertext` (all base64).
   */
  encrypt(plainPan: string): string {
    const iv = randomBytes(16)
    const cipher = createCipheriv(this.algorithm, this.keyBuffer, iv)

    let encrypted = cipher.update(plainPan, 'utf8', 'base64')
    encrypted += cipher.final('base64')

    const authTag = cipher.getAuthTag()

    return [
      iv.toString('base64'),
      authTag.toString('base64'),
      encrypted,
    ].join(':')
  }

  /**
   * Decrypt an encrypted PAN string (format: `iv:authTag:ciphertext`).
   */
  decrypt(encryptedPan: string): string {
    const parts = encryptedPan.split(':')
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted PAN format — expected iv:authTag:ciphertext')
    }

    const [ivBase64, authTagBase64, ciphertext] = parts
    const iv = Buffer.from(ivBase64, 'base64')
    const authTag = Buffer.from(authTagBase64, 'base64')

    const decipher = createDecipheriv(this.algorithm, this.keyBuffer, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(ciphertext, 'base64', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  }

  /**
   * Mask a PAN for display in API responses.
   * Example: ABCDE1234F -> XXXXXX1234
   * Shows only the last 4 characters (digits before the final alpha).
   */
  mask(pan: string | null | undefined): string {
    if (!pan) return ''
    if (pan.length < 4) return pan
    return 'XXXXXX' + pan.slice(-4)
  }
}
