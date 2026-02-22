import { Controller, Get, Post, Query, Param, ParseIntPipe, BadRequestException, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { FundSyncService } from './fund-sync.service';
import { AmfiHistoricalService } from './amfi-historical.service';
import { MetricsCalculatorService } from './metrics-calculator.service';
import { PrismaService } from '../prisma/prisma.service';

// Shared response type (same shape as old FundWithMetrics for frontend compatibility)
interface FundResponse {
  schemeCode: number | null;
  schemeName: string;
  fundHouse: string;
  category: string;
  schemeType: string | null;
  assetClass: string;
  currentNav: number | null;
  dayChange: number | null;
  dayChangePercent: number | null;
  navDate: Date | null;
  return1Y: number | null;
  return3Y: number | null;
  return5Y: number | null;
  riskRating: number | null;
  volatility: number | null;
  sharpeRatio: number | null;
  sortinoRatio: number | null;
  alpha: number | null;
  beta: number | null;
  maxDrawdown: number | null;
  isin: string;
  expenseRatio: number | null;
  aum: number | null;
  fundManager: string | null;
  fundRating: number | null;
  crisilRating: string | null;
  benchmark: string | null;
  exitLoad: string | null;
}

@ApiTags('Funds')
@Controller('api/v1/funds/live')
export class FundsController {
  constructor(
    private readonly fundSyncService: FundSyncService,
    private readonly amfiHistoricalService: AmfiHistoricalService,
    private readonly metricsCalculator: MetricsCalculatorService,
    private readonly prisma: PrismaService,
  ) {}

  // ============= DB-Backed Endpoints (same URLs, same response shape) =============

  @Public()
  @Get('search')
  @ApiOperation({ summary: 'Search mutual funds by name (DB query)' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query (min 2 characters)' })
  @ApiQuery({ name: 'direct_only', required: false, type: Boolean, description: 'Filter for Direct plans only' })
  @ApiQuery({ name: 'growth_only', required: false, type: Boolean, description: 'Filter for Growth plans only' })
  async searchFunds(
    @Query('q') query: string,
    @Query('direct_only') directOnly?: string,
    @Query('growth_only') growthOnly?: string,
  ) {
    if (!query || query.length < 2) return [];

    const where: any = {
      name: { contains: query, mode: 'insensitive' },
    };

    if (directOnly === 'true') {
      where.plan = 'direct';
    }
    if (growthOnly === 'true') {
      where.option = 'growth';
    }

    const plans = await this.prisma.schemePlan.findMany({
      where,
      select: {
        mfapiSchemeCode: true,
        name: true,
      },
      take: 50,
      orderBy: { name: 'asc' },
    });

    return plans.map(p => ({
      schemeCode: p.mfapiSchemeCode,
      schemeName: p.name,
    }));
  }

  @Public()
  @Get('popular')
  @ApiOperation({ summary: 'Get popular mutual funds with metrics (DB query)' })
  async getPopularFunds(): Promise<FundResponse[]> {
    const plans = await this.prisma.schemePlan.findMany({
      where: {
        plan: 'direct',
        option: 'growth',
        status: 'active',
      },
      include: {
        scheme: {
          include: {
            provider: true,
            category: { include: { parent: true } },
          },
        },
        nav: true,
        metrics: true,
      },
      take: 50,
      orderBy: [
        { metrics: { return1y: 'desc' } },
      ],
    });

    return plans.map(p => this.mapToFundResponse(p));
  }

  @Public()
  @Get('category/:category')
  @ApiOperation({ summary: 'Get funds by category (DB query)' })
  @ApiParam({
    name: 'category',
    description: 'Fund category: large_cap, mid_cap, small_cap, flexi_cap, elss, hybrid, debt, liquid, index, sectoral, international, gold'
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Max results (default 20)' })
  async getFundsByCategory(
    @Param('category') category: string,
    @Query('limit') limit?: string,
  ): Promise<FundResponse[]> {
    // Map URL category slug to ONDC L3 category ID
    const categoryMap: Record<string, string[]> = {
      'large_cap': ['L3-LARGE_CAP'],
      'large_mid_cap': ['L3-LARGE_MID_CAP'],
      'mid_cap': ['L3-MID_CAP'],
      'small_cap': ['L3-SMALL_CAP'],
      'flexi_cap': ['L3-FLEXI_CAP'],
      'multi_cap': ['L3-MULTI_CAP'],
      'elss': ['L3-ELSS'],
      'focused': ['L3-FOCUSED'],
      'value': ['L3-VALUE', 'L3-CONTRA'],
      'hybrid': ['L3-AGGRESSIVE_HYBRID', 'L3-CONSERVATIVE_HYBRID', 'L3-DYNAMIC_ALLOCATION', 'L3-MULTI_ASSET', 'L3-ARBITRAGE', 'L3-EQUITY_SAVINGS'],
      'balanced_advantage': ['L3-DYNAMIC_ALLOCATION'],
      'arbitrage': ['L3-ARBITRAGE'],
      'debt': ['L3-SHORT_DURATION', 'L3-MEDIUM_DURATION', 'L3-LONG_DURATION', 'L3-DYNAMIC_BOND', 'L3-CORPORATE_BOND', 'L3-CREDIT_RISK', 'L3-BANKING_PSU', 'L3-GILT', 'L3-GILT_10Y', 'L3-FLOATER', 'L3-ULTRA_SHORT', 'L3-LOW_DURATION', 'L3-MEDIUM_LONG_DURATION'],
      'corporate_bond': ['L3-CORPORATE_BOND'],
      'banking_psu': ['L3-BANKING_PSU'],
      'gilt': ['L3-GILT', 'L3-GILT_10Y'],
      'liquid': ['L3-LIQUID', 'L3-MONEY_MARKET', 'L3-OVERNIGHT'],
      'overnight': ['L3-OVERNIGHT'],
      'money_market': ['L3-MONEY_MARKET'],
      'index': ['L3-INDEX'],
      'sectoral': ['L3-SECTORAL'],
      'banking': ['L3-SECTORAL'],
      'pharma': ['L3-SECTORAL'],
      'infrastructure': ['L3-SECTORAL'],
      'international': ['L3-FOF_OVERSEAS', 'L3-FOF_DOMESTIC'],
      'gold': ['L3-GOLD'],
      'retirement': ['L3-RETIREMENT'],
      'children': ['L3-CHILDRENS'],
    };

    const categoryIds = categoryMap[category.toLowerCase()];
    if (!categoryIds) {
      throw new BadRequestException(`Unknown category: ${category}`);
    }

    const plans = await this.prisma.schemePlan.findMany({
      where: {
        plan: 'direct',
        option: 'growth',
        scheme: {
          categoryId: { in: categoryIds },
        },
      },
      include: {
        scheme: {
          include: {
            provider: true,
            category: { include: { parent: true } },
          },
        },
        nav: true,
        metrics: true,
      },
      take: limit ? parseInt(limit) : 20,
      orderBy: { name: 'asc' },
    });

    return plans.map(p => this.mapToFundResponse(p));
  }

  @Public()
  @Get('batch/details')
  @ApiOperation({ summary: 'Get multiple funds by scheme codes (DB query)' })
  @ApiQuery({ name: 'codes', required: true, description: 'Comma-separated scheme codes' })
  async getBatchDetails(
    @Query('codes') codes: string,
  ): Promise<FundResponse[]> {
    const schemeCodes = codes.split(',').map(c => parseInt(c.trim())).filter(c => !isNaN(c));

    if (schemeCodes.length === 0) return [];
    if (schemeCodes.length > 20) {
      throw new BadRequestException('Maximum 20 funds per request');
    }

    const plans = await this.prisma.schemePlan.findMany({
      where: {
        mfapiSchemeCode: { in: schemeCodes },
      },
      include: {
        scheme: {
          include: {
            provider: true,
            category: { include: { parent: true } },
          },
        },
        nav: true,
        metrics: true,
      },
    });

    return plans.map(p => this.mapToFundResponse(p));
  }

  @Public()
  @Get('search-category/:category')
  @ApiOperation({ summary: 'Search funds by category name (DB query)' })
  @ApiParam({ name: 'category', description: 'Fund category name (e.g., "Large Cap", "Mid Cap")' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Max results (default 10)' })
  async searchByCategory(
    @Param('category') category: string,
    @Query('limit') limit?: string,
  ) {
    const plans = await this.prisma.schemePlan.findMany({
      where: {
        plan: 'direct',
        option: 'growth',
        scheme: {
          category: {
            name: { contains: category, mode: 'insensitive' },
          },
        },
      },
      select: {
        mfapiSchemeCode: true,
        name: true,
      },
      take: limit ? parseInt(limit) : 10,
      orderBy: { name: 'asc' },
    });

    return plans.map(p => ({
      schemeCode: p.mfapiSchemeCode,
      schemeName: p.name,
    }));
  }

  @Public()
  @Get(':schemeCode')
  @ApiOperation({ summary: 'Get fund details with metrics (DB query)' })
  @ApiParam({ name: 'schemeCode', description: 'AMFI Scheme Code' })
  async getFundDetails(
    @Param('schemeCode', ParseIntPipe) schemeCode: number,
  ): Promise<FundResponse> {
    const plan = await this.prisma.schemePlan.findFirst({
      where: { mfapiSchemeCode: schemeCode },
      include: {
        scheme: {
          include: {
            provider: true,
            category: { include: { parent: true } },
          },
        },
        nav: true,
        metrics: true,
      },
    });

    if (!plan) {
      throw new NotFoundException(`Fund with scheme code ${schemeCode} not found`);
    }

    return this.mapToFundResponse(plan);
  }

  @Public()
  @Get(':schemeCode/nav-history')
  @ApiOperation({ summary: 'Get NAV history for a fund' })
  @ApiParam({ name: 'schemeCode', description: 'AMFI Scheme Code' })
  async getFundNavHistory(@Param('schemeCode', ParseIntPipe) schemeCode: number) {
    const plan = await this.prisma.schemePlan.findFirst({
      where: { mfapiSchemeCode: schemeCode },
      include: {
        navHistory: { orderBy: { navDate: 'asc' }, take: 1250 },
      },
    });
    if (!plan) throw new NotFoundException(`Fund ${schemeCode} not found`);
    return plan.navHistory.map(h => ({ date: h.navDate, nav: Number(h.nav) }));
  }

  // ============= Sync Endpoints =============

  @Public()
  @Post('sync/amfi')
  @ApiOperation({ summary: 'Trigger manual AMFI sync' })
  async syncFromAmfi() {
    return this.fundSyncService.syncFromAmfi();
  }

  @Public()
  @Post('sync/backfill')
  @ApiOperation({ summary: 'Trigger 90-day NAV backfill from AMFI' })
  async backfillHistory() {
    return this.amfiHistoricalService.backfillRecent(90);
  }

  @Public()
  @Post('sync/recalculate')
  @ApiOperation({ summary: 'Trigger metrics recalculation for all funds' })
  async recalculateMetrics() {
    return this.metricsCalculator.recalculateAll();
  }

  @Public()
  @Get('sync/status')
  @ApiOperation({ summary: 'Get sync status and database counts' })
  async getSyncStatus() {
    return this.fundSyncService.getSyncStatus();
  }

  // ============= Database Endpoints (ONDC Schema) =============

  @Public()
  @Get('db/funds')
  @ApiOperation({ summary: 'Get all synced funds from database with metrics' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category ID (e.g., L3-LARGE_CAP)' })
  @ApiQuery({ name: 'provider', required: false, description: 'Filter by provider/fund house slug' })
  @ApiQuery({ name: 'plan', required: false, description: 'Filter by plan type: direct, regular' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Max results (default 50)' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Offset for pagination' })
  async getDbFunds(
    @Query('category') category?: string,
    @Query('provider') provider?: string,
    @Query('plan') plan?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const where: any = {};

    if (category) {
      where.scheme = { categoryId: category };
    }
    if (provider) {
      where.scheme = { ...where.scheme, providerId: provider };
    }
    if (plan) {
      where.plan = plan;
    }

    const schemePlans = await this.prisma.schemePlan.findMany({
      where,
      include: {
        scheme: {
          include: {
            provider: true,
            category: {
              include: {
                parent: true,
              },
            },
          },
        },
        nav: true,
        metrics: true,
      },
      take: limit ? parseInt(limit) : 50,
      skip: offset ? parseInt(offset) : 0,
      orderBy: { name: 'asc' },
    });

    return schemePlans.map(plan => ({
      id: plan.id,
      schemeCode: plan.mfapiSchemeCode,
      name: plan.name,
      isin: plan.isin,
      planType: plan.plan,
      optionType: plan.option,
      fundHouse: plan.scheme.provider.name,
      fundHouseId: plan.scheme.providerId,
      category: plan.scheme.category.name,
      categoryId: plan.scheme.categoryId,
      assetClass: plan.scheme.category.parent?.name,
      currentNav: plan.nav?.nav ? Number(plan.nav.nav) : null,
      dayChange: plan.nav?.dayChange ? Number(plan.nav.dayChange) : null,
      dayChangePercent: plan.nav?.dayChangePct ? Number(plan.nav.dayChangePct) : null,
      navDate: plan.nav?.navDate,
      return1Y: plan.metrics?.return1y ? Number(plan.metrics.return1y) : null,
      return3Y: plan.metrics?.return3y ? Number(plan.metrics.return3y) : null,
      return5Y: plan.metrics?.return5y ? Number(plan.metrics.return5y) : null,
      riskRating: plan.metrics?.riskRating,
      crisilRating: plan.metrics?.crisilRating,
      fundRating: plan.metrics?.fundRating,
      expenseRatio: plan.metrics?.expenseRatio ? Number(plan.metrics.expenseRatio) : null,
      aum: plan.metrics?.aum ? Number(plan.metrics.aum) : null,
      fundManager: plan.scheme.fundManager,
    }));
  }

  @Public()
  @Get('db/fund/:id')
  @ApiOperation({ summary: 'Get single fund details from database' })
  @ApiParam({ name: 'id', description: 'Scheme Plan ID or MFAPI scheme code' })
  async getDbFundDetails(@Param('id') id: string) {
    let schemePlan = await this.prisma.schemePlan.findUnique({
      where: { id },
      include: {
        scheme: {
          include: {
            provider: true,
            category: {
              include: {
                parent: {
                  include: { parent: true },
                },
              },
            },
          },
        },
        nav: true,
        metrics: true,
        navHistory: {
          orderBy: { navDate: 'desc' },
          take: 365,
        },
      },
    });

    if (!schemePlan) {
      const schemeCode = parseInt(id);
      if (!isNaN(schemeCode)) {
        schemePlan = await this.prisma.schemePlan.findFirst({
          where: { mfapiSchemeCode: schemeCode },
          include: {
            scheme: {
              include: {
                provider: true,
                category: {
                  include: {
                    parent: {
                      include: { parent: true },
                    },
                  },
                },
              },
            },
            nav: true,
            metrics: true,
            navHistory: {
              orderBy: { navDate: 'desc' },
              take: 365,
            },
          },
        });
      }
    }

    if (!schemePlan) return null;

    return {
      id: schemePlan.id,
      schemeCode: schemePlan.mfapiSchemeCode,
      name: schemePlan.name,
      isin: schemePlan.isin,
      planType: schemePlan.plan,
      optionType: schemePlan.option,
      scheme: {
        id: schemePlan.scheme.id,
        name: schemePlan.scheme.name,
        fundManager: schemePlan.scheme.fundManager,
        exitLoad: schemePlan.scheme.exitLoad,
        benchmark: schemePlan.scheme.benchmark,
      },
      provider: {
        id: schemePlan.scheme.provider.id,
        name: schemePlan.scheme.provider.name,
        shortName: schemePlan.scheme.provider.shortName,
      },
      category: {
        id: schemePlan.scheme.category.id,
        name: schemePlan.scheme.category.name,
        parent: schemePlan.scheme.category.parent?.name,
        l1: schemePlan.scheme.category.parent?.parent?.name,
      },
      nav: schemePlan.nav ? {
        value: Number(schemePlan.nav.nav),
        date: schemePlan.nav.navDate,
        dayChange: Number(schemePlan.nav.dayChange),
        dayChangePercent: Number(schemePlan.nav.dayChangePct),
      } : null,
      metrics: schemePlan.metrics ? {
        return1W: schemePlan.metrics.return1w ? Number(schemePlan.metrics.return1w) : null,
        return1M: schemePlan.metrics.return1m ? Number(schemePlan.metrics.return1m) : null,
        return3M: schemePlan.metrics.return3m ? Number(schemePlan.metrics.return3m) : null,
        return6M: schemePlan.metrics.return6m ? Number(schemePlan.metrics.return6m) : null,
        return1Y: schemePlan.metrics.return1y ? Number(schemePlan.metrics.return1y) : null,
        return3Y: schemePlan.metrics.return3y ? Number(schemePlan.metrics.return3y) : null,
        return5Y: schemePlan.metrics.return5y ? Number(schemePlan.metrics.return5y) : null,
        returnSinceInception: schemePlan.metrics.returnSinceInception ? Number(schemePlan.metrics.returnSinceInception) : null,
        riskRating: schemePlan.metrics.riskRating,
        crisilRating: schemePlan.metrics.crisilRating,
        fundRating: schemePlan.metrics.fundRating,
        volatility: schemePlan.metrics.volatility ? Number(schemePlan.metrics.volatility) : null,
        sharpeRatio: schemePlan.metrics.sharpeRatio ? Number(schemePlan.metrics.sharpeRatio) : null,
        sortinoRatio: schemePlan.metrics.sortinoRatio ? Number(schemePlan.metrics.sortinoRatio) : null,
        alpha: schemePlan.metrics.alpha ? Number(schemePlan.metrics.alpha) : null,
        beta: schemePlan.metrics.beta ? Number(schemePlan.metrics.beta) : null,
        maxDrawdown: schemePlan.metrics.maxDrawdown ? Number(schemePlan.metrics.maxDrawdown) : null,
        expenseRatio: schemePlan.metrics.expenseRatio ? Number(schemePlan.metrics.expenseRatio) : null,
        aum: schemePlan.metrics.aum ? Number(schemePlan.metrics.aum) : null,
      } : null,
      navHistory: schemePlan.navHistory.map(h => ({
        date: h.navDate,
        nav: Number(h.nav),
      })),
    };
  }

  @Public()
  @Get('db/providers')
  @ApiOperation({ summary: 'Get all fund providers (AMCs) from database' })
  async getDbProviders() {
    const providers = await this.prisma.provider.findMany({
      include: {
        _count: {
          select: { schemes: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return providers.map(p => ({
      id: p.id,
      name: p.name,
      shortName: p.shortName,
      schemeCount: p._count.schemes,
    }));
  }

  @Public()
  @Get('db/categories')
  @ApiOperation({ summary: 'Get all ONDC categories from database' })
  async getDbCategories() {
    const categories = await this.prisma.category.findMany({
      include: {
        parent: true,
        _count: {
          select: { schemes: true },
        },
      },
      orderBy: [{ level: 'asc' }, { name: 'asc' }],
    });

    return categories.map(c => ({
      id: c.id,
      code: c.code,
      name: c.name,
      level: c.level,
      parentId: c.parentId,
      parentName: c.parent?.name,
      schemeCount: c._count.schemes,
    }));
  }

  // ============= ML Service Compatible Endpoints =============

  @Public()
  @Get('ml/funds')
  @ApiOperation({ summary: 'Get all synced funds in ML-compatible format (for ML Service)' })
  @ApiQuery({ name: 'asset_class', required: false, description: 'Filter by asset class (equity, debt, hybrid, gold, international, liquid)' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by fund category' })
  async getMlFunds(
    @Query('asset_class') assetClass?: string,
    @Query('category') category?: string,
  ) {
    const where: any = {
      plan: 'direct',
      option: 'growth',
      status: 'active',
    };

    if (category) {
      where.scheme = { category: { name: { contains: category, mode: 'insensitive' } } };
    }

    const schemePlans = await this.prisma.schemePlan.findMany({
      where,
      include: {
        scheme: {
          include: {
            provider: true,
            category: {
              include: {
                parent: true,
              },
            },
          },
        },
        nav: true,
        metrics: true,
      },
      orderBy: { name: 'asc' },
    });

    // Pre-load BSE scheme master by ISIN for min amounts
    const isins = schemePlans.map(p => p.isin).filter(Boolean);
    const bseMasters = isins.length > 0
      ? await this.prisma.bseSchemeMaster.findMany({
          where: { isin: { in: isins } },
          select: { isin: true, minPurchaseAmt: true, minSipAmt: true },
        })
      : [];
    const bseByIsin = new Map(
      bseMasters.filter(m => m.isin).map(m => [m.isin!, m]),
    );

    let funds = schemePlans.map(plan => {
      const categoryName = plan.scheme.category.name.toLowerCase();
      const parentName = plan.scheme.category.parent?.name?.toLowerCase() || '';

      let fundAssetClass = 'equity';
      if (categoryName.includes('liquid') || categoryName.includes('overnight') || categoryName.includes('money market')) {
        fundAssetClass = 'liquid';
      } else if (categoryName.includes('gilt') || categoryName.includes('bond') || categoryName.includes('debt') ||
                 categoryName.includes('duration') || parentName.includes('debt')) {
        fundAssetClass = 'debt';
      } else if (categoryName.includes('hybrid') || categoryName.includes('balanced') || categoryName.includes('arbitrage') ||
                 categoryName.includes('multi asset') || parentName.includes('hybrid')) {
        fundAssetClass = 'hybrid';
      } else if (categoryName.includes('gold') || categoryName.includes('silver')) {
        fundAssetClass = 'gold';
      } else if (categoryName.includes('international') || categoryName.includes('global') || categoryName.includes('overseas')) {
        fundAssetClass = 'international';
      }

      const bseMaster = bseByIsin.get(plan.isin);

      return {
        scheme_code: plan.mfapiSchemeCode || 0,
        scheme_name: plan.name,
        fund_house: plan.scheme.provider.name,
        category: plan.scheme.category.name,
        sub_category: plan.scheme.category.parent?.name || null,
        asset_class: fundAssetClass,
        nav: plan.nav?.nav ? Number(plan.nav.nav) : 0,
        nav_date: plan.nav?.navDate || null,
        day_change: plan.nav?.dayChange ? Number(plan.nav.dayChange) : 0,
        day_change_percent: plan.nav?.dayChangePct ? Number(plan.nav.dayChangePct) : 0,
        return_1y: plan.metrics?.return1y ? Number(plan.metrics.return1y) : 0,
        return_3y: plan.metrics?.return3y ? Number(plan.metrics.return3y) : 0,
        return_5y: plan.metrics?.return5y ? Number(plan.metrics.return5y) : 0,
        risk_rating: plan.metrics?.riskRating || null,
        fund_rating: plan.metrics?.fundRating || null,
        volatility: plan.metrics?.volatility ? Number(plan.metrics.volatility) : 15,
        sharpe_ratio: plan.metrics?.sharpeRatio ? Number(plan.metrics.sharpeRatio) : 0.8,
        expense_ratio: plan.metrics?.expenseRatio ? Number(plan.metrics.expenseRatio) : 0.5,
        aum: plan.metrics?.aum ? Number(plan.metrics.aum) : null,
        fund_manager: plan.scheme.fundManager || null,
        benchmark: plan.scheme.benchmark || null,
        exit_load: plan.scheme.exitLoad || null,
        min_investment: bseMaster?.minPurchaseAmt ? Number(bseMaster.minPurchaseAmt) : null,
        min_sip_amount: bseMaster?.minSipAmt ? Number(bseMaster.minSipAmt) : null,
        last_updated: plan.nav?.updatedAt || plan.updatedAt,
      };
    });

    if (assetClass) {
      funds = funds.filter(f => f.asset_class === assetClass.toLowerCase());
    }

    const categories = [...new Set(funds.map(f => f.category))].sort();
    const assetClasses = [...new Set(funds.map(f => f.asset_class))].sort();

    return {
      funds,
      total: funds.length,
      filters: {
        categories,
        asset_classes: assetClasses,
      },
    };
  }

  @Public()
  @Get('ml/funds/stats')
  @ApiOperation({ summary: 'Get fund statistics in ML-compatible format' })
  async getMlFundsStats() {
    const result = await this.getMlFunds();
    const funds = result.funds;

    const byAssetClass: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    let totalReturn1y = 0;
    let totalReturn3y = 0;
    let totalExpense = 0;
    let countWithReturn1y = 0;
    let countWithReturn3y = 0;
    let countWithExpense = 0;

    for (const fund of funds) {
      byAssetClass[fund.asset_class] = (byAssetClass[fund.asset_class] || 0) + 1;
      byCategory[fund.category] = (byCategory[fund.category] || 0) + 1;

      if (fund.return_1y) {
        totalReturn1y += fund.return_1y;
        countWithReturn1y++;
      }
      if (fund.return_3y) {
        totalReturn3y += fund.return_3y;
        countWithReturn3y++;
      }
      if (fund.expense_ratio) {
        totalExpense += fund.expense_ratio;
        countWithExpense++;
      }
    }

    return {
      total_funds: funds.length,
      by_asset_class: byAssetClass,
      by_category: byCategory,
      averages: {
        return_1y: countWithReturn1y > 0 ? totalReturn1y / countWithReturn1y : 0,
        return_3y: countWithReturn3y > 0 ? totalReturn3y / countWithReturn3y : 0,
        expense_ratio: countWithExpense > 0 ? totalExpense / countWithExpense : 0,
      },
    };
  }

  // ============= Private Helpers =============

  private mapToFundResponse(plan: any): FundResponse {
    return {
      schemeCode: plan.mfapiSchemeCode,
      schemeName: plan.name,
      fundHouse: plan.scheme.provider.name,
      category: plan.scheme.category.name,
      schemeType: plan.scheme.category.parent?.name || plan.scheme.category.name,
      assetClass: this.deriveAssetClass(plan.scheme.category.parent?.name || plan.scheme.category.name),
      currentNav: plan.nav?.nav ? Number(plan.nav.nav) : null,
      dayChange: plan.nav?.dayChange ? Number(plan.nav.dayChange) : null,
      dayChangePercent: plan.nav?.dayChangePct ? Number(plan.nav.dayChangePct) : null,
      navDate: plan.nav?.navDate || null,
      return1Y: plan.metrics?.return1y ? Number(plan.metrics.return1y) : null,
      return3Y: plan.metrics?.return3y ? Number(plan.metrics.return3y) : null,
      return5Y: plan.metrics?.return5y ? Number(plan.metrics.return5y) : null,
      riskRating: plan.metrics?.riskRating || null,
      volatility: plan.metrics?.volatility ? Number(plan.metrics.volatility) : null,
      sharpeRatio: plan.metrics?.sharpeRatio ? Number(plan.metrics.sharpeRatio) : null,
      sortinoRatio: plan.metrics?.sortinoRatio ? Number(plan.metrics.sortinoRatio) : null,
      alpha: plan.metrics?.alpha ? Number(plan.metrics.alpha) : null,
      beta: plan.metrics?.beta ? Number(plan.metrics.beta) : null,
      maxDrawdown: plan.metrics?.maxDrawdown ? Number(plan.metrics.maxDrawdown) : null,
      isin: plan.isin,
      expenseRatio: plan.metrics?.expenseRatio ? Number(plan.metrics.expenseRatio) : null,
      aum: plan.metrics?.aum ? Number(plan.metrics.aum) : null,
      fundManager: plan.scheme.fundManager || null,
      fundRating: plan.metrics?.fundRating || null,
      crisilRating: plan.metrics?.crisilRating || null,
      benchmark: plan.scheme.benchmark || null,
      exitLoad: plan.scheme.exitLoad || null,
    };
  }

  private deriveAssetClass(categoryName: string): string {
    const lower = (categoryName || '').toLowerCase();
    if (lower.includes('equity') || lower.includes('cap') || lower.includes('elss') || lower.includes('index') || lower.includes('sectoral') || lower.includes('thematic')) return 'equity';
    if (lower.includes('debt') || lower.includes('bond') || lower.includes('gilt') || lower.includes('credit') || lower.includes('duration') || lower.includes('banking and psu') || lower.includes('floater')) return 'debt';
    if (lower.includes('hybrid') || lower.includes('balanced') || lower.includes('arbitrage') || lower.includes('multi asset') || lower.includes('equity savings')) return 'hybrid';
    if (lower.includes('liquid') || lower.includes('money market') || lower.includes('overnight')) return 'liquid';
    if (lower.includes('gold')) return 'gold';
    if (lower.includes('international') || lower.includes('overseas') || lower.includes('global')) return 'international';
    return 'equity';
  }
}
