import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { LoginDto, RegisterDto, AuthResponseDto, UpdateProfileDto, ChangePasswordDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private storageService: StorageService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash: hashedPassword,
        role: 'admin', // First user is admin
        profile: {
          create: {
            name: dto.name,
          },
        },
      },
    });

    const token = this.generateToken(user.id, user.email, user.role);

    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // If staff, look up FAStaffMember for ownerId and allowedPages
    let staffExtra: { ownerId?: string; allowedPages?: string[] } | undefined;
    if (user.role === 'fa_staff') {
      const staffProfile = await this.prisma.fAStaffMember.findUnique({
        where: { staffUserId: user.id },
      });
      if (!staffProfile || !staffProfile.isActive) {
        throw new UnauthorizedException('Staff account is deactivated');
      }
      staffExtra = {
        ownerId: staffProfile.ownerId,
        allowedPages: staffProfile.allowedPages,
      };
    }

    const token = this.generateToken(user.id, user.email, user.role, staffExtra);

    const response: any = {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };

    if (staffExtra) {
      response.user.ownerId = staffExtra.ownerId;
      response.user.allowedPages = staffExtra.allowedPages;
    }

    return response;
  }

  private generateToken(
    userId: string,
    email: string,
    role: string,
    extra?: { ownerId?: string; allowedPages?: string[] },
  ): string {
    const payload: any = { sub: userId, email, role };
    if (extra?.ownerId) payload.ownerId = extra.ownerId;
    if (extra?.allowedPages) payload.allowedPages = extra.allowedPages;
    return this.jwtService.sign(payload);
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user is linked to an FAClient (managed client)
    const client = await this.prisma.fAClient.findFirst({
      where: { userId: userId },
      include: {
        advisor: {
          include: { profile: true },
        },
      },
    });

    // If user is an advisor, include advisor profile data
    let advisorProfileData: any = undefined;
    if (user.role === 'advisor') {
      const ap = await this.prisma.advisorProfile.findUnique({
        where: { userId },
        select: {
          displayName: true,
          companyName: true,
          companyLogoUrl: true,
          avatarUrl: true,
        },
      });
      if (ap) {
        advisorProfileData = {
          displayName: ap.displayName,
          companyName: ap.companyName,
          companyLogoUrl: ap.companyLogoUrl,
          avatarUrl: ap.avatarUrl,
        };
      }
    }

    // Build profile response
    const profile: any = {
      id: user.id,
      name: user.profile?.name || client?.name || user.email,
      email: user.email,
      phone: user.phone || client?.phone,
      role: user.role,
      isVerified: user.isVerified,
      advisorProfile: advisorProfileData,
    };

    // If staff, add staff-specific info
    if (user.role === 'fa_staff') {
      const staffProfile = await this.prisma.fAStaffMember.findUnique({
        where: { staffUserId: user.id },
        include: { owner: { include: { profile: true } } },
      });
      if (staffProfile) {
        profile.isStaff = true;
        profile.ownerId = staffProfile.ownerId;
        profile.ownerName = staffProfile.owner?.profile?.name || staffProfile.owner?.email;
        profile.allowedPages = staffProfile.allowedPages;
      }
    }

    // Check if this is a self-assisted client (advisor is Self-Service Platform)
    const isSelfAssisted = client?.advisor?.email === 'self-service@sparrow-invest.com';

    // If user is a managed client (has FAClient but NOT self-assisted), add client details
    if (client && !isSelfAssisted) {
      profile.clientType = 'managed';
      profile.clientId = client.id;
      profile.kycStatus = client.kycStatus?.toLowerCase() || 'pending';
      profile.riskProfile = client.riskProfile?.toLowerCase() || null;
      profile.city = client.city;
      profile.state = client.state;

      // Get advisor info (only for managed clients)
      if (client.advisor) {
        profile.advisor = {
          id: client.advisor.id,
          name: client.advisor.profile?.name || 'Your Advisor',
          email: client.advisor.email,
        };
      }

      // Get family info
      if (client.familyGroupId) {
        const familyMembers = await this.prisma.fAClient.findMany({
          where: { familyGroupId: client.familyGroupId },
          select: {
            id: true,
            name: true,
            familyRole: true,
            riskProfile: true,
          },
        });

        profile.family = {
          groupId: client.familyGroupId,
          role: client.familyRole,
          isHead: client.familyHeadId === client.id,
          members: familyMembers.map((m) => ({
            id: m.id,
            name: m.name,
            role: m.familyRole,
            riskProfile: m.riskProfile?.toLowerCase(),
          })),
        };
      }
    } else {
      // Self-assisted users or users without FAClient
      profile.clientType = 'self';
      profile.kycStatus = client?.kycStatus?.toLowerCase() || 'pending';
      profile.riskProfile = client?.riskProfile?.toLowerCase() || null;
      if (client) {
        profile.city = client.city;
        profile.state = client.state;
      }
    }

    return profile;
  }

  async getClientPortfolio(userId: string) {
    // Find the client linked to this user
    const client = await this.prisma.fAClient.findFirst({
      where: { userId: userId },
      include: {
        advisor: true,
      },
    });

    if (!client) {
      // Return empty portfolio for non-client users
      return {
        clientType: 'self',
        portfolio: {
          totalValue: 0,
          totalInvested: 0,
          totalReturns: 0,
          returnsPercentage: 0,
          holdings: [],
        },
        family: null,
      };
    }

    // Check if this is a self-assisted client (advisor is Self-Service Platform)
    const isSelfAssisted = client.advisor?.email === 'self-service@sparrow-invest.com';

    // Get client's holdings
    const holdings = await this.prisma.fAHolding.findMany({
      where: { clientId: client.id },
    });

    // Calculate portfolio totals (convert Decimal to number)
    const totalInvested = holdings.reduce((sum, h) => sum + Number(h.investedValue), 0);
    const totalValue = holdings.reduce((sum, h) => sum + Number(h.currentValue), 0);
    const totalReturns = totalValue - totalInvested;
    const returnsPercentage = totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0;

    // Get SIPs
    const sips = await this.prisma.fASIP.findMany({
      where: { clientId: client.id, status: 'ACTIVE' },
    });

    // Build client portfolio
    const portfolio: any = {
      totalValue,
      totalInvested,
      totalReturns,
      returnsPercentage,
      holdingsCount: holdings.length,
      activeSIPs: sips.length,
      holdings: holdings.map((h) => ({
        id: h.id,
        fundName: h.fundName,
        fundCategory: h.fundCategory,
        assetClass: h.assetClass,
        units: h.units,
        avgNav: h.avgNav,
        currentNav: h.currentNav,
        investedValue: h.investedValue,
        currentValue: h.currentValue,
        gain: h.absoluteGain,
        gainPercent: h.absoluteGainPct,
        xirr: h.xirr,
      })),
      sips: sips.map((s) => ({
        id: s.id,
        fundName: s.fundName,
        fundSchemeCode: s.fundSchemeCode,
        amount: Number(s.amount),
        frequency: s.frequency,
        sipDate: s.sipDate,
        nextSipDate: s.nextSipDate,
        status: s.status,
        totalInvested: Number(s.totalInvested),
        currentValue: Number(s.currentValue),
        returns: Number(s.returns),
        completedInstallments: s.completedInstallments,
      })),
    };

    // Get advisor info (only for managed clients, NOT self-assisted)
    let advisor: { id: string; name: string; email: string } | null = null;
    if (client.advisorId && !isSelfAssisted) {
      const advisorUser = await this.prisma.user.findUnique({
        where: { id: client.advisorId },
        include: { profile: true },
      });
      if (advisorUser) {
        advisor = {
          id: advisorUser.id,
          name: advisorUser.profile?.name || 'Your Advisor',
          email: advisorUser.email,
        };
      }
    }

    // Get family data if client is part of a family (only for managed clients)
    let family: any = null;
    if (client.familyGroupId && !isSelfAssisted) {
      const familyMembers = await this.prisma.fAClient.findMany({
        where: { familyGroupId: client.familyGroupId },
      });

      // Get holdings for each family member
      const memberPortfolios = await Promise.all(
        familyMembers.map(async (member) => {
          const memberHoldings = await this.prisma.fAHolding.findMany({
            where: { clientId: member.id },
          });
          const memberSips = await this.prisma.fASIP.findMany({
            where: { clientId: member.id, status: 'ACTIVE' },
          });

          const invested = memberHoldings.reduce((s, h) => s + Number(h.investedValue), 0);
          const current = memberHoldings.reduce((s, h) => s + Number(h.currentValue), 0);
          const returns = current - invested;

          return {
            id: member.id,
            name: member.name,
            role: member.familyRole,
            riskProfile: member.riskProfile?.toLowerCase(),
            isCurrentUser: member.userId === userId,
            portfolio: {
              totalValue: current,
              totalInvested: invested,
              totalReturns: returns,
              returnsPercentage: invested > 0 ? (returns / invested) * 100 : 0,
              holdingsCount: memberHoldings.length,
              activeSIPs: memberSips.length,
              holdings: memberHoldings.map((h) => ({
                id: h.id,
                fundName: h.fundName,
                fundCategory: h.fundCategory,
                assetClass: h.assetClass,
                units: h.units,
                avgNav: h.avgNav,
                currentNav: h.currentNav,
                investedValue: h.investedValue,
                currentValue: h.currentValue,
                gain: h.absoluteGain,
                gainPercent: h.absoluteGainPct,
                xirr: h.xirr,
              })),
            },
          };
        }),
      );

      // Calculate family totals
      const familyTotalValue = memberPortfolios.reduce((s, m) => s + m.portfolio.totalValue, 0);
      const familyTotalInvested = memberPortfolios.reduce((s, m) => s + m.portfolio.totalInvested, 0);
      const familyTotalReturns = familyTotalValue - familyTotalInvested;

      family = {
        groupId: client.familyGroupId,
        currentMemberRole: client.familyRole,
        isHead: client.familyHeadId === client.id,
        totalValue: familyTotalValue,
        totalInvested: familyTotalInvested,
        totalReturns: familyTotalReturns,
        returnsPercentage: familyTotalInvested > 0 ? (familyTotalReturns / familyTotalInvested) * 100 : 0,
        members: memberPortfolios,
      };
    }

    return {
      clientType: isSelfAssisted ? 'self' : 'managed',
      clientId: client.id,
      advisor,
      portfolio,
      family,
    };
  }

  async getPortfolioHistory(userId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get the user's portfolio history
    const history = await this.prisma.userPortfolioHistory.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    // If no history, check if user has an FAClient and get client history
    if (history.length === 0) {
      const client = await this.prisma.fAClient.findFirst({
        where: { userId },
      });

      if (client) {
        const clientHistory = await this.prisma.userPortfolioHistory.findMany({
          where: {
            clientId: client.id,
            date: {
              gte: startDate,
            },
          },
          orderBy: {
            date: 'asc',
          },
        });

        return {
          period: days,
          data: clientHistory.map((h) => ({
            date: h.date.toISOString().split('T')[0],
            totalValue: Number(h.totalValue),
            totalInvested: Number(h.totalInvested),
            dayChange: h.dayChange ? Number(h.dayChange) : null,
            dayChangePct: h.dayChangePct ? Number(h.dayChangePct) : null,
          })),
        };
      }
    }

    return {
      period: days,
      data: history.map((h) => ({
        date: h.date.toISOString().split('T')[0],
        totalValue: Number(h.totalValue),
        totalInvested: Number(h.totalInvested),
        dayChange: h.dayChange ? Number(h.dayChange) : null,
        dayChangePct: h.dayChangePct ? Number(h.dayChangePct) : null,
      })),
    };
  }

  async getUserDividends(userId: string, limit: number = 20) {
    // Get dividends for the user
    const dividends = await this.prisma.dividendRecord.findMany({
      where: { userId },
      orderBy: { paymentDate: 'desc' },
      take: limit,
    });

    // If no dividends found for user, check if they have an FAClient
    if (dividends.length === 0) {
      const client = await this.prisma.fAClient.findFirst({
        where: { userId },
      });

      if (client) {
        const clientDividends = await this.prisma.dividendRecord.findMany({
          where: { clientId: client.id },
          orderBy: { paymentDate: 'desc' },
          take: limit,
        });

        return clientDividends.map((d) => ({
          id: d.id,
          fundName: d.fundName,
          fundSchemeCode: d.fundSchemeCode,
          amount: Number(d.amount),
          dividendType: d.dividendType,
          recordDate: d.recordDate.toISOString().split('T')[0],
          paymentDate: d.paymentDate.toISOString().split('T')[0],
          nav: d.nav ? Number(d.nav) : null,
          units: d.units ? Number(d.units) : null,
        }));
      }
    }

    return dividends.map((d) => ({
      id: d.id,
      fundName: d.fundName,
      fundSchemeCode: d.fundSchemeCode,
      amount: Number(d.amount),
      dividendType: d.dividendType,
      recordDate: d.recordDate.toISOString().split('T')[0],
      paymentDate: d.paymentDate.toISOString().split('T')[0],
      nav: d.nav ? Number(d.nav) : null,
      units: d.units ? Number(d.units) : null,
    }));
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update user fields
    const userData: any = {};
    if (dto.phone !== undefined) userData.phone = dto.phone;

    // Update profile name
    const profileData: any = {};
    if (dto.name !== undefined) profileData.name = dto.name;

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...userData,
        profile: Object.keys(profileData).length > 0
          ? { update: profileData }
          : undefined,
      },
    });

    // If advisor, upsert advisor-specific fields (creates AdvisorProfile if missing)
    if (user.role === 'advisor') {
      const advisorData: any = {};
      if (dto.companyName !== undefined) advisorData.companyName = dto.companyName;
      if (dto.displayName !== undefined) advisorData.displayName = dto.displayName;

      if (Object.keys(advisorData).length > 0) {
        await this.prisma.advisorProfile.upsert({
          where: { userId },
          update: advisorData,
          create: {
            userId,
            displayName: dto.displayName || user.profile?.name || 'Advisor',
            experienceYears: 0,
            ...advisorData,
          },
        });
      }
    }

    // Return updated profile
    return this.getProfile(userId);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash and save new password
    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });

    return { message: 'Password changed successfully' };
  }

  async uploadAdvisorLogo(
    userId: string,
    file: { buffer: Buffer; originalname?: string; mimetype?: string; size?: number },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role !== 'advisor') throw new BadRequestException('Only advisors can upload a company logo');

    this.storageService.validateFile(file);

    const ext = file.originalname?.split('.').pop() || 'png';
    const fileKey = `advisors/${userId}/logo.${ext}`;
    await this.storageService.uploadAdvisorAsset(fileKey, file.buffer, file.mimetype || 'image/png');

    const logoUrl = await this.storageService.getAdvisorAssetUrl(fileKey);

    const userProfile = await this.prisma.userProfile.findUnique({ where: { userId } });
    await this.prisma.advisorProfile.upsert({
      where: { userId },
      update: { companyLogoUrl: logoUrl },
      create: { userId, displayName: userProfile?.name || 'Advisor', experienceYears: 0, companyLogoUrl: logoUrl },
    });

    return { companyLogoUrl: logoUrl };
  }
}
