import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../../prisma/prisma.service'
import { NseHttpClient } from '../core/nse-http.client'
import { NseErrorMapper } from '../core/nse-error.mapper'
import { NseCredentialsService } from '../credentials/nse-credentials.service'
import { NseMockService } from '../mocks/nse-mock.service'
import { NSE_ENDPOINTS, NSE_TIMEOUTS } from '../core/constants/endpoints'

@Injectable()
export class NseReportsService {
  private readonly logger = new Logger(NseReportsService.name)

  constructor(
    private prisma: PrismaService,
    private httpClient: NseHttpClient,
    private errorMapper: NseErrorMapper,
    private credentialsService: NseCredentialsService,
    private mockService: NseMockService,
    private config: ConfigService,
  ) {}

  async getReport(advisorId: string, reportType: string, params: any) {
    const endpointMap: Record<string, string> = {
      'order-status': NSE_ENDPOINTS.ORDER_STATUS,
      'order-lifecycle': NSE_ENDPOINTS.ORDER_LIFECYCLE,
      'prov-orders': NSE_ENDPOINTS.PROV_ORDERS,
      'allotment': NSE_ENDPOINTS.ALLOTMENT_STATEMENT,
      'redemption': NSE_ENDPOINTS.REDEMPTION_STATEMENT,
      'mandate-status': NSE_ENDPOINTS.MANDATE_STATUS,
      'sip-registration': NSE_ENDPOINTS.SIP_REG_REPORT,
      'xsip-registration': NSE_ENDPOINTS.XSIP_REG_REPORT,
      'stp-registration': NSE_ENDPOINTS.STP_REG_REPORT,
      'swp-registration': NSE_ENDPOINTS.SWP_REG_REPORT,
      'sip-cancellation': NSE_ENDPOINTS.SIP_CAN_REPORT,
      'xsip-cancellation': NSE_ENDPOINTS.XSIP_CAN_REPORT,
      'sip-installment-due': NSE_ENDPOINTS.SIP_INST_DUE,
      'xsip-installment-due': NSE_ENDPOINTS.XSIP_INST_DUE,
      'stp-installment-due': NSE_ENDPOINTS.STP_INST_DUE,
      'swp-installment-due': NSE_ENDPOINTS.SWP_INST_DUE,
      'client-detail': NSE_ENDPOINTS.CLIENT_DETAIL,
      'client-master': NSE_ENDPOINTS.CLIENT_MASTER,
      'client-kyc': NSE_ENDPOINTS.CLIENT_KYC,
      'fatca': NSE_ENDPOINTS.FATCA_REPORT,
      'transaction-detail': NSE_ENDPOINTS.TRANSACTION_DETAIL,
      '2fa': NSE_ENDPOINTS.TWO_FA_REPORT,
      'scheme-master': NSE_ENDPOINTS.MASTER_DOWNLOAD,
      'client-authorization': NSE_ENDPOINTS.CLIENT_AUTHORIZATION,
      'aof-upload': NSE_ENDPOINTS.AOF_UPLOAD_REPORT,
      'elog-upload': NSE_ENDPOINTS.ELOG_UPLOAD_REPORT,
      'sip-topup': NSE_ENDPOINTS.SIP_TOPUP_REPORT,
      'stepup-registration': NSE_ENDPOINTS.STEPUP_REG_REPORT,
      'xsip-topup': NSE_ENDPOINTS.XSIP_TOPUP_REPORT,
      'member-fund-allocation': NSE_ENDPOINTS.MEMBER_FUND_ALLOCATION,
      'member-fund-agewise': NSE_ENDPOINTS.MEMBER_FUND_AGEWISE,
      'redemption-payout': NSE_ENDPOINTS.REDEMPTION_PAYOUT,
      'redemption-payout-nondemat': NSE_ENDPOINTS.REDEMPTION_PAYOUT_NON_DEMAT,
      'stp-cancellation': NSE_ENDPOINTS.STP_CAN_REPORT,
      'swp-cancellation': NSE_ENDPOINTS.SWP_CAN_REPORT,
    }

    const endpoint = endpointMap[reportType]
    if (!endpoint) {
      return { success: false, message: `Unknown report type: ${reportType}` }
    }

    const isMockMode = this.config.get<boolean>('nmf.mockMode')

    if (isMockMode) {
      if (reportType === 'order-status') return this.mockService.mockOrderStatusReport()
      if (reportType === 'allotment') return this.mockService.mockAllotmentStatementResponse()
      if (reportType === 'scheme-master') return this.mockService.mockSchemeMasterData()
      return { status: 'SUCCESS', data: [], message: 'Mock report' }
    }

    const credentials = await this.credentialsService.getDecryptedCredentials(advisorId)

    const response = await this.httpClient.jsonRequest(
      endpoint,
      params,
      credentials,
      advisorId,
      `REPORT_${reportType.toUpperCase().replace(/-/g, '_')}`,
      NSE_TIMEOUTS.REPORT,
    )

    return this.errorMapper.parseResponse(response.parsed)
  }
}
