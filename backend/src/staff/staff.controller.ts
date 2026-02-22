import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { StaffService } from './staff.service';
import { CreateStaffDto, UpdateStaffDto } from './dto';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface'

@ApiTags('staff')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/staff')
export class StaffController {
  constructor(private staffService: StaffService) {}

  // Only advisors can manage staff
  private ensureAdvisor(user: any) {
    if (user.role !== 'advisor') {
      throw new ForbiddenException('Only advisors can manage staff');
    }
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    this.ensureAdvisor(user);
    return this.staffService.findAll(user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    this.ensureAdvisor(user);
    return this.staffService.findOne(id, user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateStaffDto) {
    this.ensureAdvisor(user);
    return this.staffService.create(user.id, dto);
  }

  @Put(':id')
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateStaffDto) {
    this.ensureAdvisor(user);
    return this.staffService.update(id, user.id, dto);
  }

  @Delete(':id')
  deactivate(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    this.ensureAdvisor(user);
    return this.staffService.deactivate(id, user.id);
  }

  @Get('euin-expiry')
  getEuinExpiry(@CurrentUser() user: AuthenticatedUser) {
    this.ensureAdvisor(user);
    return this.staffService.getEuinExpiry(user.id);
  }

  @Get(':id/clients')
  getStaffClients(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    this.ensureAdvisor(user);
    return this.staffService.getStaffClients(id, user.id);
  }

  @Post(':id/reassign-clients')
  reassignClients(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: { targetStaffId: string },
  ) {
    this.ensureAdvisor(user);
    return this.staffService.reassignClients(id, user.id, body.targetStaffId, user.id);
  }

  @Get(':id/performance')
  getPerformance(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    this.ensureAdvisor(user);
    return this.staffService.getPerformance(id, user.id);
  }

  @Put(':id/assign-branch')
  assignBranch(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: { branchId: string },
  ) {
    this.ensureAdvisor(user);
    return this.staffService.assignBranch(id, user.id, body.branchId);
  }
}
