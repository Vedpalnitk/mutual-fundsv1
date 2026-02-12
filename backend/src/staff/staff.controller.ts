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
  findAll(@CurrentUser() user: any) {
    this.ensureAdvisor(user);
    return this.staffService.findAll(user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    this.ensureAdvisor(user);
    return this.staffService.findOne(id, user.id);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateStaffDto) {
    this.ensureAdvisor(user);
    return this.staffService.create(user.id, dto);
  }

  @Put(':id')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateStaffDto) {
    this.ensureAdvisor(user);
    return this.staffService.update(id, user.id, dto);
  }

  @Delete(':id')
  deactivate(@CurrentUser() user: any, @Param('id') id: string) {
    this.ensureAdvisor(user);
    return this.staffService.deactivate(id, user.id);
  }
}
