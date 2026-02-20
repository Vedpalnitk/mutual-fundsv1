import { Injectable, NotFoundException, Logger } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { MARKETING_TEMPLATES, AdvisorBrandContext } from './marketing-templates'

@Injectable()
export class MarketingService {
  private readonly logger = new Logger(MarketingService.name)

  constructor(private prisma: PrismaService) {}

  listTemplates() {
    return MARKETING_TEMPLATES.map(t => ({
      id: t.id,
      category: t.category,
      name: t.name,
      description: t.description,
    }))
  }

  async renderPreview(templateId: string, advisorId: string, customFields?: Record<string, string>): Promise<string> {
    const template = MARKETING_TEMPLATES.find(t => t.id === templateId)
    if (!template) throw new NotFoundException('Template not found')

    const brandContext = await this.getAdvisorBrandContext(advisorId)
    const context = { ...brandContext, ...(customFields || {}) }

    return template.render(context)
  }

  async generateImage(templateId: string, advisorId: string, customFields?: Record<string, string>): Promise<Buffer> {
    const html = await this.renderPreview(templateId, advisorId, customFields)

    try {
      // Dynamic import for puppeteer-core (optional dependency)
      const puppeteer = await import('puppeteer-core')

      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: this.findChromePath(),
      })

      try {
        const page = await browser.newPage()
        await page.setViewport({ width: 800, height: 800 })
        await page.setContent(html, { waitUntil: 'networkidle0' })
        const screenshot = await page.screenshot({ type: 'png' }) as Buffer
        return screenshot
      } finally {
        await browser.close()
      }
    } catch (error: any) {
      this.logger.warn(`Puppeteer not available, returning HTML as fallback: ${error.message}`)
      // Fallback: return HTML as buffer for clients that can render it
      return Buffer.from(html, 'utf-8')
    }
  }

  private async getAdvisorBrandContext(advisorId: string): Promise<AdvisorBrandContext> {
    const advisor = await this.prisma.user.findUnique({
      where: { id: advisorId },
      select: { email: true, phone: true, profile: { select: { name: true } } },
    })

    if (!advisor) throw new NotFoundException('Advisor not found')

    // Try to get BSE credentials for ARN
    let arnNo = ''
    try {
      const bseCred = await this.prisma.bsePartnerCredential.findUnique({
        where: { userId: advisorId },
      })
      arnNo = bseCred?.memberId || ''
    } catch {
      // No BSE credentials configured
    }

    return {
      advisorName: advisor.profile?.name || 'Financial Advisor',
      arnNo: arnNo || 'ARN-XXXXXX',
      phone: advisor.phone || '',
      companyName: 'Sparrow Invest',
      primaryColor: '#7C3AED',
    }
  }

  private findChromePath(): string {
    const paths = [
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    ]

    // In production, CHROME_PATH env var takes precedence
    if (process.env.CHROME_PATH) return process.env.CHROME_PATH

    // Return first path — puppeteer will throw if not found
    return paths[0]
  }
}
