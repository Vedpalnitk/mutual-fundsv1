import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { MlModelsService } from './ml-models.service';
import {
  CreateMlModelDto,
  UpdateMlModelDto,
  CreateModelVersionDto,
  PromoteVersionDto,
  CreatePersonaMappingDto,
  MlModelResponseDto,
} from './dto/ml-model.dto';

@ApiTags('admin/models')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'super_admin')
@Controller('api/v1/admin/models')
export class MlModelsController {
  constructor(private mlModelsService: MlModelsService) {}

  @Get()
  @ApiOperation({ summary: 'List all ML models' })
  @ApiResponse({ status: 200, type: [MlModelResponseDto] })
  async findAll() {
    return this.mlModelsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ML model by ID' })
  @ApiResponse({ status: 200, type: MlModelResponseDto })
  async findOne(@Param('id') id: string) {
    return this.mlModelsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Register a new ML model' })
  @ApiResponse({ status: 201, type: MlModelResponseDto })
  async create(@Body() dto: CreateMlModelDto) {
    return this.mlModelsService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update ML model metadata' })
  @ApiResponse({ status: 200, type: MlModelResponseDto })
  async update(@Param('id') id: string, @Body() dto: UpdateMlModelDto) {
    return this.mlModelsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete ML model and all versions' })
  async delete(@Param('id') id: string) {
    return this.mlModelsService.delete(id);
  }

  // Versions
  @Get(':id/versions')
  @ApiOperation({ summary: 'List all versions of a model' })
  async getVersions(@Param('id') id: string) {
    const model = await this.mlModelsService.findOne(id);
    return model.versions;
  }

  @Post(':id/versions')
  @ApiOperation({ summary: 'Upload a new model version' })
  async createVersion(
    @Param('id') id: string,
    @Body() dto: CreateModelVersionDto,
  ) {
    return this.mlModelsService.createVersion(id, dto);
  }

  @Get(':id/versions/:versionId')
  @ApiOperation({ summary: 'Get specific version details' })
  async getVersion(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
  ) {
    return this.mlModelsService.getVersion(id, versionId);
  }

  @Patch(':id/versions/:versionId/promote')
  @ApiOperation({ summary: 'Promote version to production' })
  async promoteVersion(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
    @Body() dto: PromoteVersionDto,
  ) {
    return this.mlModelsService.promoteVersion(id, versionId, dto.demoteCurrent);
  }

  @Patch(':id/versions/:versionId/rollback')
  @ApiOperation({ summary: 'Rollback from production to previous version' })
  async rollbackVersion(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
  ) {
    return this.mlModelsService.rollbackVersion(id, versionId);
  }

  @Delete(':id/versions/:versionId')
  @ApiOperation({ summary: 'Delete a model version' })
  async deleteVersion(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
  ) {
    return this.mlModelsService.deleteVersion(id, versionId);
  }

  // Persona Mappings
  @Get(':id/persona-mappings')
  @ApiOperation({ summary: 'Get persona mappings for a model' })
  async getPersonaMappings(@Param('id') id: string) {
    return this.mlModelsService.getPersonaMappings(id);
  }

  @Post(':id/persona-mappings')
  @ApiOperation({ summary: 'Map model to a persona' })
  async createPersonaMapping(
    @Param('id') id: string,
    @Body() dto: CreatePersonaMappingDto,
  ) {
    return this.mlModelsService.createPersonaMapping(id, dto);
  }

  @Put(':id/persona-mappings/:mappingId')
  @ApiOperation({ summary: 'Update persona mapping' })
  async updatePersonaMapping(
    @Param('id') id: string,
    @Param('mappingId') mappingId: string,
    @Body() dto: Partial<CreatePersonaMappingDto>,
  ) {
    return this.mlModelsService.updatePersonaMapping(id, mappingId, dto);
  }

  @Delete(':id/persona-mappings/:mappingId')
  @ApiOperation({ summary: 'Delete persona mapping' })
  async deletePersonaMapping(
    @Param('id') id: string,
    @Param('mappingId') mappingId: string,
  ) {
    return this.mlModelsService.deletePersonaMapping(id, mappingId);
  }
}
