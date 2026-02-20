import { Injectable, Logger } from '@nestjs/common'

@Injectable()
export class NseMockService {
  private readonly logger = new Logger(NseMockService.name)

  mockUccRegistrationResponse(clientCode: string) {
    this.logger.log(`[MOCK] UCC Registration for ${clientCode}`)
    return {
      status: 'REG_SUCCESS',
      remark: 'Client registration successful',
      client_code: clientCode,
    }
  }

  mockFatcaUploadResponse() {
    return {
      status: 'REG_SUCCESS',
      remark: 'FATCA uploaded successfully',
    }
  }

  mockEkycResponse(clientCode: string) {
    return {
      status: 'REG_SUCCESS',
      remark: 'eKYC initiated',
      ekyc_link: `https://mock-ekyc.example.com/verify?client=${clientCode}`,
    }
  }

  mockMandateRegistrationResponse() {
    const mandateId = `NMF${Date.now()}`
    this.logger.log(`[MOCK] Mandate registration: ${mandateId}`)
    return {
      status: 'REG_SUCCESS',
      remark: 'Mandate registered successfully',
      mandate_id: mandateId,
    }
  }

  mockMandateStatusResponse(mandateId: string) {
    return {
      status: 'SUCCESS',
      mandate_id: mandateId,
      mandate_status: 'APPROVED',
      umrn: `UMRN${Date.now()}`,
    }
  }

  mockOrderResponse(transCode: string) {
    const orderId = `${Date.now()}`
    this.logger.log(`[MOCK] Order entry: ${transCode}, order #${orderId}`)
    return {
      trxn_status: 'TRXN SUCCESS',
      trxn_remark: 'Order placed successfully',
      trxn_order_id: orderId,
    }
  }

  mockSwitchResponse() {
    return {
      trxn_status: 'TRXN SUCCESS',
      trxn_remark: 'Switch order placed successfully',
      trxn_order_id: `${Date.now()}`,
    }
  }

  mockPaymentResponse(orderId: string) {
    return {
      status: 'SUCCESS',
      remark: 'Payment initiated',
      transaction_ref: `PAY${Date.now()}`,
    }
  }

  mockUpiStatusResponse() {
    return {
      status: 'SUCCESS',
      upi_status: 'COMPLETED',
      remark: 'UPI payment successful',
    }
  }

  mockSipRegistrationResponse() {
    const regId = `SIP${Date.now()}`
    return {
      reg_status: 'REG_SUCCESS',
      reg_remark: 'SIP registered successfully',
      reg_id: regId,
    }
  }

  mockXsipRegistrationResponse() {
    const regId = `XSIP${Date.now()}`
    return {
      reg_status: 'REG_SUCCESS',
      reg_remark: 'XSIP registered successfully',
      reg_id: regId,
    }
  }

  mockStpRegistrationResponse() {
    return {
      reg_status: 'REG_SUCCESS',
      reg_remark: 'STP registered successfully',
      reg_id: `STP${Date.now()}`,
    }
  }

  mockSwpRegistrationResponse() {
    return {
      reg_status: 'REG_SUCCESS',
      reg_remark: 'SWP registered successfully',
      reg_id: `SWP${Date.now()}`,
    }
  }

  mockPauseResumeResponse(action: 'PAUSE' | 'RESUME') {
    return {
      status: 'SUCCESS',
      remark: `SIP ${action.toLowerCase()}d successfully`,
    }
  }

  mockCancellationResponse(type: string) {
    return {
      can_status: 'CAN_SUCCESS',
      can_remark: `${type} cancelled successfully`,
    }
  }

  mockOrderStatusReport() {
    return {
      status: 'SUCCESS',
      orders: [
        {
          order_id: '123456',
          status: 'ALLOTMENT_DONE',
          allotted_units: '100.5000',
          allotted_nav: '45.2300',
          allotted_amount: '4545.62',
        },
      ],
    }
  }

  mockAllotmentStatementResponse() {
    return {
      status: 'SUCCESS',
      allotments: [],
    }
  }

  mockSchemeMasterData() {
    return [
      {
        scheme_code: 'INF-GR-DP',
        scheme_name: 'Test Growth Direct Plan',
        isin: 'INF000000001',
        amc_code: 'TEST',
        purchase_allowed: 'Y',
        redemption_allowed: 'Y',
        sip_allowed: 'Y',
        min_purchase_amt: '5000',
        min_sip_amt: '500',
      },
    ]
  }

  mockKycCheckResponse(pan: string) {
    return {
      status: 'SUCCESS',
      kyc_status: 'VERIFIED',
      pan: pan.substring(0, 3) + '***' + pan.substring(8),
    }
  }

  mockShortUrlResponse() {
    return {
      status: 'SUCCESS',
      short_url: `https://mock-short.example.com/${Date.now()}`,
    }
  }
}
