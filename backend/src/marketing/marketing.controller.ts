import { Controller, Get, Post, Body, Res, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import type { Response } from 'express'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { StaffPageGuard, RequiredPage } from '../common/guards/staff-page.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { getEffectiveAdvisorId } from '../common/utils/effective-advisor'
import { MarketingService } from './marketing.service'
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface'

@ApiTags('marketing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StaffPageGuard)
@RequiredPage('/advisor/marketing')
@Controller('api/v1/marketing')
export class MarketingController {
  constructor(private marketingService: MarketingService) {}

  @Get('templates')
  @ApiOperation({ summary: 'List available marketing templates' })
  @ApiResponse({ status: 200, description: 'Template list returned' })
  listTemplates() {
    return this.marketingService.listTemplates()
  }

  @Post('preview')
  @ApiOperation({ summary: 'Render a template preview as HTML' })
  @ApiResponse({ status: 200, description: 'HTML preview returned' })
  async renderPreview(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { templateId: string; customFields?: Record<string, string> },
  ) {
    const html = await this.marketingService.renderPreview(
      body.templateId,
      getEffectiveAdvisorId(user),
      body.customFields,
    )
    return { html }
  }

  @Post('generate-image')
  @ApiOperation({ summary: 'Generate a marketing image (PNG)' })
  @ApiResponse({ status: 200, description: 'PNG image streamed' })
  async generateImage(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { templateId: string; customFields?: Record<string, string>; html?: string },
    @Res() res: Response,
  ) {
    const buffer = await this.marketingService.generateImage(
      body.templateId,
      getEffectiveAdvisorId(user),
      body.customFields,
      body.html,
    )
    res.setHeader('Content-Type', 'image/png')
    res.setHeader('Content-Disposition', `attachment; filename=marketing-${body.templateId}.png`)
    res.send(buffer)
  }
}
