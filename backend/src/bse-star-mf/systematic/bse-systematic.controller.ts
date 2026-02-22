import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { BseSipService } from './bse-sip.service'
import { BseXsipService } from './bse-xsip.service'
import { BseStpService } from './bse-stp.service'
import { BseSwpService } from './bse-swp.service'
import { RegisterSipDto, RegisterXsipDto, RegisterStpDto, RegisterSwpDto } from './dto/register-sip.dto'
import { PrismaService } from '../../prisma/prisma.service'
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface'

@ApiTags('BSE Systematic Plans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('advisor', 'admin', 'fa_staff')
@Controller('api/v1/bse/systematic')
export class BseSystematicController {
  constructor(
    private sipService: BseSipService,
    private xsipService: BseXsipService,
    private stpService: BseStpService,
    private swpService: BseSwpService,
    private prisma: PrismaService,
  ) {}

  @Post('sip')
  @ApiOperation({ summary: 'Register SIP' })
  async registerSip(@CurrentUser() user: AuthenticatedUser, @Body() dto: RegisterSipDto) {
    return this.sipService.registerSip(user.id, dto)
  }

  @Post('xsip')
  @ApiOperation({ summary: 'Register XSIP/ISIP' })
  async registerXsip(@CurrentUser() user: AuthenticatedUser, @Body() dto: RegisterXsipDto) {
    return this.xsipService.registerXsip(user.id, dto)
  }

  @Post('stp')
  @ApiOperation({ summary: 'Register STP' })
  async registerStp(@CurrentUser() user: AuthenticatedUser, @Body() dto: RegisterStpDto) {
    return this.stpService.registerStp(user.id, dto)
  }

  @Post('swp')
  @ApiOperation({ summary: 'Register SWP' })
  async registerSwp(@CurrentUser() user: AuthenticatedUser, @Body() dto: RegisterSwpDto) {
    return this.swpService.registerSwp(user.id, dto)
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel any systematic plan' })
  async cancelSystematic(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.swpService.cancelSystematic(user.id, id)
  }

  @Get(':id/child-orders')
  @ApiOperation({ summary: 'Get installment history' })
  async getChildOrders(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    const order = await this.prisma.bseOrder.findUnique({
      where: { id },
      include: { childOrders: { orderBy: { installmentNo: 'asc' } } },
    })

    if (!order || order.advisorId !== user.id) {
      return { data: [] }
    }

    return { data: order.childOrders }
  }
}
