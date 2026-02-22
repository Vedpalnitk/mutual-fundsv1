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
} from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { OrganizationService } from './organization.service'
import { CreateArnDto, UpdateArnDto } from './dto'
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface'

@ApiTags('organization')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/organization')
export class OrganizationController {
  constructor(private organizationService: OrganizationService) {}

  private ensureAdvisor(user: AuthenticatedUser) {
    if (user.role !== 'advisor') {
      throw new ForbiddenException('Only advisors can manage organization')
    }
  }

  @Get('arns')
  listArns(@CurrentUser() user: AuthenticatedUser) {
    this.ensureAdvisor(user)
    return this.organizationService.listArns(user.id)
  }

  @Post('arns')
  addArn(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateArnDto) {
    this.ensureAdvisor(user)
    return this.organizationService.addArn(user.id, dto)
  }

  @Put('arns/:id')
  updateArn(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateArnDto,
  ) {
    this.ensureAdvisor(user)
    return this.organizationService.updateArn(id, user.id, dto)
  }

  @Delete('arns/:id')
  deleteArn(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    this.ensureAdvisor(user)
    return this.organizationService.deleteArn(id, user.id)
  }

  @Get('dashboard')
  getDashboard(@CurrentUser() user: AuthenticatedUser) {
    this.ensureAdvisor(user)
    return this.organizationService.getDashboard(user.id)
  }
}
