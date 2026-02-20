export interface AdvisorBrandContext {
  advisorName: string
  arnNo: string
  phone: string
  companyName: string
  companyLogoUrl?: string
  primaryColor: string
}

export interface MarketingTemplate {
  id: string
  category: 'FESTIVAL' | 'MARKET' | 'NFO' | 'BIRTHDAY' | 'GENERAL'
  name: string
  description: string
  render: (ctx: AdvisorBrandContext & Record<string, string>) => string
}

function baseWrapper(bgGradient: string, content: string, ctx: AdvisorBrandContext): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 800px; height: 800px; font-family: 'Plus Jakarta Sans', 'Segoe UI', system-ui, sans-serif; }
  .card { width: 800px; height: 800px; background: ${bgGradient}; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px; position: relative; overflow: hidden; }
  .circle1 { position: absolute; top: -80px; right: -80px; width: 250px; height: 250px; border-radius: 50%; background: rgba(255,255,255,0.08); }
  .circle2 { position: absolute; bottom: -60px; left: -60px; width: 200px; height: 200px; border-radius: 50%; background: rgba(255,255,255,0.05); }
  .content { text-align: center; z-index: 1; color: white; }
  .footer { position: absolute; bottom: 30px; left: 0; right: 0; text-align: center; z-index: 1; }
  .footer-text { color: rgba(255,255,255,0.8); font-size: 14px; }
  .brand-bar { background: rgba(255,255,255,0.15); padding: 12px 30px; border-radius: 50px; display: inline-block; margin-top: 8px; }
  .brand-name { color: white; font-weight: 700; font-size: 16px; }
  .brand-arn { color: rgba(255,255,255,0.9); font-size: 12px; margin-left: 12px; }
  h1 { font-size: 48px; font-weight: 700; margin-bottom: 16px; line-height: 1.2; }
  h2 { font-size: 32px; font-weight: 600; margin-bottom: 12px; line-height: 1.3; }
  p { font-size: 18px; line-height: 1.6; color: rgba(255,255,255,0.9); }
  .highlight { color: #FFD700; font-weight: 700; }
  .icon { font-size: 64px; margin-bottom: 24px; }
</style></head><body>
<div class="card">
  <div class="circle1"></div>
  <div class="circle2"></div>
  <div class="content">${content}</div>
  <div class="footer">
    <div class="footer-text">Mutual Fund investments are subject to market risks. Read all scheme related documents carefully.</div>
    <div class="brand-bar">
      <span class="brand-name">${ctx.advisorName}</span>
      <span class="brand-arn">ARN: ${ctx.arnNo} | ${ctx.phone}</span>
    </div>
  </div>
</div></body></html>`
}

export const MARKETING_TEMPLATES: MarketingTemplate[] = [
  {
    id: 'diwali-greeting',
    category: 'FESTIVAL',
    name: 'Diwali Greeting',
    description: 'Festive Diwali wishes with investment message',
    render: (ctx) => baseWrapper(
      'linear-gradient(135deg, #FF6B00 0%, #FF9500 50%, #FFB800 100%)',
      `<div class="icon">&#127942;</div>
      <h1>Happy Diwali!</h1>
      <h2>May Your Wealth Shine Bright</h2>
      <p>This Diwali, invest in your future.<br/>Start a SIP and let your money grow.</p>`,
      ctx,
    ),
  },
  {
    id: 'new-year-greeting',
    category: 'FESTIVAL',
    name: 'New Year Greeting',
    description: 'New Year wishes with financial resolution',
    render: (ctx) => baseWrapper(
      'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      `<div class="icon">&#127878;</div>
      <h1>Happy New Year ${new Date().getFullYear() + 1}!</h1>
      <h2>New Year, New Financial Goals</h2>
      <p>Start the year with a plan for your wealth.<br/>Let's build your portfolio together.</p>`,
      ctx,
    ),
  },
  {
    id: 'republic-day',
    category: 'FESTIVAL',
    name: 'Republic Day',
    description: 'Republic Day patriotic greeting',
    render: (ctx) => baseWrapper(
      'linear-gradient(135deg, #FF9933 0%, #FFFFFF 50%, #138808 100%)',
      `<div class="icon">&#127470;&#127475;</div>
      <h1 style="color:#1a1a2e">Happy Republic Day!</h1>
      <h2 style="color:#333">Invest in India's Growth Story</h2>
      <p style="color:#555">Build wealth as India builds its future.<br/>Invest in Indian equity mutual funds.</p>`,
      ctx,
    ),
  },
  {
    id: 'market-milestone',
    category: 'MARKET',
    name: 'Market Milestone',
    description: 'Celebrate market highs with investment reminder',
    render: (ctx) => baseWrapper(
      'linear-gradient(135deg, #0f9b0f 0%, #0d8a0d 50%, #0a6b0a 100%)',
      `<div class="icon">&#128200;</div>
      <h1>Markets at All-Time High!</h1>
      <h2>Don't Time the Market,<br/>Give It Time</h2>
      <p>SIPs help you ride the waves.<br/>Stay invested for long-term wealth creation.</p>`,
      ctx,
    ),
  },
  {
    id: 'nfo-alert',
    category: 'NFO',
    name: 'NFO Alert',
    description: 'New Fund Offer announcement',
    render: (ctx) => baseWrapper(
      'linear-gradient(135deg, #3B82F6 0%, #2563EB 50%, #1D4ED8 100%)',
      `<div class="icon">&#127775;</div>
      <h1>New Fund Offer</h1>
      <h2>${ctx.nfoName || 'Exciting New Fund'}</h2>
      <p>Category: ${ctx.nfoCategory || 'Equity'}<br/>NFO Period: ${ctx.nfoDates || 'Limited Time'}<br/>Min. Investment: ${ctx.nfoMinInvestment || '₹500'}</p>`,
      ctx,
    ),
  },
  {
    id: 'birthday-wish',
    category: 'BIRTHDAY',
    name: 'Birthday Wishes',
    description: 'Personalized birthday greeting',
    render: (ctx) => baseWrapper(
      'linear-gradient(135deg, #EC4899 0%, #F472B6 50%, #FB7185 100%)',
      `<div class="icon">&#127874;</div>
      <h1>Happy Birthday${ctx.clientName ? ', ' + ctx.clientName : ''}!</h1>
      <h2>Wishing You Wealth & Happiness</h2>
      <p>May this year bring you closer to all your financial goals.</p>`,
      ctx,
    ),
  },
  {
    id: 'sip-benefits',
    category: 'GENERAL',
    name: 'SIP Benefits',
    description: 'Educational post about SIP advantages',
    render: (ctx) => baseWrapper(
      'linear-gradient(135deg, #7C3AED 0%, #6D28D9 50%, #5B21B6 100%)',
      `<div class="icon">&#128176;</div>
      <h1>Power of SIP</h1>
      <h2>Small Steps, Big Wealth</h2>
      <p>&#10004; Rupee Cost Averaging<br/>&#10004; Power of Compounding<br/>&#10004; Start with just ₹500/month<br/>&#10004; Disciplined Investing</p>`,
      ctx,
    ),
  },
  {
    id: 'tax-planning',
    category: 'GENERAL',
    name: 'Tax Planning Season',
    description: 'ELSS and tax saving reminder',
    render: (ctx) => baseWrapper(
      'linear-gradient(135deg, #059669 0%, #047857 50%, #065F46 100%)',
      `<div class="icon">&#128181;</div>
      <h1>Tax Planning Season</h1>
      <h2>Save Tax with ELSS Funds</h2>
      <p>Invest up to ₹1.5 Lakh under Section 80C<br/>Shortest lock-in of just 3 years<br/>Potential for higher returns vs FD/PPF</p>`,
      ctx,
    ),
  },
  {
    id: 'retirement-planning',
    category: 'GENERAL',
    name: 'Retirement Planning',
    description: 'Retirement planning awareness',
    render: (ctx) => baseWrapper(
      'linear-gradient(135deg, #0369A1 0%, #0284C7 50%, #0EA5E9 100%)',
      `<div class="icon">&#127796;</div>
      <h1>Plan Your Retirement</h1>
      <h2>It's Never Too Early to Start</h2>
      <p>A ₹10,000 monthly SIP at 12% returns<br/>can grow to <span class="highlight">₹1 Crore in 20 years</span><br/>Start your retirement SIP today!</p>`,
      ctx,
    ),
  },
]
