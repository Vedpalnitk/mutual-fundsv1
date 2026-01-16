import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@sparrow.com' },
    update: {},
    create: {
      email: 'admin@sparrow.com',
      passwordHash: adminPassword,
      role: 'super_admin',
      isActive: true,
      isVerified: true,
      profile: {
        create: {
          name: 'Admin User',
        },
      },
    },
  });
  console.log(`✅ Admin user created: ${admin.email}`);

  // Create Capital Guardian persona
  const capitalGuardian = await prisma.persona.upsert({
    where: { slug: 'capital-guardian' },
    update: {},
    create: {
      name: 'Capital Guardian',
      slug: 'capital-guardian',
      description: 'Conservative investor focused on capital preservation with minimal risk exposure',
      riskBand: 'Capital Preservation',
      iconName: 'shield-outline',
      colorPrimary: '#4CAF50',
      colorSecondary: '#81C784',
      displayOrder: 1,
      isActive: true,
      rules: {
        create: [
          { ruleType: 'horizon', operator: 'lte', value: 5, priority: 10 },
          { ruleType: 'liquidity', operator: 'eq', value: 'High', priority: 9 },
          { ruleType: 'risk_tolerance', operator: 'eq', value: 'Conservative', priority: 8 },
        ],
      },
      insights: {
        create: [
          { insightText: 'Focus on capital preservation with minimal risk exposure', displayOrder: 0 },
          { insightText: 'Prioritize debt funds and liquid investments', displayOrder: 1 },
          { insightText: 'Suitable for short-term goals or near-retirement investors', displayOrder: 2 },
        ],
      },
    },
  });
  console.log(`✅ Persona created: ${capitalGuardian.name}`);

  // Create allocation strategy for Capital Guardian
  await prisma.allocationStrategy.upsert({
    where: { id: 'capital-guardian-v1' },
    update: {},
    create: {
      id: 'capital-guardian-v1',
      personaId: capitalGuardian.id,
      name: 'Capital Guardian Default Allocation',
      description: 'Conservative allocation with debt-heavy portfolio',
      version: 1,
      isActive: true,
      components: {
        create: [
          { label: 'Debt Funds', allocationPercent: 55, note: 'Short-term and corporate bonds', riskLevel: 'Low', displayOrder: 0 },
          { label: 'Equity Funds', allocationPercent: 30, note: 'Large cap index funds', riskLevel: 'Moderate', displayOrder: 1 },
          { label: 'Hybrid Funds', allocationPercent: 12, note: 'Conservative hybrid', riskLevel: 'Low', displayOrder: 2 },
          { label: 'Alternatives', allocationPercent: 3, note: 'Gold ETF', riskLevel: 'Low', displayOrder: 3 },
        ],
      },
      constraints: {
        create: [
          { constraintType: 'max_equity', constraintValue: 35, description: 'Maximum equity exposure' },
          { constraintType: 'min_debt', constraintValue: 50, description: 'Minimum debt allocation' },
        ],
      },
    },
  });

  // Create Balanced Voyager persona
  const balancedVoyager = await prisma.persona.upsert({
    where: { slug: 'balanced-voyager' },
    update: {},
    create: {
      name: 'Balanced Voyager',
      slug: 'balanced-voyager',
      description: 'Moderate investor seeking steady growth with controlled volatility',
      riskBand: 'Balanced Growth',
      iconName: 'compass-outline',
      colorPrimary: '#2196F3',
      colorSecondary: '#64B5F6',
      displayOrder: 2,
      isActive: true,
      rules: {
        create: [
          { ruleType: 'horizon', operator: 'gte', value: 5, priority: 10 },
          { ruleType: 'horizon', operator: 'lt', value: 10, priority: 10 },
          { ruleType: 'risk_tolerance', operator: 'eq', value: 'Moderate', priority: 9 },
        ],
      },
      insights: {
        create: [
          { insightText: 'Balance between growth and stability', displayOrder: 0 },
          { insightText: 'Diversified portfolio across equity and debt', displayOrder: 1 },
          { insightText: 'Suitable for medium-term goals (5-10 years)', displayOrder: 2 },
        ],
      },
    },
  });
  console.log(`✅ Persona created: ${balancedVoyager.name}`);

  // Create allocation strategy for Balanced Voyager
  await prisma.allocationStrategy.upsert({
    where: { id: 'balanced-voyager-v1' },
    update: {},
    create: {
      id: 'balanced-voyager-v1',
      personaId: balancedVoyager.id,
      name: 'Balanced Voyager Default Allocation',
      description: 'Balanced allocation for steady growth',
      version: 1,
      isActive: true,
      components: {
        create: [
          { label: 'Equity Funds', allocationPercent: 55, note: 'Large cap + flexi cap blend', riskLevel: 'Moderate', displayOrder: 0 },
          { label: 'Debt Funds', allocationPercent: 30, note: 'Medium duration bonds', riskLevel: 'Low', displayOrder: 1 },
          { label: 'Hybrid Funds', allocationPercent: 12, note: 'Balanced advantage', riskLevel: 'Moderate', displayOrder: 2 },
          { label: 'Alternatives', allocationPercent: 3, note: 'Gold + REITs', riskLevel: 'Moderate', displayOrder: 3 },
        ],
      },
      constraints: {
        create: [
          { constraintType: 'max_equity', constraintValue: 60, description: 'Maximum equity exposure' },
          { constraintType: 'min_debt', constraintValue: 25, description: 'Minimum debt allocation' },
        ],
      },
    },
  });

  // Create Accelerated Builder persona
  const acceleratedBuilder = await prisma.persona.upsert({
    where: { slug: 'accelerated-builder' },
    update: {},
    create: {
      name: 'Accelerated Builder',
      slug: 'accelerated-builder',
      description: 'Aggressive investor focused on long-term wealth creation',
      riskBand: 'Accelerated Growth',
      iconName: 'rocket-outline',
      colorPrimary: '#FF5722',
      colorSecondary: '#FF8A65',
      displayOrder: 3,
      isActive: true,
      rules: {
        create: [
          { ruleType: 'horizon', operator: 'gte', value: 10, priority: 10 },
          { ruleType: 'risk_tolerance', operator: 'eq', value: 'Aggressive', priority: 9 },
          { ruleType: 'volatility', operator: 'eq', value: 'High', priority: 8 },
        ],
      },
      insights: {
        create: [
          { insightText: 'Long-term wealth creation through equity exposure', displayOrder: 0 },
          { insightText: 'Higher volatility tolerance for potential higher returns', displayOrder: 1 },
          { insightText: 'Suitable for goals 10+ years away', displayOrder: 2 },
        ],
      },
    },
  });
  console.log(`✅ Persona created: ${acceleratedBuilder.name}`);

  // Create allocation strategy for Accelerated Builder
  await prisma.allocationStrategy.upsert({
    where: { id: 'accelerated-builder-v1' },
    update: {},
    create: {
      id: 'accelerated-builder-v1',
      personaId: acceleratedBuilder.id,
      name: 'Accelerated Builder Default Allocation',
      description: 'Aggressive allocation for long-term growth',
      version: 1,
      isActive: true,
      components: {
        create: [
          { label: 'Equity Funds', allocationPercent: 70, note: 'Flexi cap + mid cap blend', riskLevel: 'High', displayOrder: 0 },
          { label: 'Mid/Small Cap', allocationPercent: 12, note: 'High growth potential', riskLevel: 'Very High', displayOrder: 1 },
          { label: 'Debt Funds', allocationPercent: 15, note: 'Short-term tactical', riskLevel: 'Low', displayOrder: 2 },
          { label: 'Alternatives', allocationPercent: 3, note: 'Sector funds + gold', riskLevel: 'High', displayOrder: 3 },
        ],
      },
      constraints: {
        create: [
          { constraintType: 'max_equity', constraintValue: 85, description: 'Maximum equity exposure' },
          { constraintType: 'min_debt', constraintValue: 10, description: 'Minimum debt buffer' },
        ],
      },
    },
  });

  // Create ML model placeholders
  const personaClassifier = await prisma.mlModel.upsert({
    where: { slug: 'persona-classifier' },
    update: {},
    create: {
      name: 'Persona Classifier',
      slug: 'persona-classifier',
      modelType: 'persona_classifier',
      description: 'XGBoost model for classifying users into investment personas',
      framework: 'xgboost',
    },
  });
  console.log(`✅ ML Model created: ${personaClassifier.name}`);

  const portfolioOptimizer = await prisma.mlModel.upsert({
    where: { slug: 'portfolio-optimizer' },
    update: {},
    create: {
      name: 'Portfolio Optimizer',
      slug: 'portfolio-optimizer',
      modelType: 'portfolio_optimizer',
      description: 'Mean-variance optimization for portfolio allocation',
      framework: 'scipy',
    },
  });
  console.log(`✅ ML Model created: ${portfolioOptimizer.name}`);

  const fundRecommender = await prisma.mlModel.upsert({
    where: { slug: 'fund-recommender' },
    update: {},
    create: {
      name: 'Fund Recommender',
      slug: 'fund-recommender',
      modelType: 'fund_recommender',
      description: 'LightGBM model for recommending mutual funds',
      framework: 'lightgbm',
    },
  });
  console.log(`✅ ML Model created: ${fundRecommender.name}`);

  console.log('✅ Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
