import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { PersonasService } from './personas.service';
import {
  CreatePersonaDto,
  UpdatePersonaDto,
  CreatePersonaRuleDto,
  CreatePersonaInsightDto,
  PersonaResponseDto,
  BulkCreatePersonaDto,
  BulkCreateResultDto,
  SaveClassificationResultDto,
  ClassificationResultResponseDto,
} from './dto/persona.dto';

@ApiTags('admin/personas')
@Public() // TODO: Remove in production - add proper auth
@Controller('api/v1/admin/personas')
export class PersonasController {
  constructor(private personasService: PersonasService) {}

  // NOTE: Static routes MUST be defined BEFORE dynamic :id routes to avoid conflicts

  @Get()
  @ApiOperation({ summary: 'List all personas' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @ApiResponse({ status: 200, type: [PersonaResponseDto] })
  async findAll(@Query('includeInactive') includeInactive?: string) {
    return this.personasService.findAll(includeInactive === 'true');
  }

  @Get('classifications')
  @ApiOperation({ summary: 'Get all classification results' })
  @ApiQuery({ name: 'personaId', required: false, description: 'Filter by persona ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async getClassificationResults(
    @Query('personaId') personaId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.personasService.getClassificationResults({
      personaId,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
  }

  @Get('classifications/stats')
  @ApiOperation({ summary: 'Get classification statistics by persona' })
  async getClassificationStats() {
    return this.personasService.getClassificationStats();
  }

  @Post()
  @ApiOperation({ summary: 'Create a new persona' })
  @ApiResponse({ status: 201, type: PersonaResponseDto })
  @ApiResponse({ status: 409, description: 'Slug already exists' })
  async create(@Body() dto: CreatePersonaDto) {
    return this.personasService.create(dto);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Create multiple personas at once' })
  @ApiResponse({ status: 201, type: BulkCreateResultDto })
  async bulkCreate(@Body() dto: BulkCreatePersonaDto) {
    return this.personasService.bulkCreate(dto);
  }

  @Post('classify')
  @ApiOperation({ summary: 'Classify a profile and optionally save the result' })
  @ApiResponse({ status: 201, type: ClassificationResultResponseDto })
  async classifyAndSave(@Body() dto: SaveClassificationResultDto) {
    return this.personasService.classifyAndSave(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get persona by ID' })
  @ApiResponse({ status: 200, type: PersonaResponseDto })
  @ApiResponse({ status: 404, description: 'Persona not found' })
  async findOne(@Param('id') id: string) {
    return this.personasService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a persona' })
  @ApiResponse({ status: 200, type: PersonaResponseDto })
  @ApiResponse({ status: 404, description: 'Persona not found' })
  async update(@Param('id') id: string, @Body() dto: UpdatePersonaDto) {
    return this.personasService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a persona (set inactive)' })
  @ApiResponse({ status: 200, type: PersonaResponseDto })
  @ApiResponse({ status: 404, description: 'Persona not found' })
  async delete(@Param('id') id: string) {
    return this.personasService.delete(id);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate a persona with all rules and insights' })
  @ApiResponse({ status: 201, type: PersonaResponseDto })
  @ApiResponse({ status: 404, description: 'Persona not found' })
  async duplicate(@Param('id') id: string) {
    return this.personasService.duplicate(id);
  }

  // Rules endpoints
  @Get(':id/rules')
  @ApiOperation({ summary: 'Get all rules for a persona' })
  async getRules(@Param('id') id: string) {
    const persona = await this.personasService.findOne(id);
    return persona.rules;
  }

  @Post(':id/rules')
  @ApiOperation({ summary: 'Add a classification rule to a persona' })
  async addRule(@Param('id') id: string, @Body() dto: CreatePersonaRuleDto) {
    return this.personasService.addRule(id, dto);
  }

  @Put(':id/rules/:ruleId')
  @ApiOperation({ summary: 'Update a rule' })
  async updateRule(
    @Param('id') id: string,
    @Param('ruleId') ruleId: string,
    @Body() dto: Partial<CreatePersonaRuleDto>,
  ) {
    return this.personasService.updateRule(id, ruleId, dto);
  }

  @Delete(':id/rules/:ruleId')
  @ApiOperation({ summary: 'Delete a rule' })
  async deleteRule(@Param('id') id: string, @Param('ruleId') ruleId: string) {
    return this.personasService.deleteRule(id, ruleId);
  }

  // Insights endpoints
  @Get(':id/insights')
  @ApiOperation({ summary: 'Get all insights for a persona' })
  async getInsights(@Param('id') id: string) {
    const persona = await this.personasService.findOne(id);
    return persona.insights;
  }

  @Post(':id/insights')
  @ApiOperation({ summary: 'Add an insight to a persona' })
  async addInsight(@Param('id') id: string, @Body() dto: CreatePersonaInsightDto) {
    return this.personasService.addInsight(id, dto);
  }

  @Put(':id/insights/:insightId')
  @ApiOperation({ summary: 'Update an insight' })
  async updateInsight(
    @Param('id') id: string,
    @Param('insightId') insightId: string,
    @Body() dto: Partial<CreatePersonaInsightDto>,
  ) {
    return this.personasService.updateInsight(id, insightId, dto);
  }

  @Delete(':id/insights/:insightId')
  @ApiOperation({ summary: 'Delete an insight' })
  async deleteInsight(
    @Param('id') id: string,
    @Param('insightId') insightId: string,
  ) {
    return this.personasService.deleteInsight(id, insightId);
  }
}
