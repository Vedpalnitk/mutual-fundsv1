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
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { StaffPageGuard, RequiredPage } from '../common/guards/staff-page.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { getEffectiveAdvisorId } from '../common/utils/effective-advisor';
import { SipsService } from './sips.service';
import { CreateSIPDto, UpdateSIPDto } from './dto/create-sip.dto';
import { SIPResponseDto, PaginatedSIPsResponseDto } from './dto/sip-response.dto';

@ApiTags('sips')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StaffPageGuard)
@RequiredPage('/advisor/transactions')
@Controller('api/v1/sips')
export class SipsController {
  constructor(private sipsService: SipsService) {}

  @Get()
  @ApiOperation({ summary: 'List all SIPs' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'clientId', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, type: PaginatedSIPsResponseDto })
  async findAll(
    @CurrentUser() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('clientId') clientId?: string,
    @Query('search') search?: string,
  ) {
    return this.sipsService.findAll(getEffectiveAdvisorId(user), {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
      clientId,
      search,
    });
  }

  @Get('clients/:clientId')
  @ApiOperation({ summary: 'Get SIPs for a specific client' })
  @ApiResponse({ status: 200, type: [SIPResponseDto] })
  async findByClient(
    @CurrentUser() user: any,
    @Param('clientId') clientId: string,
  ) {
    return this.sipsService.findByClient(clientId, getEffectiveAdvisorId(user));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get SIP details' })
  @ApiResponse({ status: 200, type: SIPResponseDto })
  async findOne(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.sipsService.findOne(id, getEffectiveAdvisorId(user));
  }

  @Post()
  @ApiOperation({ summary: 'Create a new SIP' })
  @ApiResponse({ status: 201, type: SIPResponseDto })
  async create(
    @CurrentUser() user: any,
    @Body() dto: CreateSIPDto,
  ) {
    return this.sipsService.create(getEffectiveAdvisorId(user), dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a SIP' })
  @ApiResponse({ status: 200, type: SIPResponseDto })
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateSIPDto,
  ) {
    return this.sipsService.update(id, getEffectiveAdvisorId(user), dto);
  }

  @Post(':id/pause')
  @ApiOperation({ summary: 'Pause a SIP' })
  @ApiResponse({ status: 200, type: SIPResponseDto })
  async pause(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.sipsService.pause(id, getEffectiveAdvisorId(user));
  }

  @Post(':id/resume')
  @ApiOperation({ summary: 'Resume a paused SIP' })
  @ApiResponse({ status: 200, type: SIPResponseDto })
  async resume(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.sipsService.resume(id, getEffectiveAdvisorId(user));
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a SIP' })
  @ApiResponse({ status: 200 })
  async cancel(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.sipsService.cancel(id, getEffectiveAdvisorId(user));
  }
}
