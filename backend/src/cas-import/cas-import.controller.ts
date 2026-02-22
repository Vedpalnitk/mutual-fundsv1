import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { getEffectiveAdvisorId } from '../common/utils/effective-advisor';
import { CasImportService } from './cas-import.service';
import { CASImportResponseDto } from './dto/import-cas.dto';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface'

@ApiTags('cas-import')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/cas')
export class CasImportController {
  constructor(private casImportService: CasImportService) {}

  @Post('import')
  @ApiOperation({ summary: 'Import a CAS PDF to create holdings and transactions' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, type: CASImportResponseDto })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async importCas(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: { buffer: Buffer; originalname?: string; mimetype?: string; size?: number },
    @Body() body: { password: string; clientId?: string },
  ) {
    const advisorId = getEffectiveAdvisorId(user);
    return this.casImportService.importCas(
      advisorId,
      file,
      body.password,
      body.clientId,
    );
  }

  @Get('imports')
  @ApiOperation({ summary: 'List CAS imports for the logged-in user' })
  @ApiResponse({ status: 200, type: [CASImportResponseDto] })
  async getImports(@CurrentUser() user: AuthenticatedUser) {
    const advisorId = getEffectiveAdvisorId(user);
    return this.casImportService.getImports(advisorId);
  }

  @Get('imports/:clientId')
  @ApiOperation({ summary: 'List CAS imports for a specific FA client' })
  @ApiResponse({ status: 200, type: [CASImportResponseDto] })
  async getClientImports(
    @CurrentUser() user: AuthenticatedUser,
    @Param('clientId') clientId: string,
  ) {
    const advisorId = getEffectiveAdvisorId(user);
    return this.casImportService.getClientImports(advisorId, clientId);
  }
}
