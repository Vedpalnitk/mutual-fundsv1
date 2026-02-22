import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, UseGuards, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { StaffPageGuard, RequiredPage } from '../common/guards/staff-page.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { getEffectiveAdvisorId } from '../common/utils/effective-advisor';
import { CommissionsService } from './commissions.service';
import {
  CreateRateDto, UpdateRateDto, CommissionFilterDto,
  CalculateExpectedDto, ReconcileDto, ReconcileAndComputeDto,
} from './dto';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface'

@ApiTags('commissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StaffPageGuard)
@RequiredPage('/advisor/commissions')
@Controller('api/v1/commissions')
export class CommissionsController {
  constructor(private commissionsService: CommissionsService) {}

  // ============= RATE MASTER =============

  @Get('rates')
  @ApiOperation({ summary: 'List commission rate master' })
  listRates(@CurrentUser() user: AuthenticatedUser) {
    return this.commissionsService.listRates(getEffectiveAdvisorId(user));
  }

  @Post('rates')
  @ApiOperation({ summary: 'Create commission rate entry' })
  createRate(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateRateDto) {
    return this.commissionsService.createRate(
      getEffectiveAdvisorId(user),
      user.id,
      dto,
    );
  }

  @Put('rates/:id')
  @ApiOperation({ summary: 'Update commission rate' })
  updateRate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateRateDto,
  ) {
    return this.commissionsService.updateRate(
      id,
      getEffectiveAdvisorId(user),
      user.id,
      dto,
    );
  }

  @Delete('rates/:id')
  @ApiOperation({ summary: 'Delete commission rate' })
  deleteRate(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.commissionsService.deleteRate(
      id,
      getEffectiveAdvisorId(user),
      user.id,
    );
  }

  // ============= EXPECTED CALCULATION =============

  @Post('calculate-expected')
  @ApiOperation({ summary: 'Calculate expected commissions from AUM x trail rates' })
  calculateExpected(@CurrentUser() user: AuthenticatedUser, @Body() dto: CalculateExpectedDto) {
    return this.commissionsService.calculateExpected(
      getEffectiveAdvisorId(user),
      user.id,
      dto,
    );
  }

  // ============= CSV UPLOAD =============

  @Post('upload')
  @ApiOperation({ summary: 'Upload CAMS/KFintech brokerage CSV' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  uploadBrokerage(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
    @Body('arnNumber') arnNumber?: string,
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }
    return this.commissionsService.uploadBrokerage(
      getEffectiveAdvisorId(user),
      user.id,
      file,
      arnNumber,
    );
  }

  @Get('uploads')
  @ApiOperation({ summary: 'List upload history' })
  listUploads(@CurrentUser() user: AuthenticatedUser) {
    return this.commissionsService.listUploads(getEffectiveAdvisorId(user));
  }

  // ============= LINE ITEMS =============

  @Get('uploads/:uploadId/line-items')
  @ApiOperation({ summary: 'Get line items for an upload' })
  getUploadLineItems(
    @CurrentUser() user: AuthenticatedUser,
    @Param('uploadId') uploadId: string,
    @Query('amcName') amcName?: string,
    @Query('arnNumber') arnNumber?: string,
  ) {
    return this.commissionsService.getUploadLineItems(
      uploadId,
      getEffectiveAdvisorId(user),
      { amcName, arnNumber },
    );
  }

  @Get('records/:id/line-items')
  @ApiOperation({ summary: 'Get scheme-level line items for a commission record' })
  getRecordLineItems(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.commissionsService.getRecordLineItems(
      id,
      getEffectiveAdvisorId(user),
    );
  }

  // ============= RECONCILIATION =============

  @Post('reconcile')
  @ApiOperation({ summary: 'Run reconciliation for a period' })
  reconcile(@CurrentUser() user: AuthenticatedUser, @Body() dto: ReconcileDto) {
    return this.commissionsService.reconcile(
      getEffectiveAdvisorId(user),
      user.id,
      dto,
    );
  }

  @Post('reconcile-and-compute')
  @ApiOperation({ summary: 'Reconcile commissions and compute EUIN payouts' })
  reconcileAndCompute(@CurrentUser() user: AuthenticatedUser, @Body() dto: ReconcileAndComputeDto) {
    return this.commissionsService.reconcileAndCompute(
      getEffectiveAdvisorId(user),
      user.id,
      dto,
    );
  }

  // ============= RECORDS =============

  @Get('records')
  @ApiOperation({ summary: 'List commission records' })
  listRecords(@CurrentUser() user: AuthenticatedUser, @Query() filters: CommissionFilterDto) {
    return this.commissionsService.listRecords(getEffectiveAdvisorId(user), filters);
  }

  @Get('discrepancies')
  @ApiOperation({ summary: 'List discrepancy records' })
  getDiscrepancies(@CurrentUser() user: AuthenticatedUser) {
    return this.commissionsService.getDiscrepancies(getEffectiveAdvisorId(user));
  }

  // ============= ARN SUMMARY =============

  @Get('summary/by-arn')
  @ApiOperation({ summary: 'Commission summary grouped by ARN' })
  getSummaryByArn(@CurrentUser() user: AuthenticatedUser) {
    return this.commissionsService.getSummaryByArn(getEffectiveAdvisorId(user));
  }
}
