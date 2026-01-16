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
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AllocationsService } from './allocations.service';
import {
  CreateAllocationStrategyDto,
  UpdateAllocationStrategyDto,
  CreateAllocationComponentDto,
  CreateRiskConstraintDto,
  AllocationStrategyResponseDto,
} from './dto/allocation.dto';

@ApiTags('admin/allocations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'super_admin')
@Controller('api/v1/admin/allocations')
export class AllocationsController {
  constructor(private allocationsService: AllocationsService) {}

  @Get()
  @ApiOperation({ summary: 'List all allocation strategies' })
  @ApiQuery({ name: 'personaId', required: false })
  @ApiResponse({ status: 200, type: [AllocationStrategyResponseDto] })
  async findAll(@Query('personaId') personaId?: string) {
    return this.allocationsService.findAll(personaId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get allocation strategy by ID' })
  @ApiResponse({ status: 200, type: AllocationStrategyResponseDto })
  async findOne(@Param('id') id: string) {
    return this.allocationsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new allocation strategy' })
  @ApiResponse({ status: 201, type: AllocationStrategyResponseDto })
  async create(@Body() dto: CreateAllocationStrategyDto) {
    return this.allocationsService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an allocation strategy' })
  @ApiResponse({ status: 200, type: AllocationStrategyResponseDto })
  async update(@Param('id') id: string, @Body() dto: UpdateAllocationStrategyDto) {
    return this.allocationsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an allocation strategy' })
  async delete(@Param('id') id: string) {
    return this.allocationsService.delete(id);
  }

  // Components
  @Get(':id/components')
  @ApiOperation({ summary: 'Get components of an allocation strategy' })
  async getComponents(@Param('id') id: string) {
    const strategy = await this.allocationsService.findOne(id);
    return strategy.components;
  }

  @Post(':id/components')
  @ApiOperation({ summary: 'Add a component to an allocation strategy' })
  async addComponent(
    @Param('id') id: string,
    @Body() dto: CreateAllocationComponentDto,
  ) {
    return this.allocationsService.addComponent(id, dto);
  }

  @Put(':id/components/:componentId')
  @ApiOperation({ summary: 'Update a component' })
  async updateComponent(
    @Param('id') id: string,
    @Param('componentId') componentId: string,
    @Body() dto: Partial<CreateAllocationComponentDto>,
  ) {
    return this.allocationsService.updateComponent(id, componentId, dto);
  }

  @Delete(':id/components/:componentId')
  @ApiOperation({ summary: 'Delete a component' })
  async deleteComponent(
    @Param('id') id: string,
    @Param('componentId') componentId: string,
  ) {
    return this.allocationsService.deleteComponent(id, componentId);
  }

  // Constraints
  @Get(':id/constraints')
  @ApiOperation({ summary: 'Get constraints of an allocation strategy' })
  async getConstraints(@Param('id') id: string) {
    const strategy = await this.allocationsService.findOne(id);
    return strategy.constraints;
  }

  @Post(':id/constraints')
  @ApiOperation({ summary: 'Add a constraint to an allocation strategy' })
  async addConstraint(
    @Param('id') id: string,
    @Body() dto: CreateRiskConstraintDto,
  ) {
    return this.allocationsService.addConstraint(id, dto);
  }

  @Put(':id/constraints/:constraintId')
  @ApiOperation({ summary: 'Update a constraint' })
  async updateConstraint(
    @Param('id') id: string,
    @Param('constraintId') constraintId: string,
    @Body() dto: Partial<CreateRiskConstraintDto>,
  ) {
    return this.allocationsService.updateConstraint(id, constraintId, dto);
  }

  @Delete(':id/constraints/:constraintId')
  @ApiOperation({ summary: 'Delete a constraint' })
  async deleteConstraint(
    @Param('id') id: string,
    @Param('constraintId') constraintId: string,
  ) {
    return this.allocationsService.deleteConstraint(id, constraintId);
  }
}
