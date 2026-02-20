import { Injectable, BadRequestException, UnauthorizedException, InternalServerErrorException, ServiceUnavailableException } from '@nestjs/common'
import { getNseErrorMessage, isNseSuccess } from './constants/error-codes'

export interface NseApiResult {
  success: boolean
  status: string
  message: string
  data?: any
}

@Injectable()
export class NseErrorMapper {
  /**
   * Parse a standard NSE JSON response into a structured result
   * Most NSE responses contain: status, remark/message, and optional data fields
   */
  parseResponse(response: any): NseApiResult {
    if (!response) {
      return { success: false, status: 'EMPTY', message: 'Empty response from NSE' }
    }

    // NSE uses various status field names
    const status = response.trxn_status
      || response.reg_status
      || response.can_status
      || response.status
      || response.Status
      || ''

    const message = response.trxn_remark
      || response.reg_remark
      || response.can_remark
      || response.remark
      || response.message
      || response.Message
      || getNseErrorMessage(status)

    return {
      success: isNseSuccess(status),
      status: status.toString().trim(),
      message,
      data: response,
    }
  }

  throwIfError(result: NseApiResult): void {
    if (result.success) return

    const status = result.status.toUpperCase()

    // Auth errors
    if (status.includes('INVALID_AUTH') || status.includes('INVALID_MEMBER') || status.includes('IP_NOT_WHITELISTED')) {
      throw new UnauthorizedException(`NSE authentication failed: ${result.message}`)
    }

    // Client/registration errors
    if (status.includes('INVALID_CLIENT') || status.includes('KYC') || status.includes('REG_FAILED')) {
      throw new BadRequestException(`NSE client error: ${result.message}`)
    }

    // Transaction/order errors
    if (status.includes('TRXN FAILED') || status.includes('INVALID_SCHEME') || status.includes('INVALID_AMOUNT')) {
      throw new BadRequestException(`NSE order error: ${result.message}`)
    }

    // Mandate errors
    if (status.includes('MANDATE')) {
      throw new BadRequestException(`NSE mandate error: ${result.message}`)
    }

    // Cancellation errors
    if (status.includes('CAN_FAILED')) {
      throw new BadRequestException(`NSE cancellation error: ${result.message}`)
    }

    // System/service errors
    if (status.includes('SERVICE_UNAVAILABLE') || status.includes('TIMEOUT')) {
      throw new ServiceUnavailableException(`NSE system error: ${result.message}`)
    }

    throw new InternalServerErrorException(`NSE error (${result.status}): ${result.message}`)
  }
}
