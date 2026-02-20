import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../../prisma/prisma.service'
import { NseHttpClient } from '../core/nse-http.client'
import { NseErrorMapper } from '../core/nse-error.mapper'
import { NseCredentialsService } from '../credentials/nse-credentials.service'
import { NseMockService } from '../mocks/nse-mock.service'
import { NSE_ENDPOINTS } from '../core/constants/endpoints'

@Injectable()
export class NseSwitchService {
  private readonly logger = new Logger(NseSwitchService.name)

  constructor(
    private prisma: PrismaService,
    private httpClient: NseHttpClient,
    private errorMapper: NseErrorMapper,
    private credentialsService: NseCredentialsService,
    private mockService: NseMockService,
    private config: ConfigService,
  ) {}

  async placeSwitch(advisorId: string, data: {
    clientId: string
    fromSchemeCode: string
    toSchemeCode: string
    fromSchemeName?: string
    toSchemeName?: string
    amount?: number
    units?: number
    folioNumber?: string
    transactionId?: string
  }) {
    const client = await this.prisma.fAClient.findFirst({
      where: { id: data.clientId, advisorId },
    })
    if (!client) throw new NotFoundException('Client not found')

    const nseUcc = await this.prisma.nseUccRegistration.findUnique({
      where: { clientId: data.clientId },
    })

    const order = await this.prisma.nseOrder.create({
      data: {
        clientId: data.clientId,
        advisorId,
        orderType: 'SWITCH',
        status: 'SUBMITTED',
        schemeCode: data.fromSchemeCode,
        schemeName: data.fromSchemeName,
        switchSchemeCode: data.toSchemeCode,
        switchSchemeName: data.toSchemeName,
        amount: data.amount,
        units: data.units,
        folioNumber: data.folioNumber,
        transactionId: data.transactionId,
        submittedAt: new Date(),
      },
    })

    const isMockMode = this.config.get<boolean>('nmf.mockMode')

    if (isMockMode) {
      const mockResponse = this.mockService.mockSwitchResponse()
      await this.prisma.nseOrder.update({
        where: { id: order.id },
        data: {
          nseOrderId: mockResponse.trxn_order_id,
          nseResponseCode: mockResponse.trxn_status,
          nseResponseMsg: mockResponse.trxn_remark,
        },
      })
      return { success: true, orderId: order.id, ...mockResponse }
    }

    const credentials = await this.credentialsService.getDecryptedCredentials(advisorId)

    const requestBody = {
      client_code: nseUcc?.clientCode || client.pan,
      from_scheme_code: data.fromSchemeCode,
      to_scheme_code: data.toSchemeCode,
      switch_amount: data.amount?.toString(),
      switch_units: data.units?.toString(),
      folio_no: data.folioNumber || '',
      kyc_flag: 'Y',
      euin_number: '',
      euin_declaration: 'Y',
    }

    const response = await this.httpClient.jsonRequest(
      NSE_ENDPOINTS.SWITCH_ORDER,
      requestBody,
      credentials,
      advisorId,
      'ORDER_SWITCH',
    )

    const result = this.errorMapper.parseResponse(response.parsed)

    await this.prisma.nseOrder.update({
      where: { id: order.id },
      data: {
        nseOrderId: result.data?.trxn_order_id || null,
        status: result.success ? 'SUBMITTED' : 'FAILED',
        nseResponseCode: result.status,
        nseResponseMsg: result.message,
      },
    })

    this.errorMapper.throwIfError(result)
    return { ...result, success: true, orderId: order.id }
  }
}
