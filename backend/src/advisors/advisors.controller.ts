import {
  Controller,
  Get,
  Post,
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
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AdvisorsService } from './advisors.service';
import { CreateReviewDto, AdvisorFilterDto } from './dto/advisor.dto';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface'

@ApiTags('advisors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/advisors')
export class AdvisorsController {
  constructor(private advisorsService: AdvisorsService) {}

  @Get()
  @ApiOperation({ summary: 'Get list of advisors with filters' })
  @ApiResponse({ status: 200, description: 'List of advisors' })
  @ApiQuery({ name: 'city', required: false })
  @ApiQuery({ name: 'specialization', required: false })
  @ApiQuery({ name: 'minRating', required: false, type: Number })
  @ApiQuery({ name: 'verifiedOnly', required: false, type: Boolean })
  @ApiQuery({ name: 'acceptingNew', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async getAdvisors(
    @Query('city') city?: string,
    @Query('specialization') specialization?: string,
    @Query('minRating') minRating?: string,
    @Query('verifiedOnly') verifiedOnly?: string,
    @Query('acceptingNew') acceptingNew?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const filters: AdvisorFilterDto = {
      city,
      specialization,
      minRating: minRating ? parseInt(minRating, 10) : undefined,
      verifiedOnly: verifiedOnly === 'true',
      acceptingNew: acceptingNew === 'true',
      search,
    };

    return this.advisorsService.getAdvisors(
      filters,
      limit ? parseInt(limit, 10) : 20,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Get('specializations')
  @ApiOperation({ summary: 'Get list of all advisor specializations' })
  @ApiResponse({ status: 200, description: 'List of specializations' })
  async getSpecializations() {
    return this.advisorsService.getSpecializations();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get advisor by ID' })
  @ApiResponse({ status: 200, description: 'Advisor details' })
  async getAdvisor(@Param('id') id: string) {
    return this.advisorsService.getAdvisorById(id);
  }

  @Get(':id/reviews')
  @ApiOperation({ summary: 'Get advisor reviews' })
  @ApiResponse({ status: 200, description: 'List of reviews' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async getReviews(
    @Param('id') id: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.advisorsService.getAdvisorReviews(
      id,
      limit ? parseInt(limit, 10) : 20,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Post(':id/reviews')
  @ApiOperation({ summary: 'Create a review for an advisor' })
  @ApiResponse({ status: 201, description: 'Review created' })
  async createReview(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.advisorsService.createReview(user.id, id, dto);
  }
}
