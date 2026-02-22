import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException, BadRequestException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { BseOrderService } from './bse-order.service'
import { PrismaService } from '../../prisma/prisma.service'
import { BseHttpClient } from '../core/bse-http.client'
import { BseSoapBuilder } from '../core/bse-soap.builder'
import { BseErrorMapper } from '../core/bse-error.mapper'
import { BseReferenceNumberService } from '../core/bse-reference-number.service'
import { BseCredentialsService } from '../credentials/bse-credentials.service'
import { BseAuthService } from '../auth/bse-auth.service'
import { BseMockService } from '../mocks/bse-mock.service'
import { AuditLogService } from '../../common/services/audit-log.service'
import { BULLMQ_CONNECTION } from '../../common/queue/queue.module'
import { BseBuySell, BseBuySellType } from './dto/place-order.dto'

describe('BseOrderService', () => {
  let service: BseOrderService
  let prisma: PrismaService
  let mockService: BseMockService
  let errorMapper: BseErrorMapper
  let credentialsService: BseCredentialsService
  let refNumberService: BseReferenceNumberService

  const advisorId = 'advisor-1'
  const clientId = 'client-1'

  const mockCredentials = {
    memberId: 'MEMBER001',
    userId: 'bse-user',
    password: 'bse-pass',
    euin: 'E123456',
  }

  const mockOrderRecord = {
    id: 'order-1',
    clientId,
    advisorId,
    orderType: 'PURCHASE',
    status: 'SUBMITTED',
    transCode: 'NEW',
    schemeCode: 'INF-GR-DP',
    buySell: 'P',
    buySellType: 'FRESH',
    amount: 5000,
    units: null,
    dpTxnMode: 'P',
    folioNumber: null,
    referenceNumber: 'REF001',
    bseOrderNumber: 'BSE12345',
    bseResponseCode: '100',
    bseResponseMsg: 'Order placed successfully',
    submittedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BseOrderService,
        {
          provide: PrismaService,
          useValue: {
            bseOrder: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
              count: jest.fn(),
            },
            fAClient: {
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: BseHttpClient,
          useValue: {
            soapRequest: jest.fn(),
          },
        },
        {
          provide: BseSoapBuilder,
          useValue: {
            buildPipeParams: jest.fn().mockReturnValue('pipe|params'),
            buildOrderEntryBody: jest.fn().mockReturnValue('<soap>body</soap>'),
          },
        },
        {
          provide: BseErrorMapper,
          useValue: {
            parsePipeResponse: jest.fn(),
            parseResponse: jest.fn(),
            throwIfError: jest.fn(),
          },
        },
        {
          provide: BseReferenceNumberService,
          useValue: {
            generate: jest.fn().mockResolvedValue('REF001'),
          },
        },
        {
          provide: BseCredentialsService,
          useValue: {
            getDecryptedCredentials: jest.fn().mockResolvedValue(mockCredentials),
          },
        },
        {
          provide: BseAuthService,
          useValue: {
            getOrderEntryToken: jest.fn().mockResolvedValue('mock-token'),
          },
        },
        {
          provide: BseMockService,
          useValue: {
            mockOrderEntryResponse: jest.fn().mockReturnValue('100|Order placed successfully|BSE12345'),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'bse.mockMode') return true
              return undefined
            }),
          },
        },
        {
          provide: AuditLogService,
          useValue: {
            log: jest.fn(),
          },
        },
        {
          provide: BULLMQ_CONNECTION,
          useValue: { /* mock redis connection for Queue */ },
        },
      ],
    }).compile()

    service = module.get<BseOrderService>(BseOrderService)
    prisma = module.get<PrismaService>(PrismaService)
    mockService = module.get<BseMockService>(BseMockService)
    errorMapper = module.get<BseErrorMapper>(BseErrorMapper)
    credentialsService = module.get<BseCredentialsService>(BseCredentialsService)
    refNumberService = module.get<BseReferenceNumberService>(BseReferenceNumberService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  // ---- PLACE PURCHASE ORDER ----

  describe('placePurchase', () => {
    it('should place a purchase order and enqueue it for async processing', async () => {
      // Mock client access check
      ;(prisma.fAClient.findUnique as jest.Mock).mockResolvedValue({ advisorId })

      // Mock order creation
      ;(prisma.bseOrder.create as jest.Mock).mockResolvedValue({
        id: 'order-1',
        referenceNumber: 'REF001',
        bseOrderNumber: null,
      })

      const result = await service.placePurchase(advisorId, {
        clientId,
        schemeCode: 'INF-GR-DP',
        buySell: BseBuySell.PURCHASE,
        amount: 5000,
      })

      expect(result.id).toBe('order-1')
      expect(result.status).toBe('QUEUED')
      expect(result.referenceNumber).toBe('REF001')
      expect(result.message).toBe('Order queued for processing')

      // Verify credentials were fetched (for reference number generation)
      expect(credentialsService.getDecryptedCredentials).toHaveBeenCalledWith(advisorId)
    })

    it('should throw BadRequestException for zero amount', async () => {
      await expect(
        service.placePurchase(advisorId, {
          clientId,
          schemeCode: 'INF-GR-DP',
          buySell: BseBuySell.PURCHASE,
          amount: 0,
        }),
      ).rejects.toThrow(BadRequestException)
    })

    it('should throw BadRequestException for negative amount', async () => {
      await expect(
        service.placePurchase(advisorId, {
          clientId,
          schemeCode: 'INF-GR-DP',
          buySell: BseBuySell.PURCHASE,
          amount: -100,
        }),
      ).rejects.toThrow(BadRequestException)
    })
  })

  // ---- PLACE REDEMPTION ORDER ----

  describe('placeRedemption', () => {
    it('should place a redemption order and enqueue it for async processing', async () => {
      ;(prisma.fAClient.findUnique as jest.Mock).mockResolvedValue({ advisorId })
      ;(prisma.bseOrder.create as jest.Mock).mockResolvedValue({
        id: 'order-2',
        referenceNumber: 'REF002',
        bseOrderNumber: null,
      })

      const result = await service.placeRedemption(advisorId, {
        clientId,
        schemeCode: 'INF-GR-DP',
        buySell: BseBuySell.REDEMPTION,
        units: 50,
      })

      expect(result.id).toBe('order-2')
      expect(result.status).toBe('QUEUED')
      expect(result.message).toBe('Order queued for processing')
    })

    it('should throw BadRequestException when neither amount nor units provided', async () => {
      await expect(
        service.placeRedemption(advisorId, {
          clientId,
          schemeCode: 'INF-GR-DP',
          buySell: BseBuySell.REDEMPTION,
          // no amount, no units
        }),
      ).rejects.toThrow(BadRequestException)
    })
  })

  // ---- CANCEL ORDER ----

  describe('cancelOrder', () => {
    it('should cancel an order in mock mode', async () => {
      ;(prisma.bseOrder.findUnique as jest.Mock).mockResolvedValue({
        ...mockOrderRecord,
        status: 'SUBMITTED',
      })
      ;(credentialsService.getDecryptedCredentials as jest.Mock).mockResolvedValue(mockCredentials)
      ;(errorMapper.parsePipeResponse as jest.Mock).mockReturnValue({
        success: true,
        code: '100',
        message: 'Order cancelled successfully',
        data: [],
      })
      ;(prisma.bseOrder.update as jest.Mock).mockResolvedValue({
        ...mockOrderRecord,
        status: 'CANCELLED',
      })

      const result = await service.cancelOrder('order-1', advisorId)

      expect(result.status).toBe('CANCELLED')
      expect(result.id).toBe('order-1')
      expect(prisma.bseOrder.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: {
          status: 'CANCELLED',
          bseResponseCode: '100',
          bseResponseMsg: 'Order cancelled successfully',
        },
      })
    })

    it('should throw NotFoundException when order not found', async () => {
      ;(prisma.bseOrder.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(service.cancelOrder('nonexistent', advisorId)).rejects.toThrow(NotFoundException)
    })

    it('should throw NotFoundException when order belongs to different advisor', async () => {
      ;(prisma.bseOrder.findUnique as jest.Mock).mockResolvedValue({
        ...mockOrderRecord,
        advisorId: 'other-advisor',
      })

      await expect(service.cancelOrder('order-1', advisorId)).rejects.toThrow(NotFoundException)
    })

    it('should throw BadRequestException for non-cancellable status', async () => {
      ;(prisma.bseOrder.findUnique as jest.Mock).mockResolvedValue({
        ...mockOrderRecord,
        status: 'ALLOTTED',
      })

      await expect(service.cancelOrder('order-1', advisorId)).rejects.toThrow(BadRequestException)
    })
  })

  // ---- GET ORDER ----

  describe('getOrder', () => {
    it('should return order with payment and child orders', async () => {
      const orderWithRelations = {
        ...mockOrderRecord,
        payment: { id: 'pay-1', status: 'COMPLETED' },
        childOrders: [],
      }
      ;(prisma.bseOrder.findUnique as jest.Mock).mockResolvedValue(orderWithRelations)

      const result = await service.getOrder('order-1', advisorId)

      expect(result.id).toBe('order-1')
      expect(result.payment).toBeDefined()
      expect(prisma.bseOrder.findUnique).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        include: {
          payment: true,
          childOrders: { orderBy: { installmentNo: 'asc' } },
        },
      })
    })

    it('should throw NotFoundException when order not found', async () => {
      ;(prisma.bseOrder.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(service.getOrder('nonexistent', advisorId)).rejects.toThrow(NotFoundException)
    })

    it('should throw NotFoundException when order belongs to different advisor', async () => {
      ;(prisma.bseOrder.findUnique as jest.Mock).mockResolvedValue({
        ...mockOrderRecord,
        advisorId: 'other-advisor',
        payment: null,
        childOrders: [],
      })

      await expect(service.getOrder('order-1', advisorId)).rejects.toThrow(NotFoundException)
    })
  })

  // ---- LIST ORDERS ----

  describe('listOrders', () => {
    it('should return paginated orders for advisor', async () => {
      const orders = [mockOrderRecord]
      ;(prisma.bseOrder.findMany as jest.Mock).mockResolvedValue(orders)
      ;(prisma.bseOrder.count as jest.Mock).mockResolvedValue(1)

      const result = await service.listOrders(advisorId, { page: 1, limit: 20 })

      expect(result.data).toHaveLength(1)
      expect(result.pagination.page).toBe(1)
      expect(result.pagination.limit).toBe(20)
      expect(result.pagination.total).toBe(1)
      expect(result.pagination.totalPages).toBe(1)
    })

    it('should apply filters for clientId and status', async () => {
      ;(prisma.bseOrder.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.bseOrder.count as jest.Mock).mockResolvedValue(0)

      await service.listOrders(advisorId, {
        clientId: 'client-1',
        status: 'SUBMITTED' as any,
        page: 1,
        limit: 10,
      })

      const findManyCall = (prisma.bseOrder.findMany as jest.Mock).mock.calls[0][0]
      expect(findManyCall.where.advisorId).toBe(advisorId)
      expect(findManyCall.where.clientId).toBe('client-1')
      expect(findManyCall.where.status).toBe('SUBMITTED')
      expect(findManyCall.take).toBe(10)
    })

    it('should use default pagination when not specified', async () => {
      ;(prisma.bseOrder.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.bseOrder.count as jest.Mock).mockResolvedValue(0)

      const result = await service.listOrders(advisorId, {})

      expect(result.pagination.page).toBe(1)
      expect(result.pagination.limit).toBe(20)

      const findManyCall = (prisma.bseOrder.findMany as jest.Mock).mock.calls[0][0]
      expect(findManyCall.skip).toBe(0)
      expect(findManyCall.take).toBe(20)
    })
  })
})
