interface TemplateContext {
  advisorName?: string;
  clientName?: string;
  // Portfolio
  totalValue?: number;
  totalInvested?: number;
  totalReturns?: number;
  returnsPercent?: number;
  holdingsCount?: number;
  // SIP
  sipFundName?: string;
  sipAmount?: number;
  sipDate?: number;
  sipNextDate?: string;
  sipFailureReason?: string;
  // Goal
  goalName?: string;
  goalProgress?: number;
  goalTarget?: number;
  goalCurrent?: number;
  goalTargetDate?: string;
  // Transaction
  txnFundName?: string;
  txnType?: string;
  txnAmount?: number;
  txnDate?: string;
  txnStatus?: string;
  // Report
  reportTitle?: string;
  reportPeriod?: string;
  // Custom
  customSubject?: string;
  customBody?: string;
}

interface CommunicationTemplate {
  type: string;
  label: string;
  description: string;
  emailSubject: (ctx: TemplateContext) => string;
  emailBody: (ctx: TemplateContext) => string;
  whatsappBody: (ctx: TemplateContext) => string;
}

const formatCurrency = (amount?: number): string => {
  if (!amount) return '₹0';
  return `₹${amount.toLocaleString('en-IN')}`;
};

export const COMMUNICATION_TEMPLATES: CommunicationTemplate[] = [
  {
    type: 'PORTFOLIO_SUMMARY',
    label: 'Portfolio Summary',
    description: 'Share portfolio performance overview with client',
    emailSubject: (ctx) => `Your Portfolio Update - ${new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}`,
    emailBody: (ctx) => `
      <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3B82F6;">Portfolio Update</h2>
        <p>Dear ${ctx.clientName || 'Client'},</p>
        <p>Here's your portfolio summary:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr style="background: #F1F5F9;">
            <td style="padding: 12px; font-weight: 600;">Total Value</td>
            <td style="padding: 12px; text-align: right; font-weight: 700; color: #3B82F6;">${formatCurrency(ctx.totalValue)}</td>
          </tr>
          <tr>
            <td style="padding: 12px;">Invested</td>
            <td style="padding: 12px; text-align: right;">${formatCurrency(ctx.totalInvested)}</td>
          </tr>
          <tr style="background: #F1F5F9;">
            <td style="padding: 12px;">Returns</td>
            <td style="padding: 12px; text-align: right; color: ${(ctx.totalReturns || 0) >= 0 ? '#10B981' : '#EF4444'};">${formatCurrency(ctx.totalReturns)} (${ctx.returnsPercent?.toFixed(2) || '0'}%)</td>
          </tr>
          <tr>
            <td style="padding: 12px;">Holdings</td>
            <td style="padding: 12px; text-align: right;">${ctx.holdingsCount || 0} funds</td>
          </tr>
        </table>
        <p>For any questions, feel free to reach out.</p>
        <p>Best regards,<br/>${ctx.advisorName || 'Your Financial Advisor'}<br/>Sparrow Invest</p>
      </div>
    `,
    whatsappBody: (ctx) =>
      `📊 *Portfolio Update*\n\nDear ${ctx.clientName || 'Client'},\n\nHere's your portfolio summary:\n\n💰 Total Value: ${formatCurrency(ctx.totalValue)}\n📈 Invested: ${formatCurrency(ctx.totalInvested)}\n${(ctx.totalReturns || 0) >= 0 ? '✅' : '🔻'} Returns: ${formatCurrency(ctx.totalReturns)} (${ctx.returnsPercent?.toFixed(2) || '0'}%)\n📋 Holdings: ${ctx.holdingsCount || 0} funds\n\nFor details, please check the Sparrow Invest app.\n\nRegards,\n${ctx.advisorName || 'Your Financial Advisor'}`,
  },
  {
    type: 'SIP_FAILURE_ALERT',
    label: 'SIP Failure Alert',
    description: 'Alert client about a failed SIP payment',
    emailSubject: (ctx) => `Action Required: SIP Payment Failed - ${ctx.sipFundName || 'Fund'}`,
    emailBody: (ctx) => `
      <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #EF4444;">⚠️ SIP Payment Failed</h2>
        <p>Dear ${ctx.clientName || 'Client'},</p>
        <p>We noticed that your SIP payment did not go through. Here are the details:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr style="background: #FEF2F2;"><td style="padding: 12px; font-weight: 600;">Fund</td><td style="padding: 12px; text-align: right;">${ctx.sipFundName || 'N/A'}</td></tr>
          <tr><td style="padding: 12px;">Amount</td><td style="padding: 12px; text-align: right;">${formatCurrency(ctx.sipAmount)}</td></tr>
          <tr style="background: #FEF2F2;"><td style="padding: 12px;">SIP Date</td><td style="padding: 12px; text-align: right;">${ctx.sipDate || 'N/A'}th of every month</td></tr>
        </table>
        <p><strong>What you can do:</strong></p>
        <ul>
          <li>Ensure sufficient balance in your bank account</li>
          <li>Check if your mandate/auto-debit is active</li>
          <li>Contact us for assistance</li>
        </ul>
        <p>Best regards,<br/>${ctx.advisorName || 'Your Financial Advisor'}<br/>Sparrow Invest</p>
      </div>
    `,
    whatsappBody: (ctx) =>
      `⚠️ *SIP Payment Failed*\n\nDear ${ctx.clientName || 'Client'},\n\nYour SIP payment could not be processed:\n\n📋 Fund: ${ctx.sipFundName || 'N/A'}\n💰 Amount: ${formatCurrency(ctx.sipAmount)}\n📅 SIP Date: ${ctx.sipDate || 'N/A'}th\n\nPlease ensure sufficient balance in your account and check your mandate status.\n\nContact us if you need help.\n\nRegards,\n${ctx.advisorName || 'Your Financial Advisor'}`,
  },
  {
    type: 'SIP_PAYMENT_REMINDER',
    label: 'SIP Payment Reminder',
    description: 'Remind client about upcoming SIP payment',
    emailSubject: (ctx) => `Upcoming SIP Payment - ${ctx.sipFundName || 'Fund'}`,
    emailBody: (ctx) => `
      <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3B82F6;">📅 SIP Payment Reminder</h2>
        <p>Dear ${ctx.clientName || 'Client'},</p>
        <p>This is a reminder that your upcoming SIP payment is scheduled:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr style="background: #F1F5F9;"><td style="padding: 12px; font-weight: 600;">Fund</td><td style="padding: 12px; text-align: right;">${ctx.sipFundName || 'N/A'}</td></tr>
          <tr><td style="padding: 12px;">Amount</td><td style="padding: 12px; text-align: right;">${formatCurrency(ctx.sipAmount)}</td></tr>
          <tr style="background: #F1F5F9;"><td style="padding: 12px;">Next Date</td><td style="padding: 12px; text-align: right;">${ctx.sipNextDate || 'N/A'}</td></tr>
        </table>
        <p>Please ensure sufficient balance in your bank account.</p>
        <p>Best regards,<br/>${ctx.advisorName || 'Your Financial Advisor'}<br/>Sparrow Invest</p>
      </div>
    `,
    whatsappBody: (ctx) =>
      `📅 *SIP Payment Reminder*\n\nDear ${ctx.clientName || 'Client'},\n\nYour SIP payment is coming up:\n\n📋 Fund: ${ctx.sipFundName || 'N/A'}\n💰 Amount: ${formatCurrency(ctx.sipAmount)}\n📅 Date: ${ctx.sipNextDate || 'N/A'}\n\nPlease ensure sufficient balance in your account.\n\nRegards,\n${ctx.advisorName || 'Your Financial Advisor'}`,
  },
  {
    type: 'GOAL_PROGRESS_UPDATE',
    label: 'Goal Progress Update',
    description: 'Share goal tracking progress with client',
    emailSubject: (ctx) => `Goal Update: ${ctx.goalName || 'Your Goal'} - ${ctx.goalProgress?.toFixed(0) || '0'}% Complete`,
    emailBody: (ctx) => `
      <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3B82F6;">🎯 Goal Progress Update</h2>
        <p>Dear ${ctx.clientName || 'Client'},</p>
        <p>Here's the latest update on your financial goal:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr style="background: #F1F5F9;"><td style="padding: 12px; font-weight: 600;">Goal</td><td style="padding: 12px; text-align: right;">${ctx.goalName || 'N/A'}</td></tr>
          <tr><td style="padding: 12px;">Target</td><td style="padding: 12px; text-align: right;">${formatCurrency(ctx.goalTarget)}</td></tr>
          <tr style="background: #F1F5F9;"><td style="padding: 12px;">Current</td><td style="padding: 12px; text-align: right;">${formatCurrency(ctx.goalCurrent)}</td></tr>
          <tr><td style="padding: 12px;">Progress</td><td style="padding: 12px; text-align: right; color: #3B82F6; font-weight: 700;">${ctx.goalProgress?.toFixed(1) || '0'}%</td></tr>
          <tr style="background: #F1F5F9;"><td style="padding: 12px;">Target Date</td><td style="padding: 12px; text-align: right;">${ctx.goalTargetDate || 'N/A'}</td></tr>
        </table>
        <p>Keep up the great work! We're here to help you reach your goals.</p>
        <p>Best regards,<br/>${ctx.advisorName || 'Your Financial Advisor'}<br/>Sparrow Invest</p>
      </div>
    `,
    whatsappBody: (ctx) =>
      `🎯 *Goal Progress Update*\n\nDear ${ctx.clientName || 'Client'},\n\n*${ctx.goalName || 'Your Goal'}*\n\n🎯 Target: ${formatCurrency(ctx.goalTarget)}\n💰 Current: ${formatCurrency(ctx.goalCurrent)}\n📊 Progress: ${ctx.goalProgress?.toFixed(1) || '0'}%\n📅 Target Date: ${ctx.goalTargetDate || 'N/A'}\n\nKeep investing consistently to reach your goal!\n\nRegards,\n${ctx.advisorName || 'Your Financial Advisor'}`,
  },
  {
    type: 'TRANSACTION_CONFIRMATION',
    label: 'Transaction Confirmation',
    description: 'Confirm a transaction with the client',
    emailSubject: (ctx) => `Transaction ${ctx.txnStatus || 'Update'}: ${ctx.txnType || ''} - ${ctx.txnFundName || 'Fund'}`,
    emailBody: (ctx) => `
      <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10B981;">✅ Transaction ${ctx.txnStatus || 'Update'}</h2>
        <p>Dear ${ctx.clientName || 'Client'},</p>
        <p>Here are your transaction details:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr style="background: #F0FDF4;"><td style="padding: 12px; font-weight: 600;">Type</td><td style="padding: 12px; text-align: right;">${ctx.txnType || 'N/A'}</td></tr>
          <tr><td style="padding: 12px;">Fund</td><td style="padding: 12px; text-align: right;">${ctx.txnFundName || 'N/A'}</td></tr>
          <tr style="background: #F0FDF4;"><td style="padding: 12px;">Amount</td><td style="padding: 12px; text-align: right;">${formatCurrency(ctx.txnAmount)}</td></tr>
          <tr><td style="padding: 12px;">Date</td><td style="padding: 12px; text-align: right;">${ctx.txnDate || 'N/A'}</td></tr>
          <tr style="background: #F0FDF4;"><td style="padding: 12px;">Status</td><td style="padding: 12px; text-align: right; font-weight: 700;">${ctx.txnStatus || 'N/A'}</td></tr>
        </table>
        <p>Best regards,<br/>${ctx.advisorName || 'Your Financial Advisor'}<br/>Sparrow Invest</p>
      </div>
    `,
    whatsappBody: (ctx) =>
      `✅ *Transaction ${ctx.txnStatus || 'Update'}*\n\nDear ${ctx.clientName || 'Client'},\n\n📋 Type: ${ctx.txnType || 'N/A'}\n📋 Fund: ${ctx.txnFundName || 'N/A'}\n💰 Amount: ${formatCurrency(ctx.txnAmount)}\n📅 Date: ${ctx.txnDate || 'N/A'}\n📊 Status: ${ctx.txnStatus || 'N/A'}\n\nRegards,\n${ctx.advisorName || 'Your Financial Advisor'}`,
  },
  {
    type: 'REPORT_SHARING',
    label: 'Report Sharing',
    description: 'Share a generated report with the client',
    emailSubject: (ctx) => `${ctx.reportTitle || 'Report'} - ${ctx.reportPeriod || new Date().toLocaleDateString('en-IN')}`,
    emailBody: (ctx) => `
      <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3B82F6;">📄 Report Shared</h2>
        <p>Dear ${ctx.clientName || 'Client'},</p>
        <p>Please find attached: <strong>${ctx.reportTitle || 'Report'}</strong></p>
        <p>Period: ${ctx.reportPeriod || 'N/A'}</p>
        <p>Feel free to reach out if you have any questions about the report.</p>
        <p>Best regards,<br/>${ctx.advisorName || 'Your Financial Advisor'}<br/>Sparrow Invest</p>
      </div>
    `,
    whatsappBody: (ctx) =>
      `📄 *Report Shared*\n\nDear ${ctx.clientName || 'Client'},\n\nI've prepared your report:\n\n📋 ${ctx.reportTitle || 'Report'}\n📅 Period: ${ctx.reportPeriod || 'N/A'}\n\nPlease check your email or the Sparrow Invest app for the full report.\n\nRegards,\n${ctx.advisorName || 'Your Financial Advisor'}`,
  },
  {
    type: 'KYC_REMINDER',
    label: 'KYC Reminder',
    description: 'Remind client to complete or update KYC',
    emailSubject: () => `Action Required: Complete Your KYC`,
    emailBody: (ctx) => `
      <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #F59E0B;">📋 KYC Reminder</h2>
        <p>Dear ${ctx.clientName || 'Client'},</p>
        <p>We noticed that your KYC documentation needs attention. Please ensure your KYC is up to date to continue enjoying uninterrupted investment services.</p>
        <p><strong>Required Documents:</strong></p>
        <ul>
          <li>PAN Card</li>
          <li>Aadhaar Card</li>
          <li>Address Proof</li>
          <li>Bank Statement (last 3 months)</li>
        </ul>
        <p>Please contact us to complete your KYC at the earliest.</p>
        <p>Best regards,<br/>${ctx.advisorName || 'Your Financial Advisor'}<br/>Sparrow Invest</p>
      </div>
    `,
    whatsappBody: (ctx) =>
      `📋 *KYC Reminder*\n\nDear ${ctx.clientName || 'Client'},\n\nYour KYC documentation needs attention. Please update it to continue enjoying uninterrupted investment services.\n\n📌 Required: PAN, Aadhaar, Address Proof, Bank Statement\n\nPlease contact us to complete your KYC.\n\nRegards,\n${ctx.advisorName || 'Your Financial Advisor'}`,
  },
  {
    type: 'CUSTOM',
    label: 'Custom Message',
    description: 'Send a free-form custom message',
    emailSubject: (ctx) => ctx.customSubject || 'Message from Your Financial Advisor',
    emailBody: (ctx) => `
      <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <p>Dear ${ctx.clientName || 'Client'},</p>
        <div>${ctx.customBody || ''}</div>
        <p>Best regards,<br/>${ctx.advisorName || 'Your Financial Advisor'}<br/>Sparrow Invest</p>
      </div>
    `,
    whatsappBody: (ctx) =>
      `Dear ${ctx.clientName || 'Client'},\n\n${ctx.customBody || ''}\n\nRegards,\n${ctx.advisorName || 'Your Financial Advisor'}`,
  },
];

export function getTemplate(type: string): CommunicationTemplate | undefined {
  return COMMUNICATION_TEMPLATES.find((t) => t.type === type);
}

export function getTemplateList() {
  return COMMUNICATION_TEMPLATES.map(({ type, label, description }) => ({ type, label, description }));
}
