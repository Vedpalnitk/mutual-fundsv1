import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import * as express from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { StaffPageGuard, RequiredPage } from '../common/guards/staff-page.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { getEffectiveAdvisorId } from '../common/utils/effective-advisor';
import { SavedAnalysisService } from './saved-analysis.service';
import { CreateAnalysisDto } from './dto/create-analysis.dto';
import { CreateVersionDto } from './dto/create-version.dto';

@ApiTags('saved-analysis')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StaffPageGuard)
@RequiredPage('/advisor/deep-analysis')
@Controller('api/v1/advisor/analyses')
export class SavedAnalysisController {
  constructor(private service: SavedAnalysisService) {}

  @Post()
  @ApiOperation({ summary: 'Save a deep analysis (creates parent + v1)' })
  async create(@CurrentUser() user: any, @Body() dto: CreateAnalysisDto) {
    return this.service.create(getEffectiveAdvisorId(user), dto);
  }

  @Get()
  @ApiOperation({ summary: 'List saved analyses' })
  async findAll(
    @CurrentUser() user: any,
    @Query('clientId') clientId?: string,
  ) {
    return this.service.findAll(getEffectiveAdvisorId(user), clientId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get analysis with version list' })
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.findOne(id, getEffectiveAdvisorId(user));
  }

  @Get(':id/versions/:v')
  @ApiOperation({ summary: 'Get specific version data' })
  async getVersion(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Param('v', ParseIntPipe) v: number,
  ) {
    return this.service.getVersion(id, v, getEffectiveAdvisorId(user));
  }

  @Post(':id/versions')
  @ApiOperation({ summary: 'Create new version with edited rebalancing' })
  async createVersion(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: CreateVersionDto,
  ) {
    return this.service.createVersion(id, getEffectiveAdvisorId(user), dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update analysis metadata (title, status)' })
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { title?: string; status?: string },
  ) {
    return this.service.update(id, getEffectiveAdvisorId(user), body as any);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete analysis and all versions' })
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.remove(id, getEffectiveAdvisorId(user));
  }

  @Get(':id/versions/:v/pdf')
  @ApiOperation({ summary: 'Download PDF for a specific version' })
  async downloadPdf(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Param('v', ParseIntPipe) v: number,
    @Res() res: express.Response,
  ) {
    const buffer = await this.service.generatePdf(id, v, getEffectiveAdvisorId(user));
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="analysis-v${v}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
