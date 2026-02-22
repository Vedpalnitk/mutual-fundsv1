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
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { getEffectiveAdvisorId } from '../common/utils/effective-advisor'
import { BranchesService } from './branches.service'
import { CreateBranchDto, UpdateBranchDto } from './dto'
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface'

@ApiTags('branches')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/branches')
export class BranchesController {
  constructor(private branchesService: BranchesService) {}

  private ensureAdvisor(user: any) {
    if (user.role !== 'advisor') {
      throw new ForbiddenException('Only advisors can manage branches')
    }
  }

  @Get()
  @ApiOperation({ summary: 'List all branches' })
  findAll(@CurrentUser() user: AuthenticatedUser) {
    this.ensureAdvisor(user)
    return this.branchesService.findAll(user.id)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get branch details' })
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    this.ensureAdvisor(user)
    return this.branchesService.findOne(id, user.id)
  }

  @Post()
  @ApiOperation({ summary: 'Create a new branch' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateBranchDto) {
    this.ensureAdvisor(user)
    return this.branchesService.create(user.id, user.id, dto)
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a branch' })
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateBranchDto) {
    this.ensureAdvisor(user)
    return this.branchesService.update(id, user.id, user.id, dto)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a branch' })
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    this.ensureAdvisor(user)
    return this.branchesService.remove(id, user.id, user.id)
  }
}
