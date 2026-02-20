import { Injectable, Logger } from '@nestjs/common'
import { createCipheriv, randomBytes } from 'crypto'

/**
 * NSE NMF stateless per-request auth header builder.
 *
 * Every request requires:
 * 1. Generate random 32-char alphanumeric `salt`
 * 2. Generate random 32-char alphanumeric `iv`
 * 3. Build `plain_text` = `API_Secret|RandomNumber`
 * 4. AES-128-CBC encrypt: AES128(salt, iv, memberLicenseKey, plain_text)
 * 5. Build `EncryptedPassword` = base64(iv::salt::ciphertext)
 * 6. Return `Authorization: BASIC base64(LoginUserID:EncryptedPassword)`
 *
 * No session tokens, no caching — completely stateless.
 */
@Injectable()
export class NseAuthBuilder {
  private readonly logger = new Logger(NseAuthBuilder.name)

  /**
   * Build the auth headers for an NSE API request
   */
  buildHeaders(credentials: {
    memberId: string
    loginUserId: string
    apiSecret: string
    memberLicenseKey: string
  }): Record<string, string> {
    const encryptedPassword = this.buildEncryptedPassword(
      credentials.apiSecret,
      credentials.memberLicenseKey,
    )

    const authValue = Buffer.from(
      `${credentials.loginUserId}:${encryptedPassword}`,
    ).toString('base64')

    return {
      'Content-Type': 'application/json',
      memberId: credentials.memberId,
      Authorization: `BASIC ${authValue}`,
    }
  }

  private buildEncryptedPassword(apiSecret: string, memberLicenseKey: string): string {
    const salt = this.randomAlphanumeric(32)
    const iv = this.randomAlphanumeric(32)
    const randomNumber = this.randomAlphanumeric(16)
    const plainText = `${apiSecret}|${randomNumber}`

    // AES-128-CBC encryption
    // Key = first 16 bytes of memberLicenseKey, IV = first 16 bytes of iv string
    const keyBuffer = Buffer.from(memberLicenseKey.substring(0, 16), 'utf8')
    const ivBuffer = Buffer.from(iv.substring(0, 16), 'utf8')

    const cipher = createCipheriv('aes-128-cbc', keyBuffer, ivBuffer)
    cipher.setAutoPadding(true)

    let encrypted = cipher.update(plainText, 'utf8', 'base64')
    encrypted += cipher.final('base64')

    // EncryptedPassword = base64(iv::salt::ciphertext)
    const combined = `${iv}::${salt}::${encrypted}`
    return Buffer.from(combined).toString('base64')
  }

  private randomAlphanumeric(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const bytes = randomBytes(length)
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars[bytes[i] % chars.length]
    }
    return result
  }
}
