import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { XMLParser } from 'fast-xml-parser'
import { PrismaService } from '../../prisma/prisma.service'
import { BseHttpClient } from '../core/bse-http.client'
import { BseSoapBuilder } from '../core/bse-soap.builder'
import { BseErrorMapper } from '../core/bse-error.mapper'
import { BseReferenceNumberService } from '../core/bse-reference-number.service'
import { BseCredentialsService } from '../credentials/bse-credentials.service'
import { BseAuthService } from '../auth/bse-auth.service'
import { BseMockService } from '../mocks/bse-mock.service'
import { BSE_ENDPOINTS, BSE_SOAP_ACTIONS } from '../core/bse-config'
import { BseOrderType, BseOrderStatus } from '@prisma/client'
import { PlaceCobDto } from './dto/place-cob.dto'

@Injectable()
export class BseCobService {
  private readonly logger = new Logger(BseCobService.name)
  private readonly xmlParser = new XMLParser()
  private readonly isMockMode: boolean

  constructor(
    private prisma: PrismaService,
    private httpClient: BseHttpClient,
    private soapBuilder: BseSoapBuilder,
    private errorMapper: BseErrorMapper,
    private refNumberService: BseReferenceNumberService,
    private credentialsService: BseCredentialsService,
    private authService: BseAuthService,
    private mockService: BseMockService,
    private config: ConfigService,
  ) {
    this.isMockMode = this.config.get<boolean>('bse.mockMode') === true
  }

  async placeCob(advisorId: string, dto: PlaceCobDto) {
    if (!dto.allUnits && !dto.units) {
      throw new BadRequestException('Either allUnits or units must be specified')
    }

    await this.verifyClientAccess(dto.clientId, advisorId)

    const credentials = await this.credentialsService.getDecryptedCredentials(advisorId)
    const referenceNumber = await this.refNumberService.generate(credentials.memberId)

    // Create order record
    const order = await this.prisma.bseOrder.create({
      data: {
        clientId: dto.clientId,
        advisorId,
        orderType: BseOrderType.COB,
        status: BseOrderStatus.CREATED,
        transCode: 'NEW',
        schemeCode: dto.schemeCode,
        buySell: 'P',
        units: dto.allUnits ? null : dto.units,
        folioNumber: dto.folioNumber,
        referenceNumber,
        bseResponseMsg: dto.remarks || null,
      },
    })

    try {
      if (this.isMockMode) {
        return this.handleMockCobResponse(order.id)
      }

      const token = await this.authService.getOrderEntryToken(advisorId)

      // Build pipe-separated COB params per BSE specification
      const pipeParams = this.soapBuilder.buildPipeParams([
        'NEW',                              // TransCode
        referenceNumber,                    // UniqueRefNo
        '',                                 // OrderId (empty for new)
        credentials.memberId,               // MemberId
        dto.clientId,                       // ClientCode
        dto.schemeCode,                     // SchemeCd
        dto.folioNumber,                    // FolioNo
        dto.allUnits ? 'Y' : 'N',          // AllUnits
        dto.units?.toString() || '',        // Qty
        dto.fromArn || '',                  // FromARN
        dto.remarks || '',                  // Remarks
        '',                                 // SubBrCode
        credentials.euin || '',             // EUIN
        credentials.euin ? 'Y' : 'N',      // EUINVal
        '',                                 // IPAdd
        token,                              // Password
      ])

      const body = `<changeOfBrokerEntryParam xmlns="http://bsestarmf.in/">
        <Param>${pipeParams}</Param>
      </changeOfBrokerEntryParam>`

      const response = await this.httpClient.soapRequest(
        BSE_ENDPOINTS.ORDER_ENTRY,
        BSE_SOAP_ACTIONS.CHANGE_OF_BROKER_ENTRY,
        body,
        advisorId,
        'changeOfBrokerEntry',
      )

      const parsed = this.xmlParser.parse(response.body)
      const result = this.extractResult(parsed)

      if (result.success) {
        await this.prisma.bseOrder.update({
          where: { id: order.id },
          data: {
            status: BseOrderStatus.SUBMITTED,
            bseOrderNumber: result.orderId || null,
          },
        })
      } else {
        await this.prisma.bseOrder.update({
          where: { id: order.id },
          data: {
            status: BseOrderStatus.REJECTED,
            bseResponseMsg: result.message,
          },
        })
      }

      return {
        success: result.success,
        orderId: order.id,
        bseOrderId: result.orderId || null,
        message: result.message,
      }
    } catch (error: any) {
      this.logger.error(`COB placement failed: ${error.message}`, error.stack)

      await this.prisma.bseOrder.update({
        where: { id: order.id },
        data: {
          status: BseOrderStatus.REJECTED,
          bseResponseMsg: error.message,
        },
      })

      return {
        success: false,
        orderId: order.id,
        message: error.message,
      }
    }
  }

  private async handleMockCobResponse(orderId: string) {
    const mockOrderId = `COB${Date.now()}`

    await this.prisma.bseOrder.update({
      where: { id: orderId },
      data: {
        status: BseOrderStatus.SUBMITTED,
        bseOrderNumber: mockOrderId,
      },
    })

    return {
      success: true,
      orderId,
      bseOrderId: mockOrderId,
      message: '[MOCK] Change of Broker request submitted successfully',
    }
  }

  private extractResult(parsed: any): { success: boolean; orderId?: string; message: string } {
    try {
      const body = parsed?.['soap:Envelope']?.['soap:Body'] || parsed?.['s:Envelope']?.['s:Body']
      const response = body?.changeOfBrokerEntryParamResponse?.changeOfBrokerEntryParamResult
      if (!response) return { success: false, message: 'Empty response from BSE' }

      const parts = String(response).split('|')
      const statusCode = parts[0]
      const orderId = parts[1] || undefined
      const message = parts[2] || parts[1] || 'Unknown'

      return {
        success: statusCode === '100',
        orderId: statusCode === '100' ? orderId : undefined,
        message,
      }
    } catch {
      return { success: false, message: 'Failed to parse BSE response' }
    }
  }

  private async verifyClientAccess(clientId: string, advisorId: string) {
    const client = await this.prisma.fAClient.findFirst({
      where: { id: clientId, advisorId },
    })
    if (!client) {
      throw new NotFoundException('Client not found or access denied')
    }
    return client
  }
}
