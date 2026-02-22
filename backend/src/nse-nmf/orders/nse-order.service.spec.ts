import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NseOrderService } from './nse-order.service'
import { PrismaService } from '../../prisma/prisma.service'
import { NseHttpClient } from '../core/nse-http.client'
import { NseErrorMapper } from '../core/nse-error.mapper'
import { NseCredentialsService } from '../credentials/nse-credentials.service'
import { NseMockService } from '../mocks/nse-mock.service'
import { PanCryptoService } from '../../common/services/pan-crypto.service'
import { AuditLogService } from '../../common/services/audit-log.service'

describe('NseOrderService', () => {
  let service: NseOrderService
  let prisma: PrismaService
  let nseMockService: NseMockService
  let errorMapper: NseErrorMapper
  let credentialsService: NseCredentialsService

  const advisorId = 'advisor-1'
  const clientId = 'client-1'

  const mockClient = {
    id: clientId,
    advisorId,
    name: 'Test Client',
    pan: 'ABCDE1234F',
  }

  const mockNseUcc = {
    clientId,
    clientCode: 'NSE_CLIENT_001',
  }

  const mockOrderRecord = {
    id: 'nse-order-1',
    clientId,
    advisorId,
    orderType: 'PURCHASE',
    status: 'SUBMITTED',
    schemeCode: 'INF-GR-DP',
    schemeName: 'Test Growth Direct Plan',
    amount: 5000,
    units: null,
    folioNumber: null,
    dematPhysical: 'P',
    mandateId: null,
    transactionId: null,
    nseOrderId: 'NSE12345',
    nseResponseCode: 'TRXN SUCCESS',
    nseResponseMsg: 'Order placed successfully',
    submittedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    client: { id: clientId, name: 'Test Client', pan: 'ABCDE1234F' },
  }

  const mockMockOrderResponse = {
    trxn_status: 'TRXN SUCCESS',
    trxn_remark: 'Order placed successfully',
    trxn_order_id: 'NSE12345',
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NseOrderService,
        {
          provide: PrismaService,
          useValue: {
            nseOrder: {
              create: jest.fn(),
              findFirst: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
              count: jest.fn(),
            },
            fAClient: {
              findFirst: jest.fn(),
            },
            nseUccRegistration: {
              findUnique: jest.fn(),
            },
            nseSchemeMaster: {
              findMany: jest.fn(),
              count: jest.fn(),
            },
          },
        },
        {
          provide: NseHttpClient,
          useValue: {
            jsonRequest: jest.fn(),
          },
        },
        {
          provide: NseErrorMapper,
          useValue: {
            parseResponse: jest.fn(),
            throwIfError: jest.fn(),
          },
        },
        {
          provide: NseCredentialsService,
          useValue: {
            getDecryptedCredentials: jest.fn().mockResolvedValue({
              memberId: 'NSE_MEMBER',
              userId: 'nse-user',
              password: 'nse-pass',
            }),
          },
        },
        {
          provide: NseMockService,
          useValue: {
            mockOrderResponse: jest.fn().mockReturnValue(mockMockOrderResponse),
            mockCancellationResponse: jest.fn().mockReturnValue({
              can_status: 'CAN_SUCCESS',
              can_remark: 'ORDER cancelled successfully',
            }),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'nmf.mockMode') return true
              return undefined
            }),
          },
        },
        {
          provide: PanCryptoService,
          useValue: {
            mask: jest.fn((pan: string) => pan ? pan.substring(0, 3) + '****' + pan.substring(7) : ''),
          },
        },
        {
          provide: AuditLogService,
          useValue: {
            log: jest.fn(),
          },
        },
      ],
    }).compile()

    service = module.get<NseOrderService>(NseOrderService)
    prisma = module.get<PrismaService>(PrismaService)
    nseMockService = module.get<NseMockService>(NseMockService)
    errorMapper = module.get<NseErrorMapper>(NseErrorMapper)
    credentialsService = module.get<NseCredentialsService>(NseCredentialsService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  // ---- PLACE PURCHASE ORDER ----

  describe('placePurchase', () => {
    it('should place a purchase order in mock mode and return success', async () => {
      ;(prisma.fAClient.findFirst as jest.Mock).mockResolvedValue(mockClient)
      ;(prisma.nseUccRegistration.findUnique as jest.Mock).mockResolvedValue(mockNseUcc)
      ;(prisma.nseOrder.create as jest.Mock).mockResolvedValue({
        id: 'nse-order-1',
        status: 'SUBMITTED',
      })
      ;(prisma.nseOrder.update as jest.Mock).mockResolvedValue({
        id: 'nse-order-1',
        nseOrderId: 'NSE12345',
      })

      const result = await service.placePurchase(advisorId, {
        clientId,
        schemeCode: 'INF-GR-DP',
        amount: 5000,
      })

      expect(result.success).toBe(true)
      expect(result.orderId).toBe('nse-order-1')
      expect((result as any).trxn_order_id).toBe('NSE12345')

      // Verify order was created in DB
      expect(prisma.nseOrder.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          clientId,
          advisorId,
          orderType: 'PURCHASE',
          status: 'SUBMITTED',
          schemeCode: 'INF-GR-DP',
          amount: 5000,
        }),
      })
    })

    it('should throw NotFoundException when client not found', async () => {
      ;(prisma.fAClient.findFirst as jest.Mock).mockResolvedValue(null)

      await expect(
        service.placePurchase(advisorId, {
          clientId: 'nonexistent',
          schemeCode: 'INF-GR-DP',
          amount: 5000,
        }),
      ).rejects.toThrow(NotFoundException)
    })

    it('should throw NotFoundException when client belongs to different advisor', async () => {
      ;(prisma.fAClient.findFirst as jest.Mock).mockResolvedValue(null) // findFirst with where{id, advisorId} returns null

      await expect(
        service.placePurchase(advisorId, {
          clientId,
          schemeCode: 'INF-GR-DP',
          amount: 5000,
        }),
      ).rejects.toThrow(NotFoundException)
    })
  })

  // ---- PLACE REDEMPTION ORDER ----

  describe('placeRedemption', () => {
    it('should place a redemption order in mock mode', async () => {
      ;(prisma.fAClient.findFirst as jest.Mock).mockResolvedValue(mockClient)
      ;(prisma.nseUccRegistration.findUnique as jest.Mock).mockResolvedValue(mockNseUcc)
      ;(prisma.nseOrder.create as jest.Mock).mockResolvedValue({
        id: 'nse-order-2',
        status: 'SUBMITTED',
      })
      ;(prisma.nseOrder.update as jest.Mock).mockResolvedValue({
        id: 'nse-order-2',
        nseOrderId: 'NSE12346',
      })

      const result = await service.placeRedemption(advisorId, {
        clientId,
        schemeCode: 'INF-GR-DP',
        units: 50,
      })

      expect(result.success).toBe(true)
      expect(result.orderId).toBe('nse-order-2')
    })

    it('should accept amount-based redemption', async () => {
      ;(prisma.fAClient.findFirst as jest.Mock).mockResolvedValue(mockClient)
      ;(prisma.nseUccRegistration.findUnique as jest.Mock).mockResolvedValue(mockNseUcc)
      ;(prisma.nseOrder.create as jest.Mock).mockResolvedValue({
        id: 'nse-order-3',
        status: 'SUBMITTED',
      })
      ;(prisma.nseOrder.update as jest.Mock).mockResolvedValue({
        id: 'nse-order-3',
        nseOrderId: 'NSE12347',
      })

      const result = await service.placeRedemption(advisorId, {
        clientId,
        schemeCode: 'INF-GR-DP',
        amount: 3000,
      })

      expect(result.success).toBe(true)
    })
  })

  // ---- CANCEL ORDER ----

  describe('cancelOrder', () => {
    it('should cancel an order in mock mode', async () => {
      ;(prisma.nseOrder.findFirst as jest.Mock).mockResolvedValue({
        ...mockOrderRecord,
        nseOrderId: 'NSE12345',
      })
      ;(prisma.nseOrder.update as jest.Mock).mockResolvedValue({
        ...mockOrderRecord,
        status: 'CANCELLED',
      })

      const result = await service.cancelOrder('nse-order-1', advisorId)

      expect(result.success).toBe(true)
      expect(prisma.nseOrder.update).toHaveBeenCalledWith({
        where: { id: 'nse-order-1' },
        data: { status: 'CANCELLED' },
      })
    })

    it('should throw NotFoundException when order not found', async () => {
      ;(prisma.nseOrder.findFirst as jest.Mock).mockResolvedValue(null)

      await expect(service.cancelOrder('nonexistent', advisorId)).rejects.toThrow(NotFoundException)
    })
  })

  // ---- GET ORDER ----

  describe('getOrder', () => {
    it('should return order with masked PAN and relations', async () => {
      const orderWithRelations = {
        ...mockOrderRecord,
        payment: { id: 'pay-1', status: 'COMPLETED' },
        childOrders: [],
      }
      ;(prisma.nseOrder.findFirst as jest.Mock).mockResolvedValue(orderWithRelations)

      const result = await service.getOrder('nse-order-1', advisorId)

      expect(result.id).toBe('nse-order-1')
      expect((result as any).client.pan).toBe('ABC****34F') // Masked PAN
      expect(prisma.nseOrder.findFirst).toHaveBeenCalledWith({
        where: { id: 'nse-order-1', advisorId },
        include: {
          client: { select: { id: true, name: true, pan: true } },
          payment: true,
          childOrders: { orderBy: { installmentNo: 'asc' } },
        },
      })
    })

    it('should throw NotFoundException when order not found', async () => {
      ;(prisma.nseOrder.findFirst as jest.Mock).mockResolvedValue(null)

      await expect(service.getOrder('nonexistent', advisorId)).rejects.toThrow(NotFoundException)
    })
  })

  // ---- LIST ORDERS ----

  describe('listOrders', () => {
    it('should return paginated orders with masked PAN', async () => {
      const orders = [mockOrderRecord]
      ;(prisma.nseOrder.findMany as jest.Mock).mockResolvedValue(orders)
      ;(prisma.nseOrder.count as jest.Mock).mockResolvedValue(1)

      const result = await service.listOrders(advisorId, { page: 1, limit: 50 })

      expect(result.orders).toHaveLength(1)
      expect(result.total).toBe(1)
      expect(result.page).toBe(1)
      expect(result.limit).toBe(50)
      // PAN should be masked
      expect((result.orders[0] as any).client.pan).toBe('ABC****34F')
    })

    it('should apply clientId and status filters', async () => {
      ;(prisma.nseOrder.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.nseOrder.count as jest.Mock).mockResolvedValue(0)

      await service.listOrders(advisorId, {
        clientId: 'client-1',
        status: 'SUBMITTED',
        page: 2,
        limit: 10,
      })

      const findManyCall = (prisma.nseOrder.findMany as jest.Mock).mock.calls[0][0]
      expect(findManyCall.where.advisorId).toBe(advisorId)
      expect(findManyCall.where.clientId).toBe('client-1')
      expect(findManyCall.where.status).toBe('SUBMITTED')
      expect(findManyCall.skip).toBe(10) // (page 2 - 1) * limit 10
      expect(findManyCall.take).toBe(10)
    })

    it('should use default pagination when params not specified', async () => {
      ;(prisma.nseOrder.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.nseOrder.count as jest.Mock).mockResolvedValue(0)

      const result = await service.listOrders(advisorId)

      expect(result.page).toBe(1)
      expect(result.limit).toBe(50)
    })
  })
})
