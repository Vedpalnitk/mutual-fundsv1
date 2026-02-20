import { Controller, Post, Body, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger'
import { FileInterceptor } from '@nestjs/platform-express'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { BseUploadService } from './bse-upload.service'

@ApiTags('BSE Uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('advisor', 'admin', 'fa_staff')
@Controller('api/v1/bse/uploads')
export class BseUploadsController {
  constructor(private uploadService: BseUploadService) {}

  @Post('aof')
  @ApiOperation({ summary: 'Upload AOF image' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAof(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
    @Body('clientCode') clientCode: string,
  ) {
    return this.uploadService.uploadAof(user.id, clientCode, file.buffer, file.originalname)
  }

  @Post('mandate-scan')
  @ApiOperation({ summary: 'Upload mandate scan' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadMandateScan(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
    @Body('mandateId') mandateId: string,
  ) {
    return this.uploadService.uploadMandateScan(user.id, mandateId, file.buffer)
  }

  @Post('cheque')
  @ApiOperation({ summary: 'Upload cheque image' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCheque(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
    @Body('clientCode') clientCode: string,
  ) {
    return this.uploadService.uploadChequeImage(user.id, clientCode, file.buffer)
  }
}
