import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../notifications/channels/email.service';
import { getTemplate, getTemplateList, COMMUNICATION_TEMPLATES } from './communications.templates';
import { PreviewCommunicationDto, SendCommunicationDto, CommunicationHistoryFilterDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CommunicationsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  getTemplates() {
    return getTemplateList();
  }

  async preview(advisorId: string, dto: PreviewCommunicationDto) {
    // Get client data
    const client = await this.prisma.fAClient.findFirst({
      where: { id: dto.clientId, advisorId },
    });
    if (!client) throw new NotFoundException('Client not found');

    // Get advisor profile
    const advisor = await this.prisma.user.findUnique({
      where: { id: advisorId },
      include: { profile: true },
    });

    const template = getTemplate(dto.type);
    if (!template) throw new BadRequestException('Invalid template type');

    // Build context from client data and optional context data
    const ctx: any = {
      advisorName: advisor?.profile?.name || advisor?.email,
      clientName: client.name,
      ...dto.contextData,
    };

    // If custom, use custom subject/body
    if (dto.type === 'CUSTOM') {
      ctx.customSubject = dto.customSubject || '';
      ctx.customBody = dto.customBody || '';
    }

    // Auto-hydrate portfolio data if template needs it
    if (dto.type === 'PORTFOLIO_SUMMARY' && !dto.contextData?.totalValue) {
      const holdings = await this.prisma.fAHolding.findMany({ where: { clientId: dto.clientId } });
      const totalInvested = holdings.reduce((s, h) => s + Number(h.investedValue), 0);
      const totalValue = holdings.reduce((s, h) => s + Number(h.currentValue), 0);
      ctx.totalValue = totalValue;
      ctx.totalInvested = totalInvested;
      ctx.totalReturns = totalValue - totalInvested;
      ctx.returnsPercent = totalInvested > 0 ? ((totalValue - totalInvested) / totalInvested) * 100 : 0;
      ctx.holdingsCount = holdings.length;
    }

    return {
      emailSubject: template.emailSubject(ctx),
      emailBody: template.emailBody(ctx),
      whatsappBody: template.whatsappBody(ctx),
    };
  }

  async send(advisorId: string, dto: SendCommunicationDto) {
    // Verify client belongs to advisor
    const client = await this.prisma.fAClient.findFirst({
      where: { id: dto.clientId, advisorId },
    });
    if (!client) throw new NotFoundException('Client not found');

    if (dto.channel === 'EMAIL') {
      // Send via email service
      const result = await this.emailService.send(client.email, dto.subject, dto.body);

      // Log communication
      const log = await this.prisma.fACommunicationLog.create({
        data: {
          advisorId,
          clientId: dto.clientId,
          channel: 'EMAIL',
          type: dto.type as any,
          subject: dto.subject,
          body: dto.body,
          status: result.success ? 'SENT' : 'FAILED',
          externalId: result.messageId || null,
          error: result.error || null,
          metadata: dto.metadata || undefined,
          sentAt: result.success ? new Date() : null,
        },
      });

      return { success: result.success, logId: log.id, error: result.error };
    } else if (dto.channel === 'WHATSAPP') {
      // Generate wa.me link
      const phone = client.phone?.replace(/[^0-9]/g, '') || '';
      if (!phone) throw new BadRequestException('Client has no phone number');

      // Ensure phone has country code (India default)
      const fullPhone = phone.startsWith('91') ? phone : `91${phone}`;
      const encodedText = encodeURIComponent(dto.body);
      const waLink = `https://wa.me/${fullPhone}?text=${encodedText}`;

      // Log communication
      const log = await this.prisma.fACommunicationLog.create({
        data: {
          advisorId,
          clientId: dto.clientId,
          channel: 'WHATSAPP',
          type: dto.type as any,
          subject: dto.subject,
          body: dto.body,
          status: 'SENT',
          metadata: dto.metadata || undefined,
          sentAt: new Date(),
        },
      });

      return { success: true, logId: log.id, waLink };
    }

    throw new BadRequestException('Invalid channel');
  }

  async getHistory(advisorId: string, filters: CommunicationHistoryFilterDto) {
    const { page = 1, limit = 20, clientId, channel, type, dateFrom, dateTo } = filters;

    const where: Prisma.FACommunicationLogWhereInput = { advisorId };
    if (clientId) where.clientId = clientId;
    if (channel) where.channel = channel as any;
    if (type) where.type = type as any;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const total = await this.prisma.fACommunicationLog.count({ where });
    const logs = await this.prisma.fACommunicationLog.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, email: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getStats(advisorId: string) {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalSent, emailCount, whatsappCount, thisMonthCount] = await Promise.all([
      this.prisma.fACommunicationLog.count({ where: { advisorId } }),
      this.prisma.fACommunicationLog.count({ where: { advisorId, channel: 'EMAIL' } }),
      this.prisma.fACommunicationLog.count({ where: { advisorId, channel: 'WHATSAPP' } }),
      this.prisma.fACommunicationLog.count({ where: { advisorId, createdAt: { gte: thisMonthStart } } }),
    ]);

    return { totalSent, emailCount, whatsappCount, thisMonthCount };
  }
}
