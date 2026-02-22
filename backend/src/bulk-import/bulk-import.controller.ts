import {
  Controller, Get, Post, Param, UseGuards, UseInterceptors, UploadedFile, BadRequestException,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { getEffectiveAdvisorId } from '../common/utils/effective-advisor'
import { BulkImportService } from './bulk-import.service'
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface'

const ALLOWED_EXTENSIONS = ['.csv', '.xlsx', '.xls']

@ApiTags('bulk-import')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/bulk-import')
export class BulkImportController {
  constructor(private bulkImportService: BulkImportService) {}

  @Post('cams-wbr')
  @ApiOperation({ summary: 'Upload CAMS WBR file' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  uploadCamsWbr(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded')
    this.validateFileExtension(file.originalname)

    return this.bulkImportService.importCamsWbr(
      getEffectiveAdvisorId(user),
      file,
    )
  }

  @Post('kfintech-mis')
  @ApiOperation({ summary: 'Upload KFintech MIS file' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  uploadKfintechMis(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded')
    this.validateFileExtension(file.originalname)

    return this.bulkImportService.importKfintechMis(
      getEffectiveAdvisorId(user),
      file,
    )
  }

  @Get('history')
  @ApiOperation({ summary: 'List all imports for advisor' })
  getHistory(@CurrentUser() user: AuthenticatedUser) {
    return this.bulkImportService.getHistory(getEffectiveAdvisorId(user))
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get import status' })
  getImportStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.bulkImportService.getImportStatus(id, getEffectiveAdvisorId(user))
  }

  @Get(':id/errors')
  @ApiOperation({ summary: 'Get import error details' })
  getImportErrors(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.bulkImportService.getImportErrors(id, getEffectiveAdvisorId(user))
  }

  private validateFileExtension(filename: string) {
    const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      throw new BadRequestException(`Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`)
    }
  }
}
