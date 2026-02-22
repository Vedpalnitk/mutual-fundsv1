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
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { StaffPageGuard, RequiredPage } from '../common/guards/staff-page.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { getEffectiveAdvisorId } from '../common/utils/effective-advisor';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ClientFilterDto } from './dto/client-filter.dto';
import {
  ClientResponseDto,
  ClientWithPortfolioDto,
  PaginatedClientsResponseDto,
} from './dto/client-response.dto';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';

@ApiTags('clients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StaffPageGuard)
@RequiredPage('/advisor/clients')
@Controller('api/v1/clients')
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  @Get()
  @ApiOperation({ summary: 'List all clients for the advisor' })
  @ApiResponse({ status: 200, type: PaginatedClientsResponseDto })
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() filters: ClientFilterDto,
  ) {
    return this.clientsService.findAll(getEffectiveAdvisorId(user), filters);
  }

  @Get('dormant')
  @ApiOperation({ summary: 'Get dormant clients (no txn in 12+ months)' })
  async getDormantClients(@CurrentUser() user: AuthenticatedUser) {
    return this.clientsService.getDormantClients(getEffectiveAdvisorId(user));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get client details with portfolio summary' })
  @ApiResponse({ status: 200, type: ClientWithPortfolioDto })
  async findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.clientsService.findOne(id, getEffectiveAdvisorId(user));
  }

  @Post()
  @ApiOperation({ summary: 'Create a new client' })
  @ApiResponse({ status: 201, type: ClientResponseDto })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateClientDto,
  ) {
    return this.clientsService.create(getEffectiveAdvisorId(user), dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a client' })
  @ApiResponse({ status: 200, type: ClientResponseDto })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
  ) {
    return this.clientsService.update(id, getEffectiveAdvisorId(user), dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate a client' })
  @ApiResponse({ status: 200 })
  async deactivate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.clientsService.deactivate(id, getEffectiveAdvisorId(user));
  }

  @Put(':id/assign-rm')
  @ApiOperation({ summary: 'Assign/reassign RM to client' })
  async assignRm(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: { assignedRmId: string | null },
  ) {
    return this.clientsService.assignRm(id, getEffectiveAdvisorId(user), body.assignedRmId);
  }

  @Put(':id/tags')
  @ApiOperation({ summary: 'Update client tags' })
  async updateTags(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: { tags: string[] },
  ) {
    return this.clientsService.updateTags(id, getEffectiveAdvisorId(user), body.tags);
  }
}
