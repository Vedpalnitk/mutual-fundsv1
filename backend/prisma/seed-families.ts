import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Sample mutual funds for holdings
const FUNDS = [
  { code: '119551', name: 'Axis Bluechip Fund - Direct Growth', category: 'Large Cap' },
  { code: '120503', name: 'Mirae Asset Large Cap Fund - Direct Growth', category: 'Large Cap' },
  { code: '118834', name: 'HDFC Balanced Advantage Fund - Direct Growth', category: 'Hybrid' },
  { code: '120716', name: 'Parag Parikh Flexi Cap Fund - Direct Growth', category: 'Flexi Cap' },
  { code: '122639', name: 'SBI Small Cap Fund - Direct Growth', category: 'Small Cap' },
  { code: '119598', name: 'ICICI Prudential Technology Fund - Direct Growth', category: 'Sectoral' },
  { code: '118989', name: 'HDFC Mid Cap Opportunities Fund - Direct Growth', category: 'Mid Cap' },
  { code: '120505', name: 'Kotak Emerging Equity Fund - Direct Growth', category: 'Mid Cap' },
  { code: '119028', name: 'SBI Equity Hybrid Fund - Direct Growth', category: 'Hybrid' },
  { code: '118632', name: 'HDFC Flexi Cap Fund - Direct Growth', category: 'Flexi Cap' },
  { code: '120578', name: 'Axis Midcap Fund - Direct Growth', category: 'Mid Cap' },
  { code: '135781', name: 'Nippon India Small Cap Fund - Direct Growth', category: 'Small Cap' },
];

interface HoldingInput {
  fundIndex: number;
  units: number;
  avgNav: number;
  currentNav: number;
  assetClass?: string;
}

async function createHoldings(clientId: string, clientName: string, holdings: HoldingInput[]) {
  for (const h of holdings) {
    const fund = FUNDS[h.fundIndex];
    const folioNumber = `${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    const investedValue = h.units * h.avgNav;
    const currentValue = h.units * h.currentNav;
    const absoluteGain = currentValue - investedValue;
    const absoluteGainPct = ((h.currentNav - h.avgNav) / h.avgNav) * 100;

    await prisma.fAHolding.create({
      data: {
        clientId,
        fundName: fund.name,
        fundSchemeCode: fund.code,
        fundCategory: fund.category,
        assetClass: h.assetClass || 'Equity',
        folioNumber,
        units: h.units,
        avgNav: h.avgNav,
        currentNav: h.currentNav,
        investedValue,
        currentValue,
        absoluteGain,
        absoluteGainPct,
        lastTxnDate: new Date(),
      }
    });
  }
  console.log(`  ✓ ${clientName}: ${holdings.length} holdings created`);
}

async function main() {
  console.log('🏠 Creating Family Trees for Priya Patel and Rajesh Sharma...\n');

  // Hash password for all family member User accounts
  const passwordHash = await bcrypt.hash('Demo@123', 10);

  // Get the advisor
  const advisor = await prisma.user.findFirst({
    where: { email: 'advisor@sparrowinvest.com' }
  });

  if (!advisor) {
    console.log('❌ Advisor not found. Please run db:seed first.');
    return;
  }
  console.log(`✓ Found advisor: ${advisor.email} (ID: ${advisor.id})\n`);

  // Get existing clients
  const priya = await prisma.fAClient.findFirst({
    where: { email: 'priya.patel@email.com' }
  });

  const rajesh = await prisma.fAClient.findFirst({
    where: { email: 'rajesh.sharma@email.com' }
  });

  if (!priya || !rajesh) {
    console.log('❌ Priya or Rajesh not found in database.');
    return;
  }

  // Create family group IDs
  const patelFamilyId = uuidv4();
  const sharmaFamilyId = uuidv4();

  // =====================
  // PATEL FAMILY
  // =====================
  console.log('👨‍👩‍👧‍👦 Creating Patel Family...');

  // Create User account for Priya Patel (family head)
  const priyaUser = await prisma.user.upsert({
    where: { email: 'priya.patel@email.com' },
    update: {},
    create: {
      email: 'priya.patel@email.com',
      phone: priya.phone || '+91 98765 43210',
      passwordHash,
      role: 'investor',
      isActive: true,
      isVerified: true,
      profile: { create: { name: 'Priya Patel', city: 'Ahmedabad' } },
    },
  });

  // Update Priya as family head with userId
  await prisma.fAClient.update({
    where: { id: priya.id },
    data: {
      advisorId: advisor.id,
      familyGroupId: patelFamilyId,
      familyRole: 'SELF',
      familyHeadId: priya.id,
      userId: priyaUser.id,
    }
  });
  console.log(`  ✓ Priya Patel (Head) - updated with User account`);

  // Create User account for Vikram Patel
  const vikramUser = await prisma.user.upsert({
    where: { email: 'vikram.patel@email.com' },
    update: {},
    create: {
      email: 'vikram.patel@email.com',
      phone: '+91 87654 32100',
      passwordHash,
      role: 'investor',
      isActive: true,
      isVerified: true,
      profile: { create: { name: 'Vikram Patel', city: 'Ahmedabad' } },
    },
  });

  // Create Priya's husband
  const vikramPatel = await prisma.fAClient.upsert({
    where: { advisorId_email: { advisorId: advisor.id, email: 'vikram.patel@email.com' } },
    update: { familyGroupId: patelFamilyId, familyRole: 'SPOUSE', familyHeadId: priya.id, userId: vikramUser.id },
    create: {
      advisorId: advisor.id,
      userId: vikramUser.id,
      name: 'Vikram Patel',
      email: 'vikram.patel@email.com',
      phone: '+91 87654 32100',
      pan: 'BVPPV1234K',
      dateOfBirth: new Date('1978-03-15'),
      address: '42, Green Park Society',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '380015',
      riskProfile: 'MODERATE',
      status: 'ACTIVE',
      kycStatus: 'VERIFIED',
      familyGroupId: patelFamilyId,
      familyRole: 'SPOUSE',
      familyHeadId: priya.id,
    }
  });
  console.log(`  ✓ Vikram Patel (Spouse) - ID: ${vikramPatel.id}`);

  // Create User account for Ananya Patel
  const ananyaUser = await prisma.user.upsert({
    where: { email: 'ananya.patel@email.com' },
    update: {},
    create: {
      email: 'ananya.patel@email.com',
      phone: '+91 87654 32101',
      passwordHash,
      role: 'investor',
      isActive: true,
      isVerified: true,
      profile: { create: { name: 'Ananya Patel', city: 'Ahmedabad' } },
    },
  });

  // Create Priya's daughter
  const ananyaPatel = await prisma.fAClient.upsert({
    where: { advisorId_email: { advisorId: advisor.id, email: 'ananya.patel@email.com' } },
    update: { familyGroupId: patelFamilyId, familyRole: 'CHILD', familyHeadId: priya.id, userId: ananyaUser.id },
    create: {
      advisorId: advisor.id,
      userId: ananyaUser.id,
      name: 'Ananya Patel',
      email: 'ananya.patel@email.com',
      phone: '+91 87654 32101',
      pan: 'BVPPA2234L',
      dateOfBirth: new Date('2005-08-22'),
      address: '42, Green Park Society',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '380015',
      riskProfile: 'AGGRESSIVE',
      status: 'ACTIVE',
      kycStatus: 'VERIFIED',
      familyGroupId: patelFamilyId,
      familyRole: 'CHILD',
      familyHeadId: priya.id,
    }
  });
  console.log(`  ✓ Ananya Patel (Daughter) - ID: ${ananyaPatel.id}`);

  // Create User account for Harish Patel
  const harishUser = await prisma.user.upsert({
    where: { email: 'harish.patel@email.com' },
    update: {},
    create: {
      email: 'harish.patel@email.com',
      phone: '+91 87654 32102',
      passwordHash,
      role: 'investor',
      isActive: true,
      isVerified: true,
      profile: { create: { name: 'Harish Patel', city: 'Ahmedabad' } },
    },
  });

  // Create Priya's father
  const harishPatel = await prisma.fAClient.upsert({
    where: { advisorId_email: { advisorId: advisor.id, email: 'harish.patel@email.com' } },
    update: { familyGroupId: patelFamilyId, familyRole: 'PARENT', familyHeadId: priya.id, userId: harishUser.id },
    create: {
      advisorId: advisor.id,
      userId: harishUser.id,
      name: 'Harish Patel',
      email: 'harish.patel@email.com',
      phone: '+91 87654 32102',
      pan: 'BVPPH5234M',
      dateOfBirth: new Date('1952-11-10'),
      address: '42, Green Park Society',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '380015',
      riskProfile: 'CONSERVATIVE',
      status: 'ACTIVE',
      kycStatus: 'VERIFIED',
      familyGroupId: patelFamilyId,
      familyRole: 'PARENT',
      familyHeadId: priya.id,
    }
  });
  console.log(`  ✓ Harish Patel (Father) - ID: ${harishPatel.id}`);

  // =====================
  // SHARMA FAMILY
  // =====================
  console.log('\n👨‍👩‍👧‍👦 Creating Sharma Family...');

  // Create User account for Rajesh Sharma (family head)
  const rajeshUser = await prisma.user.upsert({
    where: { email: 'rajesh.sharma@email.com' },
    update: {},
    create: {
      email: 'rajesh.sharma@email.com',
      phone: rajesh.phone || '+91 98765 43210',
      passwordHash,
      role: 'investor',
      isActive: true,
      isVerified: true,
      profile: { create: { name: 'Rajesh Sharma', city: 'Mumbai' } },
    },
  });

  // Update Rajesh as family head with userId
  await prisma.fAClient.update({
    where: { id: rajesh.id },
    data: {
      advisorId: advisor.id,
      familyGroupId: sharmaFamilyId,
      familyRole: 'SELF',
      familyHeadId: rajesh.id,
      userId: rajeshUser.id,
    }
  });
  console.log(`  ✓ Rajesh Sharma (Head) - updated with User account`);

  // Create User account for Sunita Sharma
  const sunitaUser = await prisma.user.upsert({
    where: { email: 'sunita.sharma@email.com' },
    update: {},
    create: {
      email: 'sunita.sharma@email.com',
      phone: '+91 98765 43211',
      passwordHash,
      role: 'investor',
      isActive: true,
      isVerified: true,
      profile: { create: { name: 'Sunita Sharma', city: 'Mumbai' } },
    },
  });

  // Create Rajesh's wife
  const sunitaSharma = await prisma.fAClient.upsert({
    where: { advisorId_email: { advisorId: advisor.id, email: 'sunita.sharma@email.com' } },
    update: { familyGroupId: sharmaFamilyId, familyRole: 'SPOUSE', familyHeadId: rajesh.id, userId: sunitaUser.id },
    create: {
      advisorId: advisor.id,
      userId: sunitaUser.id,
      name: 'Sunita Sharma',
      email: 'sunita.sharma@email.com',
      phone: '+91 98765 43211',
      pan: 'BVSPS3456N',
      dateOfBirth: new Date('1985-06-20'),
      address: '15, Vasant Kunj',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400053',
      riskProfile: 'MODERATE',
      status: 'ACTIVE',
      kycStatus: 'VERIFIED',
      familyGroupId: sharmaFamilyId,
      familyRole: 'SPOUSE',
      familyHeadId: rajesh.id,
    }
  });
  console.log(`  ✓ Sunita Sharma (Wife) - ID: ${sunitaSharma.id}`);

  // Create User account for Arjun Sharma
  const arjunUser = await prisma.user.upsert({
    where: { email: 'arjun.sharma@email.com' },
    update: {},
    create: {
      email: 'arjun.sharma@email.com',
      phone: '+91 98765 43212',
      passwordHash,
      role: 'investor',
      isActive: true,
      isVerified: true,
      profile: { create: { name: 'Arjun Sharma', city: 'Mumbai' } },
    },
  });

  // Create Rajesh's son
  const arjunSharma = await prisma.fAClient.upsert({
    where: { advisorId_email: { advisorId: advisor.id, email: 'arjun.sharma@email.com' } },
    update: { familyGroupId: sharmaFamilyId, familyRole: 'CHILD', familyHeadId: rajesh.id, userId: arjunUser.id },
    create: {
      advisorId: advisor.id,
      userId: arjunUser.id,
      name: 'Arjun Sharma',
      email: 'arjun.sharma@email.com',
      phone: '+91 98765 43212',
      pan: 'BVSPA4567O',
      dateOfBirth: new Date('2010-02-14'),
      address: '15, Vasant Kunj',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400053',
      riskProfile: 'AGGRESSIVE',
      status: 'ACTIVE',
      kycStatus: 'VERIFIED',
      familyGroupId: sharmaFamilyId,
      familyRole: 'CHILD',
      familyHeadId: rajesh.id,
    }
  });
  console.log(`  ✓ Arjun Sharma (Son) - ID: ${arjunSharma.id}`);

  // Create User account for Kamla Devi Sharma
  const kamlaUser = await prisma.user.upsert({
    where: { email: 'kamla.sharma@email.com' },
    update: {},
    create: {
      email: 'kamla.sharma@email.com',
      phone: '+91 98765 43213',
      passwordHash,
      role: 'investor',
      isActive: true,
      isVerified: true,
      profile: { create: { name: 'Kamla Devi Sharma', city: 'Mumbai' } },
    },
  });

  // Create Rajesh's mother
  const kamlaDeviSharma = await prisma.fAClient.upsert({
    where: { advisorId_email: { advisorId: advisor.id, email: 'kamla.sharma@email.com' } },
    update: { familyGroupId: sharmaFamilyId, familyRole: 'PARENT', familyHeadId: rajesh.id, userId: kamlaUser.id },
    create: {
      advisorId: advisor.id,
      userId: kamlaUser.id,
      name: 'Kamla Devi Sharma',
      email: 'kamla.sharma@email.com',
      phone: '+91 98765 43213',
      pan: 'BVSDK5678P',
      dateOfBirth: new Date('1955-04-05'),
      address: '15, Vasant Kunj',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400053',
      riskProfile: 'CONSERVATIVE',
      status: 'ACTIVE',
      kycStatus: 'VERIFIED',
      familyGroupId: sharmaFamilyId,
      familyRole: 'PARENT',
      familyHeadId: rajesh.id,
    }
  });
  console.log(`  ✓ Kamla Devi Sharma (Mother) - ID: ${kamlaDeviSharma.id}`);

  // =====================
  // CREATE HOLDINGS
  // =====================
  console.log('\n💰 Creating Holdings for Family Members...\n');

  // Vikram Patel - Moderate investor
  await createHoldings(vikramPatel.id, 'Vikram Patel', [
    { fundIndex: 0, units: 500, avgNav: 45.5, currentNav: 52.3 },
    { fundIndex: 2, units: 800, avgNav: 320.5, currentNav: 385.2 },
    { fundIndex: 3, units: 300, avgNav: 55.8, currentNav: 68.4 },
    { fundIndex: 8, units: 600, avgNav: 185.2, currentNav: 210.5 },
  ]);

  // Ananya Patel - Aggressive investor (child)
  await createHoldings(ananyaPatel.id, 'Ananya Patel', [
    { fundIndex: 4, units: 200, avgNav: 125.3, currentNav: 165.8 },
    { fundIndex: 5, units: 150, avgNav: 145.2, currentNav: 178.5 },
    { fundIndex: 11, units: 250, avgNav: 95.6, currentNav: 132.4 },
  ]);

  // Harish Patel - Conservative investor (father)
  await createHoldings(harishPatel.id, 'Harish Patel', [
    { fundIndex: 0, units: 1000, avgNav: 42.1, currentNav: 52.3, assetClass: 'Equity' },
    { fundIndex: 2, units: 1500, avgNav: 285.4, currentNav: 385.2, assetClass: 'Hybrid' },
    { fundIndex: 8, units: 800, avgNav: 165.8, currentNav: 210.5, assetClass: 'Hybrid' },
  ]);

  // Sunita Sharma - Moderate investor
  await createHoldings(sunitaSharma.id, 'Sunita Sharma', [
    { fundIndex: 1, units: 400, avgNav: 85.2, currentNav: 98.6 },
    { fundIndex: 3, units: 350, avgNav: 48.5, currentNav: 68.4 },
    { fundIndex: 6, units: 280, avgNav: 145.8, currentNav: 175.2 },
    { fundIndex: 9, units: 500, avgNav: 1250.5, currentNav: 1485.3 },
  ]);

  // Arjun Sharma - Child fund for education
  await createHoldings(arjunSharma.id, 'Arjun Sharma', [
    { fundIndex: 4, units: 180, avgNav: 110.5, currentNav: 165.8 },
    { fundIndex: 7, units: 220, avgNav: 72.3, currentNav: 95.6 },
    { fundIndex: 10, units: 150, avgNav: 68.9, currentNav: 85.4 },
  ]);

  // Kamla Devi Sharma - Conservative
  await createHoldings(kamlaDeviSharma.id, 'Kamla Devi Sharma', [
    { fundIndex: 2, units: 600, avgNav: 295.8, currentNav: 385.2, assetClass: 'Hybrid' },
    { fundIndex: 8, units: 700, avgNav: 175.5, currentNav: 210.5, assetClass: 'Hybrid' },
  ]);

  // =====================
  // SUMMARY
  // =====================
  console.log('\n' + '='.repeat(70));
  console.log('📊 FAMILY SUMMARY');
  console.log('='.repeat(70));

  // Patel Family
  const patelMembers = await prisma.fAClient.findMany({
    where: { familyGroupId: patelFamilyId },
    include: { _count: { select: { holdings: true } } }
  });
  console.log(`\n🏠 PATEL FAMILY (Group: ${patelFamilyId})`);
  console.log('-'.repeat(70));
  patelMembers.forEach(m => {
    console.log(`  ${(m.familyRole || '').padEnd(8)} | ${m.name.padEnd(20)} | ${m.riskProfile.padEnd(12)} | ${m._count.holdings} holdings`);
  });

  // Sharma Family
  const sharmaMembers = await prisma.fAClient.findMany({
    where: { familyGroupId: sharmaFamilyId },
    include: { _count: { select: { holdings: true } } }
  });
  console.log(`\n🏠 SHARMA FAMILY (Group: ${sharmaFamilyId})`);
  console.log('-'.repeat(70));
  sharmaMembers.forEach(m => {
    console.log(`  ${(m.familyRole || '').padEnd(8)} | ${m.name.padEnd(20)} | ${m.riskProfile.padEnd(12)} | ${m._count.holdings} holdings`);
  });

  console.log('\n✅ Family trees created successfully!');
  console.log(`   All clients mapped to advisor: ${advisor.email}\n`);

  await prisma.$disconnect();
}

main().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
