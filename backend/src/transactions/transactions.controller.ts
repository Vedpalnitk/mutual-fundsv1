import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { StaffPageGuard, RequiredPage } from '../common/guards/staff-page.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { getEffectiveAdvisorId } from '../common/utils/effective-advisor';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto, UpdateTransactionStatusDto, CreateTradeRequestDto } from './dto/create-transaction.dto';
import { TransactionFilterDto } from './dto/transaction-filter.dto';
import {
  TransactionResponseDto,
  PaginatedTransactionsResponseDto,
} from './dto/transaction-response.dto';

@ApiTags('transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StaffPageGuard)
@RequiredPage('/advisor/transactions')
@Controller('api/v1/transactions')
export class TransactionsController {
  constructor(private transactionsService: TransactionsService) {}

  @Get()
  @ApiOperation({ summary: 'List all transactions' })
  @ApiResponse({ status: 200, type: PaginatedTransactionsResponseDto })
  async findAll(
    @CurrentUser() user: any,
    @Query() filters: TransactionFilterDto,
  ) {
    return this.transactionsService.findAll(getEffectiveAdvisorId(user), filters);
  }

  @Get('clients/:clientId')
  @ApiOperation({ summary: 'Get transactions for a specific client' })
  @ApiResponse({ status: 200, type: [TransactionResponseDto] })
  async findByClient(
    @CurrentUser() user: any,
    @Param('clientId') clientId: string,
  ) {
    return this.transactionsService.findByClient(clientId, getEffectiveAdvisorId(user));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction details' })
  @ApiResponse({ status: 200, type: TransactionResponseDto })
  async findOne(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.transactionsService.findOne(id, getEffectiveAdvisorId(user));
  }

  @Post('lumpsum')
  @ApiOperation({ summary: 'Create a lumpsum purchase transaction' })
  @ApiResponse({ status: 201, type: TransactionResponseDto })
  async createLumpsum(
    @CurrentUser() user: any,
    @Body() dto: CreateTransactionDto,
  ) {
    return this.transactionsService.createLumpsum(getEffectiveAdvisorId(user), dto);
  }

  @Post('redemption')
  @ApiOperation({ summary: 'Create a redemption transaction' })
  @ApiResponse({ status: 201, type: TransactionResponseDto })
  async createRedemption(
    @CurrentUser() user: any,
    @Body() dto: CreateTransactionDto,
  ) {
    return this.transactionsService.createRedemption(getEffectiveAdvisorId(user), dto);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update transaction status' })
  @ApiResponse({ status: 200, type: TransactionResponseDto })
  async updateStatus(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateTransactionStatusDto,
  ) {
    return this.transactionsService.updateStatus(id, getEffectiveAdvisorId(user), dto);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a pending transaction' })
  @ApiResponse({ status: 200, type: TransactionResponseDto })
  async cancelTransaction(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.transactionsService.cancelTransaction(id, getEffectiveAdvisorId(user));
  }

  // ============================================
  // Client-facing endpoints (for managed users)
  // ============================================

  @Post('trade-request')
  @ApiOperation({ summary: 'Submit a trade request to advisor (for managed clients)' })
  @ApiResponse({ status: 201, description: 'Trade request submitted successfully' })
  async createTradeRequest(
    @CurrentUser() user: any,
    @Body() dto: CreateTradeRequestDto,
  ) {
    return this.transactionsService.createTradeRequest(user.id, dto);
  }

  @Get('my-requests')
  @ApiOperation({ summary: 'Get my trade requests (for managed clients)' })
  @ApiResponse({ status: 200, type: [TransactionResponseDto] })
  async getMyTradeRequests(@CurrentUser() user: any) {
    return this.transactionsService.getMyTradeRequests(user.id);
  }
}
