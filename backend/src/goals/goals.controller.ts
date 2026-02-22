import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { GoalsService } from './goals.service';
import { CreateGoalDto, UpdateGoalDto, AddContributionDto } from './dto/goal.dto';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface'

@UseGuards(JwtAuthGuard)
@Controller('api/v1/me/goals')
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Get()
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.goalsService.findAllByUser(user.id);
  }

  @Get(':id')
  async findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.goalsService.findOne(user.id, id);
  }

  @Post()
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateGoalDto) {
    return this.goalsService.create(user.id, dto);
  }

  @Put(':id')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateGoalDto,
  ) {
    return this.goalsService.update(user.id, id, dto);
  }

  @Delete(':id')
  async delete(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    await this.goalsService.delete(user.id, id);
    return { message: 'Goal deleted successfully' };
  }

  @Post(':id/contributions')
  async addContribution(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: AddContributionDto,
  ) {
    return this.goalsService.addContribution(user.id, id, dto);
  }

  @Get(':id/contributions')
  async getContributions(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.goalsService.getContributions(user.id, id);
  }
}
