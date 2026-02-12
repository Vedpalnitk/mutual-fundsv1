import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Sample mutual funds for holdings
const FUNDS = [
  { code: '119551', name: 'ICICI Pru Value Discovery Fund - Direct Growth', category: 'Value Fund', assetClass: 'Equity' },
  { code: '120503', name: 'Axis Bluechip Fund - Direct Growth', category: 'Large Cap', assetClass: 'Equity' },
  { code: '118834', name: 'HDFC Balanced Advantage Fund - Direct Growth', category: 'Balanced Advantage', assetClass: 'Hybrid' },
  { code: '120716', name: 'Parag Parikh Flexi Cap Fund - Direct Growth', category: 'Flexi Cap', assetClass: 'Equity' },
  { code: '122639', name: 'SBI Small Cap Fund - Direct Growth', category: 'Small Cap', assetClass: 'Equity' },
  { code: '119598', name: 'Mirae Asset Large Cap Fund - Direct Growth', category: 'Large Cap', assetClass: 'Equity' },
  { code: '118989', name: 'HDFC Mid Cap Opportunities Fund - Direct Growth', category: 'Mid Cap', assetClass: 'Equity' },
  { code: '120505', name: 'Kotak Emerging Equity Fund - Direct Growth', category: 'Mid Cap', assetClass: 'Equity' },
  { code: '119028', name: 'SBI Equity Hybrid Fund - Direct Growth', category: 'Hybrid', assetClass: 'Hybrid' },
  { code: '118632', name: 'HDFC Flexi Cap Fund - Direct Growth', category: 'Flexi Cap', assetClass: 'Equity' },
  { code: '119237', name: 'ICICI Pru Corporate Bond Fund - Direct Growth', category: 'Corporate Bond', assetClass: 'Debt' },
  { code: '120841', name: 'SBI Liquid Fund - Direct Growth', category: 'Liquid', assetClass: 'Debt' },
];

// New Financial Advisors
const NEW_ADVISORS = [
  { name: 'Priya Sharma', email: 'priya.sharma@sparrowinvest.com', city: 'Mumbai', phone: '+91 98765 11111' },
  { name: 'Arun Mehta', email: 'arun.mehta@sparrowinvest.com', city: 'Delhi', phone: '+91 98765 22222' },
  { name: 'Kavitha Nair', email: 'kavitha.nair@sparrowinvest.com', city: 'Bengaluru', phone: '+91 98765 33333' },
  { name: 'Sanjay Gupta', email: 'sanjay.gupta@sparrowinvest.com', city: 'Chennai', phone: '+91 98765 44444' },
  { name: 'Neha Deshmukh', email: 'neha.deshmukh@sparrowinvest.com', city: 'Pune', phone: '+91 98765 55555' },
];

// Self-assisted clients (will be assigned to a platform advisor)
const SELF_ASSISTED_CLIENTS = [
  { name: 'Rohit Bansal', email: 'rohit.bansal@demo.com', phone: '+91 87654 11111', city: 'Gurugram', state: 'Haryana', risk: 'AGGRESSIVE', age: 28 },
  { name: 'Megha Kulkarni', email: 'megha.kulkarni@demo.com', phone: '+91 87654 22222', city: 'Pune', state: 'Maharashtra', risk: 'MODERATE', age: 35 },
  { name: 'Varun Kapoor', email: 'varun.kapoor@demo.com', phone: '+91 87654 33333', city: 'Noida', state: 'Uttar Pradesh', risk: 'AGGRESSIVE', age: 31 },
  { name: 'Shreya Menon', email: 'shreya.menon@demo.com', phone: '+91 87654 44444', city: 'Kochi', state: 'Kerala', risk: 'CONSERVATIVE', age: 45 },
  { name: 'Akash Jain', email: 'akash.jain@demo.com', phone: '+91 87654 55555', city: 'Jaipur', state: 'Rajasthan', risk: 'MODERATE', age: 38 },
  { name: 'Pooja Reddy', email: 'pooja.reddy@demo.com', phone: '+91 87654 66666', city: 'Hyderabad', state: 'Telangana', risk: 'AGGRESSIVE', age: 29 },
  { name: 'Nikhil Agarwal', email: 'nikhil.agarwal@demo.com', phone: '+91 87654 77777', city: 'Kolkata', state: 'West Bengal', risk: 'MODERATE', age: 42 },
  { name: 'Tanvi Saxena', email: 'tanvi.saxena@demo.com', phone: '+91 87654 88888', city: 'Lucknow', state: 'Uttar Pradesh', risk: 'CONSERVATIVE', age: 52 },
  { name: 'Arjun Malhotra', email: 'arjun.malhotra@demo.com', phone: '+91 87654 99999', city: 'Chandigarh', state: 'Punjab', risk: 'AGGRESSIVE', age: 26 },
  { name: 'Divya Chatterjee', email: 'divya.chatterjee@demo.com', phone: '+91 87655 11111', city: 'Kolkata', state: 'West Bengal', risk: 'MODERATE', age: 33 },
];

// Clients for each new advisor
const ADVISOR_CLIENTS: Record<string, Array<{ name: string; email: string; phone: string; city: string; state: string; risk: string; age: number }>> = {
  'priya.sharma@sparrowinvest.com': [
    { name: 'Ramesh Iyer', email: 'ramesh.iyer@email.com', phone: '+91 76543 11111', city: 'Mumbai', state: 'Maharashtra', risk: 'MODERATE', age: 48 },
    { name: 'Lakshmi Venkat', email: 'lakshmi.venkat@email.com', phone: '+91 76543 22222', city: 'Mumbai', state: 'Maharashtra', risk: 'CONSERVATIVE', age: 55 },
    { name: 'Deepak Shah', email: 'deepak.shah@email.com', phone: '+91 76543 33333', city: 'Thane', state: 'Maharashtra', risk: 'AGGRESSIVE', age: 34 },
  ],
  'arun.mehta@sparrowinvest.com': [
    { name: 'Suresh Yadav', email: 'suresh.yadav@email.com', phone: '+91 76543 44444', city: 'Delhi', state: 'Delhi', risk: 'MODERATE', age: 41 },
    { name: 'Geeta Rastogi', email: 'geeta.rastogi@email.com', phone: '+91 76543 55555', city: 'Ghaziabad', state: 'Uttar Pradesh', risk: 'CONSERVATIVE', age: 58 },
    { name: 'Mohit Arora', email: 'mohit.arora@email.com', phone: '+91 76543 66666', city: 'Noida', state: 'Uttar Pradesh', risk: 'AGGRESSIVE', age: 29 },
    { name: 'Anita Bhardwaj', email: 'anita.bhardwaj@email.com', phone: '+91 76543 77777', city: 'Faridabad', state: 'Haryana', risk: 'MODERATE', age: 36 },
  ],
  'kavitha.nair@sparrowinvest.com': [
    { name: 'Ravi Kumar', email: 'ravi.kumar@email.com', phone: '+91 76543 88888', city: 'Bengaluru', state: 'Karnataka', risk: 'AGGRESSIVE', age: 32 },
    { name: 'Suma Rao', email: 'suma.rao@email.com', phone: '+91 76543 99999', city: 'Bengaluru', state: 'Karnataka', risk: 'MODERATE', age: 44 },
    { name: 'Vinay Gowda', email: 'vinay.gowda@email.com', phone: '+91 76544 11111', city: 'Mysuru', state: 'Karnataka', risk: 'CONSERVATIVE', age: 61 },
  ],
  'sanjay.gupta@sparrowinvest.com': [
    { name: 'Balaji Krishnan', email: 'balaji.krishnan@email.com', phone: '+91 76544 22222', city: 'Chennai', state: 'Tamil Nadu', risk: 'MODERATE', age: 39 },
    { name: 'Meenakshi Sundaram', email: 'meenakshi.s@email.com', phone: '+91 76544 33333', city: 'Chennai', state: 'Tamil Nadu', risk: 'CONSERVATIVE', age: 52 },
  ],
  'neha.deshmukh@sparrowinvest.com': [
    { name: 'Prasad Kulkarni', email: 'prasad.kulkarni@email.com', phone: '+91 76544 44444', city: 'Pune', state: 'Maharashtra', risk: 'AGGRESSIVE', age: 27 },
    { name: 'Swati Patil', email: 'swati.patil@email.com', phone: '+91 76544 55555', city: 'Pune', state: 'Maharashtra', risk: 'MODERATE', age: 38 },
    { name: 'Ajay Deshpande', email: 'ajay.deshpande@email.com', phone: '+91 76544 66666', city: 'Nashik', state: 'Maharashtra', risk: 'CONSERVATIVE', age: 47 },
  ],
};

async function createHoldings(clientId: string, riskProfile: string) {
  // Determine number of holdings based on risk profile
  const holdingsCount = riskProfile === 'AGGRESSIVE' ? 6 : riskProfile === 'MODERATE' ? 5 : 4;

  // Select appropriate funds based on risk profile
  let fundIndices: number[];
  if (riskProfile === 'AGGRESSIVE') {
    fundIndices = [0, 3, 4, 6, 7, 9]; // More equity focused
  } else if (riskProfile === 'MODERATE') {
    fundIndices = [1, 2, 3, 5, 8]; // Balanced
  } else {
    fundIndices = [1, 2, 10, 11]; // More debt focused
  }

  const usedFunds = new Set<number>();
  for (let i = 0; i < Math.min(holdingsCount, fundIndices.length); i++) {
    const fundIndex = fundIndices[i];
    if (usedFunds.has(fundIndex)) continue;
    usedFunds.add(fundIndex);

    const fund = FUNDS[fundIndex];
    const units = 100 + Math.floor(Math.random() * 900);
    const avgNav = 30 + Math.random() * 100;
    const currentNav = avgNav * (0.9 + Math.random() * 0.3); // -10% to +20% change
    const investedValue = units * avgNav;
    const currentValue = units * currentNav;

    await prisma.fAHolding.create({
      data: {
        clientId,
        fundName: fund.name,
        fundSchemeCode: fund.code,
        fundCategory: fund.category,
        assetClass: fund.assetClass,
        folioNumber: `${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        units,
        avgNav,
        currentNav,
        investedValue,
        currentValue,
        absoluteGain: currentValue - investedValue,
        absoluteGainPct: ((currentNav - avgNav) / avgNav) * 100,
        xirr: 8 + Math.random() * 18,
        lastTxnDate: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000),
      }
    });
  }
}

async function createSIPs(clientId: string, riskProfile: string) {
  const sipCount = riskProfile === 'AGGRESSIVE' ? 3 : riskProfile === 'MODERATE' ? 2 : 1;

  const fundIndices = riskProfile === 'AGGRESSIVE' ? [3, 4, 6] : riskProfile === 'MODERATE' ? [1, 3] : [2];

  for (let i = 0; i < sipCount; i++) {
    const fund = FUNDS[fundIndices[i]];
    const amount = [5000, 10000, 15000, 20000, 25000][Math.floor(Math.random() * 5)];
    const sipDate = [1, 5, 10, 15, 20][Math.floor(Math.random() * 5)];
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - Math.floor(Math.random() * 12) - 1);

    const completedInstallments = Math.floor((Date.now() - startDate.getTime()) / (30 * 24 * 60 * 60 * 1000));
    const totalInvested = completedInstallments * amount;
    const returns = totalInvested * (0.08 + Math.random() * 0.12);

    const nextSipDate = new Date();
    if (nextSipDate.getDate() >= sipDate) {
      nextSipDate.setMonth(nextSipDate.getMonth() + 1);
    }
    nextSipDate.setDate(sipDate);

    await prisma.fASIP.create({
      data: {
        clientId,
        fundName: fund.name,
        fundSchemeCode: fund.code,
        folioNumber: `${Math.floor(1000000000 + Math.random() * 9000000000)}`,
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
        returnsPct: (returns / totalInvested) * 100,
        nextSipDate,
        lastSipDate: completedInstallments > 0 ? new Date(Date.now() - 25 * 24 * 60 * 60 * 1000) : null,
      }
    });
  }
}

async function main() {
  console.log('🚀 Creating additional Financial Advisors and Self-Assisted Clients...\n');

  const advisorPassword = await bcrypt.hash('Advisor@123', 10);

  // =====================
  // CREATE NEW ADVISORS
  // =====================
  console.log('👔 Creating Financial Advisors...');

  const createdAdvisors: Record<string, string> = {};

  for (const advisor of NEW_ADVISORS) {
    const user = await prisma.user.upsert({
      where: { email: advisor.email },
      update: {},
      create: {
        email: advisor.email,
        passwordHash: advisorPassword,
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
    createdAdvisors[advisor.email] = user.id;
    console.log(`  ✓ ${advisor.name} (${advisor.email})`);
  }

  // =====================
  // CREATE CLIENTS FOR NEW ADVISORS
  // =====================
  console.log('\n👥 Creating Clients for each Advisor...');

  for (const [advisorEmail, clients] of Object.entries(ADVISOR_CLIENTS)) {
    const advisorId = createdAdvisors[advisorEmail];
    if (!advisorId) continue;

    console.log(`\n  📋 ${advisorEmail}:`);

    for (const clientData of clients) {
      const existing = await prisma.fAClient.findFirst({
        where: { advisorId, email: clientData.email },
      });

      if (existing) {
        console.log(`    ⏭ ${clientData.name} (already exists)`);
        continue;
      }

      const client = await prisma.fAClient.create({
        data: {
          advisorId,
          name: clientData.name,
          email: clientData.email,
          phone: clientData.phone,
          city: clientData.city,
          state: clientData.state,
          riskProfile: clientData.risk as any,
          status: 'ACTIVE',
          kycStatus: 'VERIFIED',
          dateOfBirth: new Date(new Date().getFullYear() - clientData.age, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          lastActiveAt: new Date(Date.now() - Math.floor(Math.random() * 14) * 24 * 60 * 60 * 1000),
        },
      });

      await createHoldings(client.id, clientData.risk);
      await createSIPs(client.id, clientData.risk);

      console.log(`    ✓ ${clientData.name} (${clientData.risk})`);
    }
  }

  // =====================
  // CREATE SELF-ASSISTED PLATFORM ADVISOR
  // =====================
  console.log('\n🤖 Creating Self-Service Platform Advisor...');

  const selfServiceAdvisor = await prisma.user.upsert({
    where: { email: 'self-service@sparrowinvest.com' },
    update: {},
    create: {
      email: 'self-service@sparrowinvest.com',
      passwordHash: await bcrypt.hash('SelfService@123', 10),
      role: 'advisor',
      isActive: true,
      isVerified: true,
      profile: {
        create: {
          name: 'Self-Service Platform',
          city: 'Mumbai',
        },
      },
    },
  });
  console.log(`  ✓ Self-Service Platform Advisor created`);

  // =====================
  // CREATE SELF-ASSISTED CLIENTS
  // =====================
  console.log('\n🙋 Creating Self-Assisted Clients...');

  for (const clientData of SELF_ASSISTED_CLIENTS) {
    const existing = await prisma.fAClient.findFirst({
      where: { advisorId: selfServiceAdvisor.id, email: clientData.email },
    });

    if (existing) {
      console.log(`  ⏭ ${clientData.name} (already exists)`);
      continue;
    }

    // Also create a User account for self-assisted clients so they can log in
    const userPassword = await bcrypt.hash('Demo@123', 10);
    const user = await prisma.user.upsert({
      where: { email: clientData.email },
      update: {},
      create: {
        email: clientData.email,
        phone: clientData.phone,
        passwordHash: userPassword,
        role: 'investor',
        isActive: true,
        isVerified: true,
        profile: {
          create: {
            name: clientData.name,
            city: clientData.city,
            age: clientData.age,
            riskTolerance: clientData.risk === 'AGGRESSIVE' ? 'High' : clientData.risk === 'MODERATE' ? 'Medium' : 'Low',
          },
        },
      },
    });

    const client = await prisma.fAClient.create({
      data: {
        advisorId: selfServiceAdvisor.id,
        userId: user.id, // Link to their User account
        name: clientData.name,
        email: clientData.email,
        phone: clientData.phone,
        city: clientData.city,
        state: clientData.state,
        riskProfile: clientData.risk as any,
        status: 'ACTIVE',
        kycStatus: 'VERIFIED',
        dateOfBirth: new Date(new Date().getFullYear() - clientData.age, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        lastActiveAt: new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000),
      },
    });

    await createHoldings(client.id, clientData.risk);
    await createSIPs(client.id, clientData.risk);

    console.log(`  ✓ ${clientData.name} (${clientData.risk}) - Self-Assisted`);
  }

  // =====================
  // SUMMARY
  // =====================
  console.log('\n' + '='.repeat(70));
  console.log('📊 SUMMARY');
  console.log('='.repeat(70));

  // =====================
  // CREATE DEMO STAFF MEMBER
  // =====================
  console.log('\n👤 Creating demo Staff Member...');

  const priyaAdvisorId = createdAdvisors['priya.sharma@sparrowinvest.com'];
  if (priyaAdvisorId) {
    const staffPassword = await bcrypt.hash('Staff@123', 10);
    const staffUser = await prisma.user.upsert({
      where: { email: 'neha.staff@sparrowinvest.com' },
      update: {},
      create: {
        email: 'neha.staff@sparrowinvest.com',
        passwordHash: staffPassword,
        role: 'fa_staff',
        isActive: true,
        isVerified: true,
        profile: {
          create: {
            name: 'Neha Staff',
            city: 'Mumbai',
          },
        },
      },
    });

    await prisma.fAStaffMember.upsert({
      where: { staffUserId: staffUser.id },
      update: {},
      create: {
        ownerId: priyaAdvisorId,
        staffUserId: staffUser.id,
        displayName: 'Neha Sharma',
        allowedPages: ['/advisor/dashboard', '/advisor/clients', '/advisor/transactions', '/advisor/funds'],
        isActive: true,
      },
    });

    console.log(`  ✓ Neha Sharma (neha.staff@sparrowinvest.com) → Staff for Priya Sharma`);
    console.log(`    Allowed pages: Dashboard, Clients, Transactions, Funds`);
  }

  const totalAdvisors = await prisma.user.count({ where: { role: 'advisor' } });
  const totalClients = await prisma.fAClient.count();
  const selfAssistedClients = await prisma.fAClient.count({ where: { advisorId: selfServiceAdvisor.id } });
  const totalHoldings = await prisma.fAHolding.count();
  const totalSIPs = await prisma.fASIP.count();

  console.log(`\n  Total Advisors:         ${totalAdvisors}`);
  console.log(`  Total Clients:          ${totalClients}`);
  console.log(`  Self-Assisted Clients:  ${selfAssistedClients}`);
  console.log(`  Total Holdings:         ${totalHoldings}`);
  console.log(`  Total Active SIPs:      ${totalSIPs}`);

  console.log('\n📋 ADVISOR BREAKDOWN:');
  console.log('-'.repeat(70));

  const advisors = await prisma.user.findMany({
    where: { role: 'advisor' },
    include: {
      profile: true,
      advisorClients: { select: { id: true } }
    }
  });

  for (const advisor of advisors) {
    const clientCount = advisor.advisorClients.length;
    const name = advisor.profile?.name || advisor.email;
    console.log(`  ${name.padEnd(30)} | ${clientCount} clients`);
  }

  console.log('\n✅ Seeding completed successfully!');
  console.log('\n📝 Login credentials:');
  console.log('   Advisors: [email]@sparrowinvest.com / Advisor@123');
  console.log('   Staff:    neha.staff@sparrowinvest.com / Staff@123');
  console.log('   Self-assisted clients: [email]@demo.com / Demo@123\n');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ Error:', e);
  process.exit(1);
});
