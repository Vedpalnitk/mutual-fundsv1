import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ONDC 3-Level Category Taxonomy
const ONDC_CATEGORIES = {
  // Level 1 - Scheme Type
  L1: [
    { id: 'L1-OPEN', code: 'OPEN', name: 'Open Ended' },
    { id: 'L1-CLOSE', code: 'CLOSE', name: 'Close Ended' },
    { id: 'L1-INTERVAL', code: 'INTERVAL', name: 'Interval' },
  ],
  // Level 2 - Asset Class
  L2: [
    { id: 'L2-EQUITY', code: 'EQUITY', name: 'Equity', parentId: 'L1-OPEN' },
    { id: 'L2-DEBT', code: 'DEBT', name: 'Debt', parentId: 'L1-OPEN' },
    { id: 'L2-HYBRID', code: 'HYBRID', name: 'Hybrid', parentId: 'L1-OPEN' },
    { id: 'L2-SOLUTION', code: 'SOLUTION', name: 'Solution Oriented', parentId: 'L1-OPEN' },
    { id: 'L2-OTHER', code: 'OTHER', name: 'Other', parentId: 'L1-OPEN' },
  ],
  // Level 3 - Specific Categories (SEBI)
  L3: [
    // Equity Categories (12)
    { id: 'L3-MULTI_CAP', code: 'MULTI_CAP', name: 'Multi Cap Fund', parentId: 'L2-EQUITY' },
    { id: 'L3-LARGE_CAP', code: 'LARGE_CAP', name: 'Large Cap Fund', parentId: 'L2-EQUITY' },
    { id: 'L3-LARGE_MID_CAP', code: 'LARGE_MID_CAP', name: 'Large & Mid Cap Fund', parentId: 'L2-EQUITY' },
    { id: 'L3-MID_CAP', code: 'MID_CAP', name: 'Mid Cap Fund', parentId: 'L2-EQUITY' },
    { id: 'L3-SMALL_CAP', code: 'SMALL_CAP', name: 'Small Cap Fund', parentId: 'L2-EQUITY' },
    { id: 'L3-DIVIDEND_YIELD', code: 'DIVIDEND_YIELD', name: 'Dividend Yield Fund', parentId: 'L2-EQUITY' },
    { id: 'L3-VALUE', code: 'VALUE', name: 'Value Fund', parentId: 'L2-EQUITY' },
    { id: 'L3-CONTRA', code: 'CONTRA', name: 'Contra Fund', parentId: 'L2-EQUITY' },
    { id: 'L3-FOCUSED', code: 'FOCUSED', name: 'Focused Fund', parentId: 'L2-EQUITY' },
    { id: 'L3-SECTORAL', code: 'SECTORAL', name: 'Sectoral/Thematic Fund', parentId: 'L2-EQUITY' },
    { id: 'L3-ELSS', code: 'ELSS', name: 'ELSS (Tax Saving)', parentId: 'L2-EQUITY' },
    { id: 'L3-FLEXI_CAP', code: 'FLEXI_CAP', name: 'Flexi Cap Fund', parentId: 'L2-EQUITY' },

    // Debt Categories (16)
    { id: 'L3-OVERNIGHT', code: 'OVERNIGHT', name: 'Overnight Fund', parentId: 'L2-DEBT' },
    { id: 'L3-LIQUID', code: 'LIQUID', name: 'Liquid Fund', parentId: 'L2-DEBT' },
    { id: 'L3-ULTRA_SHORT', code: 'ULTRA_SHORT', name: 'Ultra Short Duration Fund', parentId: 'L2-DEBT' },
    { id: 'L3-LOW_DURATION', code: 'LOW_DURATION', name: 'Low Duration Fund', parentId: 'L2-DEBT' },
    { id: 'L3-MONEY_MARKET', code: 'MONEY_MARKET', name: 'Money Market Fund', parentId: 'L2-DEBT' },
    { id: 'L3-SHORT_DURATION', code: 'SHORT_DURATION', name: 'Short Duration Fund', parentId: 'L2-DEBT' },
    { id: 'L3-MEDIUM_DURATION', code: 'MEDIUM_DURATION', name: 'Medium Duration Fund', parentId: 'L2-DEBT' },
    { id: 'L3-MEDIUM_LONG_DURATION', code: 'MEDIUM_LONG_DURATION', name: 'Medium to Long Duration Fund', parentId: 'L2-DEBT' },
    { id: 'L3-LONG_DURATION', code: 'LONG_DURATION', name: 'Long Duration Fund', parentId: 'L2-DEBT' },
    { id: 'L3-DYNAMIC_BOND', code: 'DYNAMIC_BOND', name: 'Dynamic Bond Fund', parentId: 'L2-DEBT' },
    { id: 'L3-CORPORATE_BOND', code: 'CORPORATE_BOND', name: 'Corporate Bond Fund', parentId: 'L2-DEBT' },
    { id: 'L3-CREDIT_RISK', code: 'CREDIT_RISK', name: 'Credit Risk Fund', parentId: 'L2-DEBT' },
    { id: 'L3-BANKING_PSU', code: 'BANKING_PSU', name: 'Banking and PSU Fund', parentId: 'L2-DEBT' },
    { id: 'L3-GILT', code: 'GILT', name: 'Gilt Fund', parentId: 'L2-DEBT' },
    { id: 'L3-GILT_10Y', code: 'GILT_10Y', name: 'Gilt Fund with 10Y Constant Duration', parentId: 'L2-DEBT' },
    { id: 'L3-FLOATER', code: 'FLOATER', name: 'Floater Fund', parentId: 'L2-DEBT' },

    // Hybrid Categories (7)
    { id: 'L3-CONSERVATIVE_HYBRID', code: 'CONSERVATIVE_HYBRID', name: 'Conservative Hybrid Fund', parentId: 'L2-HYBRID' },
    { id: 'L3-BALANCED_HYBRID', code: 'BALANCED_HYBRID', name: 'Balanced Hybrid Fund', parentId: 'L2-HYBRID' },
    { id: 'L3-AGGRESSIVE_HYBRID', code: 'AGGRESSIVE_HYBRID', name: 'Aggressive Hybrid Fund', parentId: 'L2-HYBRID' },
    { id: 'L3-DYNAMIC_ALLOCATION', code: 'DYNAMIC_ALLOCATION', name: 'Dynamic Asset Allocation / BAF', parentId: 'L2-HYBRID' },
    { id: 'L3-MULTI_ASSET', code: 'MULTI_ASSET', name: 'Multi Asset Allocation Fund', parentId: 'L2-HYBRID' },
    { id: 'L3-ARBITRAGE', code: 'ARBITRAGE', name: 'Arbitrage Fund', parentId: 'L2-HYBRID' },
    { id: 'L3-EQUITY_SAVINGS', code: 'EQUITY_SAVINGS', name: 'Equity Savings Fund', parentId: 'L2-HYBRID' },

    // Solution Oriented (2)
    { id: 'L3-RETIREMENT', code: 'RETIREMENT', name: 'Retirement Fund', parentId: 'L2-SOLUTION' },
    { id: 'L3-CHILDRENS', code: 'CHILDRENS', name: "Children's Fund", parentId: 'L2-SOLUTION' },

    // Other (5)
    { id: 'L3-INDEX', code: 'INDEX', name: 'Index Fund / ETF', parentId: 'L2-OTHER' },
    { id: 'L3-FOF_OVERSEAS', code: 'FOF_OVERSEAS', name: 'FoF (Overseas)', parentId: 'L2-OTHER' },
    { id: 'L3-FOF_DOMESTIC', code: 'FOF_DOMESTIC', name: 'FoF (Domestic)', parentId: 'L2-OTHER' },
    { id: 'L3-GOLD', code: 'GOLD', name: 'Gold Fund / ETF', parentId: 'L2-OTHER' },
    { id: 'L3-OTHER', code: 'OTHER', name: 'Other Fund', parentId: 'L2-OTHER' },
  ],
};

async function seedCategories() {
  console.log('📂 Seeding ONDC categories...');

  // Seed L1 categories
  for (const cat of ONDC_CATEGORIES.L1) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: { name: cat.name, code: cat.code },
      create: { id: cat.id, level: 1, code: cat.code, name: cat.name },
    });
  }
  console.log(`  ✓ L1 categories: ${ONDC_CATEGORIES.L1.length}`);

  // Seed L2 categories
  for (const cat of ONDC_CATEGORIES.L2) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: { name: cat.name, code: cat.code, parentId: cat.parentId },
      create: { id: cat.id, level: 2, code: cat.code, name: cat.name, parentId: cat.parentId },
    });
  }
  console.log(`  ✓ L2 categories: ${ONDC_CATEGORIES.L2.length}`);

  // Seed L3 categories
  for (const cat of ONDC_CATEGORIES.L3) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: { name: cat.name, code: cat.code, parentId: cat.parentId },
      create: { id: cat.id, level: 3, code: cat.code, name: cat.name, parentId: cat.parentId },
    });
  }
  console.log(`  ✓ L3 categories: ${ONDC_CATEGORIES.L3.length}`);

  console.log('✅ ONDC categories seeded!');
}

async function main() {
  console.log('🌱 Seeding database...');

  // Seed ONDC categories first
  await seedCategories();

  // Create admin user for Admin Portal
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@sparrow-invest.com' },
    update: {},
    create: {
      email: 'admin@sparrow-invest.com',
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

  // Create Financial Advisor user for FA Portal
  const advisorPassword = await bcrypt.hash('Advisor@123', 10);
  const advisor = await prisma.user.upsert({
    where: { email: 'advisor@sparrow-invest.com' },
    update: {},
    create: {
      email: 'advisor@sparrow-invest.com',
      passwordHash: advisorPassword,
      role: 'advisor',
      isActive: true,
      isVerified: true,
      profile: {
        create: {
          name: 'Rahul Sharma',
          city: 'Mumbai',
        },
      },
    },
  });
  console.log(`✅ Advisor user created: ${advisor.email}`);

  // Create a test user for development
  const testPassword = await bcrypt.hash('Test1234', 10);
  const testUser = await prisma.user.upsert({
    where: { email: 'advisor@test.com' },
    update: {},
    create: {
      email: 'advisor@test.com',
      passwordHash: testPassword,
      role: 'advisor',
      isActive: true,
      isVerified: true,
      profile: {
        create: {
          name: 'Test Advisor',
        },
      },
    },
  });
  console.log(`✅ Test user created: ${testUser.email}`);

  // Create a self-service user (NOT managed by any FA)
  const selfServicePassword = await bcrypt.hash('Self1234', 10);
  const selfServiceUser = await prisma.user.upsert({
    where: { email: 'self@demo.com' },
    update: {},
    create: {
      email: 'self@demo.com',
      passwordHash: selfServicePassword,
      role: 'user',
      isActive: true,
      isVerified: true,
      profile: {
        create: {
          name: 'Demo Self-Service User',
          city: 'Bengaluru',
        },
      },
    },
  });
  console.log(`✅ Self-service user created: ${selfServiceUser.email} (password: Self1234)`);

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

  // =============================================
  // FA PORTAL SAMPLE DATA
  // =============================================
  await seedFAPortalData(admin.id);

  // Seed pending actions for the advisor
  await seedAdvisorActions(advisor.id);

  // Seed advisor profiles (display name, company, credentials)
  await seedAdvisorProfiles(advisor.id);

  console.log('✅ Database seeding completed!');
  console.log('\n💡 For P2/P3 data, run: npx ts-node prisma/seed-p2p3.ts');
  console.log('💡 For fund data, run: npx ts-node prisma/seed-funds.ts');
}

// Sample funds for holdings
const SAMPLE_FUNDS = [
  { code: '120503', name: 'Axis Bluechip Fund - Direct Growth', category: 'Large Cap Fund', asset: 'Equity', nav: 52.34 },
  { code: '119598', name: 'Mirae Asset Large Cap Fund - Direct Growth', category: 'Large Cap Fund', asset: 'Equity', nav: 98.67 },
  { code: '125497', name: 'Parag Parikh Flexi Cap Fund - Direct Growth', category: 'Flexi Cap Fund', asset: 'Equity', nav: 68.45 },
  { code: '122639', name: 'HDFC Flexi Cap Fund - Direct Growth', category: 'Flexi Cap Fund', asset: 'Equity', nav: 41.23 },
  { code: '118989', name: 'SBI Small Cap Fund - Direct Growth', category: 'Small Cap Fund', asset: 'Equity', nav: 165.78 },
  { code: '125354', name: 'Nippon India Small Cap Fund - Direct Growth', category: 'Small Cap Fund', asset: 'Equity', nav: 142.56 },
  { code: '119062', name: 'Axis Midcap Fund - Direct Growth', category: 'Mid Cap Fund', asset: 'Equity', nav: 89.34 },
  { code: '120505', name: 'Kotak Emerging Equity Fund - Direct Growth', category: 'Mid Cap Fund', asset: 'Equity', nav: 95.67 },
  { code: '119551', name: 'ICICI Pru Value Discovery Fund - Direct Growth', category: 'Value Fund', asset: 'Equity', nav: 45.89 },
  { code: '120716', name: 'Axis Long Term Equity Fund - Direct Growth', category: 'ELSS', asset: 'Equity', nav: 78.45 },
  { code: '119364', name: 'HDFC Corporate Bond Fund - Direct Growth', category: 'Corporate Bond Fund', asset: 'Debt', nav: 28.34 },
  { code: '119237', name: 'ICICI Pru Corporate Bond Fund - Direct Growth', category: 'Corporate Bond Fund', asset: 'Debt', nav: 26.78 },
  { code: '120841', name: 'SBI Liquid Fund - Direct Growth', category: 'Liquid Fund', asset: 'Debt', nav: 3456.78 },
  { code: '118834', name: 'HDFC Balanced Advantage Fund - Direct Growth', category: 'Balanced Advantage Fund', asset: 'Hybrid', nav: 45.67 },
  { code: '125492', name: 'ICICI Pru Balanced Advantage Fund - Direct Growth', category: 'Balanced Advantage Fund', asset: 'Hybrid', nav: 58.34 },
];

// Sample clients data
const SAMPLE_CLIENTS = [
  { name: 'Rajesh Sharma', email: 'rajesh.sharma@email.com', phone: '+91 98765 43210', city: 'Bengaluru', risk: 'MODERATE', age: 40 },
  { name: 'Priya Patel', email: 'priya.patel@email.com', phone: '+91 87654 32109', city: 'Mumbai', risk: 'AGGRESSIVE', age: 32 },
  { name: 'Amit Verma', email: 'amit.verma@email.com', phone: '+91 76543 21098', city: 'Delhi', risk: 'CONSERVATIVE', age: 55 },
  { name: 'Sneha Reddy', email: 'sneha.reddy@email.com', phone: '+91 65432 10987', city: 'Hyderabad', risk: 'AGGRESSIVE', age: 28 },
  { name: 'Vikram Singh', email: 'vikram.singh@email.com', phone: '+91 54321 09876', city: 'Chennai', risk: 'MODERATE', age: 45 },
  { name: 'Ananya Gupta', email: 'ananya.gupta@email.com', phone: '+91 43210 98765', city: 'Pune', risk: 'MODERATE', age: 35 },
  { name: 'Rahul Joshi', email: 'rahul.joshi@email.com', phone: '+91 32109 87654', city: 'Kolkata', risk: 'CONSERVATIVE', age: 50 },
  { name: 'Meera Iyer', email: 'meera.iyer@email.com', phone: '+91 21098 76543', city: 'Bengaluru', risk: 'AGGRESSIVE', age: 38 },
  { name: 'Karthik Nair', email: 'karthik.nair@email.com', phone: '+91 10987 65432', city: 'Kochi', risk: 'MODERATE', age: 42 },
  { name: 'Divya Sharma', email: 'divya.sharma@email.com', phone: '+91 09876 54321', city: 'Jaipur', risk: 'AGGRESSIVE', age: 30 },
];

async function seedFAPortalData(advisorId: string) {
  console.log('\n📊 Seeding FA Portal data...');

  for (const clientData of SAMPLE_CLIENTS) {
    // Check if client already exists
    const existing = await prisma.fAClient.findFirst({
      where: { advisorId, email: clientData.email },
    });

    if (existing) {
      console.log(`  ⏭ Client already exists: ${clientData.name}`);
      continue;
    }

    // Create client
    const joinedDate = new Date();
    joinedDate.setMonth(joinedDate.getMonth() - Math.floor(Math.random() * 24)); // Random 0-24 months ago

    const client = await prisma.fAClient.create({
      data: {
        advisorId,
        name: clientData.name,
        email: clientData.email,
        phone: clientData.phone,
        city: clientData.city,
        state: getStateFromCity(clientData.city),
        riskProfile: clientData.risk as any,
        status: 'ACTIVE',
        kycStatus: 'VERIFIED',
        dateOfBirth: new Date(new Date().getFullYear() - clientData.age, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        lastActiveAt: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)), // Random 0-7 days ago
        createdAt: joinedDate,
      },
    });

    console.log(`  ✓ Created client: ${client.name}`);

    // Create 5-8 holdings per client
    const holdingsCount = 5 + Math.floor(Math.random() * 4);
    const usedFunds = new Set<string>();

    for (let i = 0; i < holdingsCount; i++) {
      let fund;
      do {
        fund = SAMPLE_FUNDS[Math.floor(Math.random() * SAMPLE_FUNDS.length)];
      } while (usedFunds.has(fund.code));
      usedFunds.add(fund.code);

      const units = Math.floor(Math.random() * 500) + 50;
      const avgNav = fund.nav * (0.85 + Math.random() * 0.2); // Bought at 85-105% of current NAV
      const currentNav = fund.nav;
      const investedValue = units * avgNav;
      const currentValue = units * currentNav;

      const holdingDate = new Date();
      holdingDate.setMonth(holdingDate.getMonth() - Math.floor(Math.random() * 18));

      await prisma.fAHolding.create({
        data: {
          clientId: client.id,
          fundName: fund.name,
          fundSchemeCode: fund.code,
          fundCategory: fund.category,
          assetClass: fund.asset,
          folioNumber: generateFolioNumber(),
          units,
          avgNav,
          currentNav,
          investedValue,
          currentValue,
          absoluteGain: currentValue - investedValue,
          absoluteGainPct: ((currentValue - investedValue) / investedValue) * 100,
          xirr: 12 + Math.random() * 15,
          lastTxnDate: holdingDate,
        },
      });
    }

    // Create 2-4 active SIPs per client
    const sipCount = 2 + Math.floor(Math.random() * 3);
    const sipFunds = new Set<string>();

    for (let i = 0; i < sipCount; i++) {
      let fund;
      do {
        fund = SAMPLE_FUNDS[Math.floor(Math.random() * SAMPLE_FUNDS.length)];
      } while (sipFunds.has(fund.code) || fund.asset === 'Debt');
      sipFunds.add(fund.code);

      const sipDate = [1, 5, 10, 15, 20][Math.floor(Math.random() * 5)];
      const amount = [5000, 10000, 15000, 20000, 25000][Math.floor(Math.random() * 5)];
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - Math.floor(Math.random() * 12));

      const completedInstallments = Math.floor((Date.now() - startDate.getTime()) / (30 * 24 * 60 * 60 * 1000));
      const totalInvested = completedInstallments * amount;
      const returns = totalInvested * (0.1 + Math.random() * 0.15);

      const nextSipDate = new Date();
      if (nextSipDate.getDate() >= sipDate) {
        nextSipDate.setMonth(nextSipDate.getMonth() + 1);
      }
      nextSipDate.setDate(sipDate);

      await prisma.fASIP.create({
        data: {
          clientId: client.id,
          fundName: fund.name,
          fundSchemeCode: fund.code,
          folioNumber: generateFolioNumber(),
          amount,
          frequency: 'MONTHLY',
          sipDate,
          startDate,
          status: 'ACTIVE',
          totalInstallments: 60,
          completedInstallments,
          totalInvested,
          currentValue: totalInvested + returns,
          returns,
          returnsPct: totalInvested > 0 ? (returns / totalInvested) * 100 : 0,
          nextSipDate,
          lastSipDate: completedInstallments > 0 ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) : null,
          stepUpPercent: Math.random() > 0.5 ? 10 : undefined,
          stepUpFrequency: Math.random() > 0.5 ? 'Yearly' : undefined,
        },
      });
    }

    // Create transaction history (last 10-20 transactions)
    const transactionCount = 10 + Math.floor(Math.random() * 11);

    for (let i = 0; i < transactionCount; i++) {
      const fund = SAMPLE_FUNDS[Math.floor(Math.random() * SAMPLE_FUNDS.length)];
      const transactionDate = new Date();
      transactionDate.setDate(transactionDate.getDate() - Math.floor(Math.random() * 365));

      const types = ['BUY', 'SIP', 'SIP', 'SIP', 'BUY'] as const; // More SIPs than lumpsum
      const type = types[Math.floor(Math.random() * types.length)];
      const amount = type === 'SIP'
        ? [5000, 10000, 15000][Math.floor(Math.random() * 3)]
        : [25000, 50000, 100000, 200000][Math.floor(Math.random() * 4)];

      const statuses = ['COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'PENDING'] as const;
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      await prisma.fATransaction.create({
        data: {
          clientId: client.id,
          fundName: fund.name,
          fundSchemeCode: fund.code,
          fundCategory: fund.category,
          type,
          amount,
          units: amount / fund.nav,
          nav: fund.nav,
          status,
          date: transactionDate,
          folioNumber: generateFolioNumber(),
          orderId: `ORD${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
          paymentMode: ['Net Banking', 'UPI', 'NACH'][Math.floor(Math.random() * 3)],
        },
      });
    }
  }

  console.log('✅ FA Portal data seeded!');
}

async function seedAdvisorActions(advisorId: string) {
  console.log('\n📋 Seeding advisor pending actions...');

  // Check if advisor already has actions
  const existingActions = await prisma.userAction.findFirst({
    where: { userId: advisorId },
  });

  if (existingActions) {
    console.log('  ⏭ Advisor actions already exist');
    return;
  }

  // Get some clients to reference in actions
  const clients = await prisma.fAClient.findMany({
    where: { advisorId },
    take: 5,
  });

  const actions = [
    // SIP Due actions
    {
      type: 'SIP_DUE' as const,
      priority: 'URGENT' as const,
      title: `SIP Due: ${clients[0]?.name || 'Rajesh Sharma'}`,
      description: 'Monthly SIP of ₹25,000 for HDFC Flexi Cap Fund is due tomorrow',
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
      referenceId: clients[0]?.id,
    },
    {
      type: 'SIP_DUE' as const,
      priority: 'HIGH' as const,
      title: `SIP Due: ${clients[1]?.name || 'Priya Patel'}`,
      description: 'Monthly SIP of ₹15,000 for Axis Midcap Fund is due in 3 days',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      referenceId: clients[1]?.id,
    },

    // Rebalance recommendations
    {
      type: 'REBALANCE_RECOMMENDED' as const,
      priority: 'HIGH' as const,
      title: `Portfolio Drift: ${clients[2]?.name || 'Amit Kumar'}`,
      description: 'Portfolio has drifted 8% from target allocation. Equity exposure above limit.',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      referenceId: clients[2]?.id,
    },
    {
      type: 'REBALANCE_RECOMMENDED' as const,
      priority: 'MEDIUM' as const,
      title: `Rebalance Due: ${clients[3]?.name || 'Sneha Gupta'}`,
      description: 'Quarterly rebalancing recommended. Current allocation drifted 5% from target.',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      referenceId: clients[3]?.id,
    },

    // Goal review
    {
      type: 'GOAL_REVIEW' as const,
      priority: 'MEDIUM' as const,
      title: `Quarterly Review: ${clients[0]?.name || 'Rajesh Sharma'}`,
      description: 'Quarterly goal progress review is due. Retirement goal at 68% progress.',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      referenceId: clients[0]?.id,
    },
    {
      type: 'GOAL_REVIEW' as const,
      priority: 'LOW' as const,
      title: `Annual Review: ${clients[4]?.name || 'Vikram Singh'}`,
      description: 'Annual portfolio review and goal assessment is due this month.',
      dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      referenceId: clients[4]?.id,
    },

    // KYC expiry
    {
      type: 'KYC_EXPIRY' as const,
      priority: 'MEDIUM' as const,
      title: `KYC Renewal: ${clients[3]?.name || 'Sneha Gupta'}`,
      description: 'Client KYC will expire in 30 days. Please initiate renewal process.',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      referenceId: clients[3]?.id,
    },

    // Tax harvesting
    {
      type: 'TAX_HARVESTING' as const,
      priority: 'MEDIUM' as const,
      title: `Tax Harvesting Opportunity: ${clients[1]?.name || 'Priya Patel'}`,
      description: 'Unrealized losses of ₹45,000 available for tax harvesting before March 31.',
      dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      referenceId: clients[1]?.id,
    },
    {
      type: 'TAX_HARVESTING' as const,
      priority: 'HIGH' as const,
      title: `ELSS Investment: ${clients[2]?.name || 'Amit Kumar'}`,
      description: 'Client has ₹50,000 remaining in Section 80C limit. Recommend ELSS investment.',
      dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      referenceId: clients[2]?.id,
    },

    // SIP Failed
    {
      type: 'SIP_FAILED' as const,
      priority: 'URGENT' as const,
      title: `SIP Failed: ${clients[4]?.name || 'Vikram Singh'}`,
      description: 'SIP debit failed due to insufficient balance. Immediate action required.',
      dueDate: new Date(),
      referenceId: clients[4]?.id,
    },
  ];

  for (const action of actions) {
    await prisma.userAction.create({
      data: {
        userId: advisorId,
        ...action,
        actionUrl: `/advisor/clients/${action.referenceId}`,
      },
    });
  }

  console.log(`  ✓ Created ${actions.length} pending actions for advisor`);
}

function generateFolioNumber(): string {
  return `${Math.floor(Math.random() * 9000000000000) + 1000000000000}`;
}

function getStateFromCity(city: string): string {
  const cityStateMap: Record<string, string> = {
    'Bengaluru': 'Karnataka',
    'Mumbai': 'Maharashtra',
    'Delhi': 'Delhi',
    'Hyderabad': 'Telangana',
    'Chennai': 'Tamil Nadu',
    'Pune': 'Maharashtra',
    'Kolkata': 'West Bengal',
    'Kochi': 'Kerala',
    'Jaipur': 'Rajasthan',
  };
  return cityStateMap[city] || 'Unknown';
}

async function seedDemoUserData() {
  console.log('\n💰 Seeding P2/P3 demo data...');

  // Find demo users
  const demoUsers = await prisma.user.findMany({
    where: {
      email: {
        in: ['amit.verma@demo.com', 'priya.patel@demo.com', 'rajesh.sharma@demo.com'],
      },
    },
  });

  for (const user of demoUsers) {
    // Create tax summary for current FY
    const currentFY = '2025-26';
    const existingTax = await prisma.userTaxSummary.findUnique({
      where: { userId_financialYear: { userId: user.id, financialYear: currentFY } },
    });

    if (!existingTax) {
      await prisma.userTaxSummary.create({
        data: {
          userId: user.id,
          financialYear: currentFY,
          ltcgRealized: 85000 + Math.floor(Math.random() * 50000),
          stcgRealized: 25000 + Math.floor(Math.random() * 30000),
          ltcgUnrealized: 120000 + Math.floor(Math.random() * 80000),
          stcgUnrealized: 15000 + Math.floor(Math.random() * 20000),
          elssInvested: 50000 + Math.floor(Math.random() * 100000),
          dividendReceived: 5000 + Math.floor(Math.random() * 10000),
          taxHarvestingDone: Math.floor(Math.random() * 50000),
        },
      });
      console.log(`  ✓ Created tax summary for ${user.email}`);
    }

    // Create user actions
    const existingActions = await prisma.userAction.findFirst({
      where: { userId: user.id },
    });

    if (!existingActions) {
      const actions = [
        {
          type: 'SIP_DUE' as const,
          priority: 'HIGH' as const,
          title: 'SIP Due: HDFC Flexi Cap Fund',
          description: 'Monthly SIP of ₹10,000 is due on the 5th',
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        },
        {
          type: 'REBALANCE_RECOMMENDED' as const,
          priority: 'MEDIUM' as const,
          title: 'Portfolio Rebalancing Recommended',
          description: 'Your equity allocation has drifted 8% above target',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
        {
          type: 'TAX_HARVESTING' as const,
          priority: 'MEDIUM' as const,
          title: 'Tax Harvesting Opportunity',
          description: 'Book ₹15,000 LTCG before March 31',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        {
          type: 'GOAL_REVIEW' as const,
          priority: 'LOW' as const,
          title: 'Goal Review: Emergency Fund',
          description: "You're 85% towards your goal",
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
        {
          type: 'KYC_EXPIRY' as const,
          priority: 'LOW' as const,
          title: 'KYC Update Required',
          description: 'Your KYC will expire in 45 days',
          dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        },
      ];

      for (const action of actions) {
        await prisma.userAction.create({
          data: {
            userId: user.id,
            ...action,
          },
        });
      }
      console.log(`  ✓ Created ${actions.length} actions for ${user.email}`);
    }
  }

  console.log('✅ P2/P3 demo data seeded!');
}

async function seedAdvisorProfiles(advisorUserId: string) {
  console.log('\n👔 Seeding advisor profiles...');

  // Check if advisor profile exists
  const existingProfile = await prisma.advisorProfile.findUnique({
    where: { userId: advisorUserId },
  });

  if (!existingProfile) {
    await prisma.advisorProfile.create({
      data: {
        userId: advisorUserId,
        displayName: 'Rahul Sharma, CFP',
        bio: 'Certified Financial Planner with 12+ years of experience in wealth management. Specializing in retirement planning and tax-efficient investing.',
        specializations: ['Retirement Planning', 'Tax Planning', 'ELSS', 'Portfolio Optimization'],
        experienceYears: 12,
        sebiRegNo: 'INH000012345',
        arnNo: 'ARN-123456',
        rating: 4.5,
        totalReviews: 48,
        totalClients: 156,
        aumManaged: 85000000, // 8.5 Cr
        isAcceptingNew: true,
        minInvestment: 100000,
        feeStructure: '0.5% AUM annually',
        city: 'Mumbai',
        languages: ['English', 'Hindi', 'Marathi'],
        isVerified: true,
      },
    });
    console.log('  ✓ Created advisor profile: Rahul Sharma, CFP');
  }

  // Create additional sample advisor profiles
  const additionalAdvisors = [
    {
      email: 'neha.mehta@sparrow-invest.com',
      password: 'Advisor@123',
      name: 'Neha Mehta',
      displayName: 'Neha Mehta, CFA',
      bio: 'CFA charterholder with expertise in equity markets and systematic investing. Focused on helping young professionals build wealth.',
      specializations: ['Equity Investing', 'SIP Planning', 'Goal-based Investing'],
      experienceYears: 8,
      sebiRegNo: 'INH000023456',
      arnNo: 'ARN-234567',
      rating: 4.7,
      totalReviews: 32,
      totalClients: 89,
      aumManaged: 45000000,
      city: 'Bengaluru',
      languages: ['English', 'Hindi', 'Kannada'],
    },
    {
      email: 'arun.kumar@sparrow-invest.com',
      password: 'Advisor@123',
      name: 'Arun Kumar',
      displayName: 'Arun Kumar, MBA Finance',
      bio: 'MBA from IIM-B with 15 years in financial services. Expert in debt markets and conservative wealth management.',
      specializations: ['Debt Funds', 'Fixed Income', 'Capital Preservation', 'Retirement'],
      experienceYears: 15,
      sebiRegNo: 'INH000034567',
      arnNo: 'ARN-345678',
      rating: 4.3,
      totalReviews: 67,
      totalClients: 234,
      aumManaged: 120000000,
      city: 'Delhi',
      languages: ['English', 'Hindi'],
    },
  ];

  for (const advisor of additionalAdvisors) {
    const existingUser = await prisma.user.findUnique({
      where: { email: advisor.email },
    });

    if (!existingUser) {
      const hashedPassword = await bcrypt.hash(advisor.password, 10);
      const user = await prisma.user.create({
        data: {
          email: advisor.email,
          passwordHash: hashedPassword,
          role: 'advisor',
          isActive: true,
          isVerified: true,
          profile: {
            create: {
              name: advisor.name,
              city: advisor.city,
            },
          },
        },
      });

      await prisma.advisorProfile.create({
        data: {
          userId: user.id,
          displayName: advisor.displayName,
          bio: advisor.bio,
          specializations: advisor.specializations,
          experienceYears: advisor.experienceYears,
          sebiRegNo: advisor.sebiRegNo,
          arnNo: advisor.arnNo,
          rating: advisor.rating,
          totalReviews: advisor.totalReviews,
          totalClients: advisor.totalClients,
          aumManaged: advisor.aumManaged,
          isAcceptingNew: true,
          minInvestment: 50000,
          feeStructure: '0.5% AUM annually',
          city: advisor.city,
          languages: advisor.languages,
          isVerified: true,
        },
      });
      console.log(`  ✓ Created advisor: ${advisor.displayName}`);
    }
  }

  console.log('✅ Advisor profiles seeded!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
