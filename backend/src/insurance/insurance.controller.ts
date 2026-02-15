import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
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
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { StaffPageGuard, RequiredPage } from '../common/guards/staff-page.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { getEffectiveAdvisorId } from '../common/utils/effective-advisor';
import { InsuranceService } from './insurance.service';
import { CreateInsurancePolicyDto } from './dto/create-insurance-policy.dto';
import { UpdateInsurancePolicyDto } from './dto/update-insurance-policy.dto';
import { RecordPremiumPaymentDto } from './dto/record-premium-payment.dto';

@ApiTags('insurance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StaffPageGuard)
@RequiredPage('/advisor/clients')
@Controller('api/v1/clients/:clientId/insurance')
export class InsuranceController {
  constructor(private insuranceService: InsuranceService) {}

  @Get()
  @ApiOperation({ summary: 'List all insurance policies for a client' })
  @ApiResponse({ status: 200, description: 'List of insurance policies' })
  async findAll(
    @CurrentUser() user: any,
    @Param('clientId') clientId: string,
  ) {
    return this.insuranceService.findAll(clientId, getEffectiveAdvisorId(user));
  }

  @Post()
  @ApiOperation({ summary: 'Add an insurance policy for a client' })
  @ApiResponse({ status: 201, description: 'Policy created' })
  async create(
    @CurrentUser() user: any,
    @Param('clientId') clientId: string,
    @Body() dto: CreateInsurancePolicyDto,
  ) {
    return this.insuranceService.create(clientId, getEffectiveAdvisorId(user), dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an insurance policy' })
  @ApiResponse({ status: 200, description: 'Policy updated' })
  async update(
    @CurrentUser() user: any,
    @Param('clientId') clientId: string,
    @Param('id') id: string,
    @Body() dto: UpdateInsurancePolicyDto,
  ) {
    return this.insuranceService.update(clientId, id, getEffectiveAdvisorId(user), dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an insurance policy' })
  @ApiResponse({ status: 200, description: 'Policy deleted' })
  async remove(
    @CurrentUser() user: any,
    @Param('clientId') clientId: string,
    @Param('id') id: string,
  ) {
    return this.insuranceService.remove(clientId, id, getEffectiveAdvisorId(user));
  }

  @Get('gap-analysis')
  @ApiOperation({ summary: 'Get insurance gap analysis for a client' })
  @ApiResponse({ status: 200, description: 'Gap analysis result' })
  @ApiQuery({ name: 'annualIncome', required: false, type: Number })
  @ApiQuery({ name: 'age', required: false, type: Number })
  @ApiQuery({ name: 'familySize', required: false, type: Number })
  async gapAnalysis(
    @CurrentUser() user: any,
    @Param('clientId') clientId: string,
    @Query('annualIncome') annualIncome?: string,
    @Query('age') age?: string,
    @Query('familySize') familySize?: string,
  ) {
    return this.insuranceService.gapAnalysis(
      clientId,
      getEffectiveAdvisorId(user),
      annualIncome ? Number(annualIncome) : undefined,
      age ? Number(age) : undefined,
      familySize ? Number(familySize) : undefined,
    );
  }

  @Get('upcoming-premiums')
  @ApiOperation({ summary: 'Get policies with upcoming premium due dates' })
  @ApiResponse({ status: 200, description: 'List of policies with upcoming premiums' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  async upcomingPremiums(
    @CurrentUser() user: any,
    @Param('clientId') clientId: string,
    @Query('days') days?: string,
  ) {
    return this.insuranceService.getUpcomingPremiums(
      clientId,
      getEffectiveAdvisorId(user),
      days ? Number(days) : 30,
    );
  }

  @Post(':policyId/payments')
  @ApiOperation({ summary: 'Record a premium payment for a policy' })
  @ApiResponse({ status: 201, description: 'Payment recorded' })
  async recordPayment(
    @CurrentUser() user: any,
    @Param('clientId') clientId: string,
    @Param('policyId') policyId: string,
    @Body() dto: RecordPremiumPaymentDto,
  ) {
    return this.insuranceService.recordPayment(
      clientId,
      policyId,
      getEffectiveAdvisorId(user),
      dto,
    );
  }

  @Get(':policyId/payments')
  @ApiOperation({ summary: 'Get payment history for a policy' })
  @ApiResponse({ status: 200, description: 'List of premium payments' })
  async getPaymentHistory(
    @CurrentUser() user: any,
    @Param('clientId') clientId: string,
    @Param('policyId') policyId: string,
  ) {
    return this.insuranceService.getPaymentHistory(
      clientId,
      policyId,
      getEffectiveAdvisorId(user),
    );
  }
}
