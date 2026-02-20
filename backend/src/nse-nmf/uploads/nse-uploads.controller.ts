import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { Roles } from '../../common/decorators/roles.decorator'
import { NseUploadService } from './nse-upload.service'
import { UploadFileDto } from '../dto/nmf.dto'

@ApiTags('NSE NMF Uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('advisor', 'admin', 'fa_staff')
@Controller('api/v1/nmf/uploads')
export class NseUploadsController {
  constructor(private uploadService: NseUploadService) {}

  @Post('aof')
  @ApiOperation({ summary: 'Upload AOF image' })
  async uploadAof(@CurrentUser() user: any, @Body() data: UploadFileDto) {
    return this.uploadService.uploadFile(user.id, 'aof', data)
  }

  @Post('fatca')
  @ApiOperation({ summary: 'Upload FATCA image' })
  async uploadFatca(@CurrentUser() user: any, @Body() data: UploadFileDto) {
    return this.uploadService.uploadFile(user.id, 'fatca', data)
  }

  @Post('mandate')
  @ApiOperation({ summary: 'Upload mandate scan' })
  async uploadMandate(@CurrentUser() user: any, @Body() data: UploadFileDto) {
    return this.uploadService.uploadFile(user.id, 'mandate', data)
  }

  @Post('cancel-cheque')
  @ApiOperation({ summary: 'Upload cancel cheque' })
  async uploadCancelCheque(@CurrentUser() user: any, @Body() data: UploadFileDto) {
    return this.uploadService.uploadFile(user.id, 'cancel-cheque', data)
  }

  @Post(':type')
  @ApiOperation({ summary: 'Upload file by type' })
  async upload(
    @Param('type') type: string,
    @CurrentUser() user: any,
    @Body() data: UploadFileDto,
  ) {
    return this.uploadService.uploadFile(user.id, type, data)
  }
}
