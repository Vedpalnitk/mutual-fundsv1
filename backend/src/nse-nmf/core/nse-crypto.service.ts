import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

@Injectable()
export class NseCryptoService {
  private readonly algorithm = 'aes-256-gcm'
  private readonly keyBuffer: Buffer

  constructor(private config: ConfigService) {
    const key = this.config.get<string>('nmf.encryptionKey')
    if (key) {
      this.keyBuffer = Buffer.from(key, 'base64')
    } else {
      // Generate a temporary key for dev/mock mode
      this.keyBuffer = randomBytes(32)
    }
  }

  encrypt(plaintext: string): { encrypted: string; iv: string } {
    const iv = randomBytes(16)
    const cipher = createCipheriv(this.algorithm, this.keyBuffer, iv)

    let encrypted = cipher.update(plaintext, 'utf8', 'base64')
    encrypted += cipher.final('base64')

    const authTag = cipher.getAuthTag()
    const combined = encrypted + ':' + authTag.toString('base64')

    return {
      encrypted: combined,
      iv: iv.toString('base64'),
    }
  }

  decrypt(encryptedData: string, ivBase64: string): string {
    const iv = Buffer.from(ivBase64, 'base64')
    const [encrypted, authTagBase64] = encryptedData.split(':')
    const authTag = Buffer.from(authTagBase64, 'base64')

    const decipher = createDecipheriv(this.algorithm, this.keyBuffer, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encrypted, 'base64', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  }
}
