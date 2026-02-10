import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnalysisDto } from './dto/create-analysis.dto';
import { CreateVersionDto } from './dto/create-version.dto';
import { AnalysisStatus } from '@prisma/client';

@Injectable()
export class SavedAnalysisService {
  constructor(private prisma: PrismaService) {}

  async create(advisorId: string, dto: CreateAnalysisDto) {
    // Verify the client belongs to this advisor
    const client = await this.prisma.fAClient.findFirst({
      where: { id: dto.clientId, advisorId },
    });
    if (!client) {
      throw new NotFoundException('Client not found');
    }

    const analysis = await this.prisma.savedAnalysis.create({
      data: {
        advisorId,
        clientId: dto.clientId,
        title: dto.title,
        versions: {
          create: {
            versionNumber: 1,
            personaData: dto.personaData,
            riskData: dto.riskData,
            rebalancingData: dto.rebalancingData,
            editNotes: dto.editNotes || 'Initial analysis',
          },
        },
      },
      include: {
        client: { select: { name: true } },
        versions: { orderBy: { versionNumber: 'desc' } },
      },
    });

    return this.transformAnalysis(analysis);
  }

  async findAll(advisorId: string, clientId?: string) {
    const where: any = { advisorId };
    if (clientId) where.clientId = clientId;

    const analyses = await this.prisma.savedAnalysis.findMany({
      where,
      include: {
        client: { select: { name: true } },
        versions: {
          select: { id: true, versionNumber: true, editNotes: true, createdAt: true },
          orderBy: { versionNumber: 'desc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return analyses.map(this.transformAnalysis);
  }

  async findOne(id: string, advisorId: string) {
    const analysis = await this.prisma.savedAnalysis.findUnique({
      where: { id },
      include: {
        client: { select: { name: true } },
        versions: {
          select: { id: true, versionNumber: true, editNotes: true, createdAt: true },
          orderBy: { versionNumber: 'desc' },
        },
      },
    });

    if (!analysis) throw new NotFoundException('Analysis not found');
    if (analysis.advisorId !== advisorId) throw new ForbiddenException();

    return this.transformAnalysis(analysis);
  }

  async getVersion(id: string, versionNumber: number, advisorId: string) {
    const analysis = await this.prisma.savedAnalysis.findUnique({
      where: { id },
      select: { advisorId: true },
    });

    if (!analysis) throw new NotFoundException('Analysis not found');
    if (analysis.advisorId !== advisorId) throw new ForbiddenException();

    const version = await this.prisma.analysisVersion.findUnique({
      where: {
        analysisId_versionNumber: { analysisId: id, versionNumber },
      },
    });

    if (!version) throw new NotFoundException('Version not found');

    return {
      versionNumber: version.versionNumber,
      editNotes: version.editNotes,
      createdAt: version.createdAt.toISOString(),
      personaData: version.personaData,
      riskData: version.riskData,
      rebalancingData: version.rebalancingData,
    };
  }

  async createVersion(id: string, advisorId: string, dto: CreateVersionDto) {
    const analysis = await this.prisma.savedAnalysis.findUnique({
      where: { id },
      include: {
        versions: { orderBy: { versionNumber: 'desc' }, take: 1 },
      },
    });

    if (!analysis) throw new NotFoundException('Analysis not found');
    if (analysis.advisorId !== advisorId) throw new ForbiddenException();

    const latestVersion = analysis.versions[0];
    const newVersionNumber = analysis.latestVersion + 1;

    // Create new version: persona & risk carry over from latest, rebalancing is edited
    const [version] = await this.prisma.$transaction([
      this.prisma.analysisVersion.create({
        data: {
          analysisId: id,
          versionNumber: newVersionNumber,
          personaData: latestVersion.personaData as any,
          riskData: latestVersion.riskData as any,
          rebalancingData: dto.rebalancingData,
          editNotes: dto.editNotes,
        },
      }),
      this.prisma.savedAnalysis.update({
        where: { id },
        data: { latestVersion: newVersionNumber },
      }),
    ]);

    return {
      versionNumber: version.versionNumber,
      editNotes: version.editNotes,
      createdAt: version.createdAt.toISOString(),
      personaData: version.personaData,
      riskData: version.riskData,
      rebalancingData: version.rebalancingData,
    };
  }

  async update(id: string, advisorId: string, data: { title?: string; status?: AnalysisStatus }) {
    const analysis = await this.prisma.savedAnalysis.findUnique({ where: { id } });
    if (!analysis) throw new NotFoundException('Analysis not found');
    if (analysis.advisorId !== advisorId) throw new ForbiddenException();

    const updated = await this.prisma.savedAnalysis.update({
      where: { id },
      data,
      include: {
        client: { select: { name: true } },
        versions: {
          select: { id: true, versionNumber: true, editNotes: true, createdAt: true },
          orderBy: { versionNumber: 'desc' },
        },
      },
    });

    return this.transformAnalysis(updated);
  }

  async remove(id: string, advisorId: string) {
    const analysis = await this.prisma.savedAnalysis.findUnique({ where: { id } });
    if (!analysis) throw new NotFoundException('Analysis not found');
    if (analysis.advisorId !== advisorId) throw new ForbiddenException();

    await this.prisma.savedAnalysis.delete({ where: { id } });
    return { deleted: true };
  }

  async generatePdf(id: string, versionNumber: number, advisorId: string): Promise<Buffer> {
    const analysis = await this.prisma.savedAnalysis.findUnique({
      where: { id },
      include: { client: { select: { name: true, email: true } } },
    });

    if (!analysis) throw new NotFoundException('Analysis not found');
    if (analysis.advisorId !== advisorId) throw new ForbiddenException();

    const version = await this.prisma.analysisVersion.findUnique({
      where: {
        analysisId_versionNumber: { analysisId: id, versionNumber },
      },
    });

    if (!version) throw new NotFoundException('Version not found');

    const PDFDocument = (await import('pdfkit')).default;

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).font('Helvetica-Bold').text(analysis.title, { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica')
        .text(`Client: ${analysis.client.name}`, { align: 'center' });
      doc.text(`Version ${version.versionNumber} | ${version.createdAt.toLocaleDateString('en-IN')}`, { align: 'center' });
      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#CCCCCC');
      doc.moveDown(1);

      // Section 1: Persona Alignment
      const persona = version.personaData as any;
      doc.fontSize(14).font('Helvetica-Bold').text('Persona Alignment');
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Primary Persona: ${persona.primaryPersona || 'N/A'}`);
      doc.text(`Risk Band: ${persona.riskBand || 'N/A'}`);
      doc.text(`Confidence: ${persona.confidence ? (persona.confidence * 100).toFixed(0) + '%' : 'N/A'}`);
      if (persona.description) doc.text(`Description: ${persona.description}`);
      if (persona.blendedAllocation) {
        doc.moveDown(0.3);
        doc.font('Helvetica-Bold').text('Recommended Allocation:');
        doc.font('Helvetica');
        for (const [key, val] of Object.entries(persona.blendedAllocation)) {
          doc.text(`  ${key}: ${((val as number) * 100).toFixed(1)}%`);
        }
      }
      doc.moveDown(1);

      // Section 2: Risk Assessment
      const risk = version.riskData as any;
      doc.fontSize(14).font('Helvetica-Bold').text('Risk Assessment');
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Risk Level: ${risk.riskLevel || 'N/A'}`);
      doc.text(`Risk Score: ${risk.riskScore ?? 'N/A'}`);
      if (risk.riskFactors?.length) {
        doc.moveDown(0.3);
        doc.font('Helvetica-Bold').text('Risk Factors:');
        doc.font('Helvetica');
        for (const f of risk.riskFactors) {
          doc.text(`  ${f.name} - ${f.severity} (${((f.contribution || 0) * 100).toFixed(0)}%)`);
        }
      }
      if (risk.recommendations?.length) {
        doc.moveDown(0.3);
        doc.font('Helvetica-Bold').text('Recommendations:');
        doc.font('Helvetica');
        for (const rec of risk.recommendations) {
          doc.text(`  - ${rec}`);
        }
      }
      doc.moveDown(1);

      // Section 3: Rebalancing Roadmap
      const rebal = version.rebalancingData as any;
      doc.fontSize(14).font('Helvetica-Bold').text('Rebalancing Roadmap');
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Alignment: ${rebal.alignmentScore != null ? (rebal.alignmentScore * 100).toFixed(0) + '%' : 'N/A'} (${rebal.isAligned ? 'Aligned' : 'Needs Rebalancing'})`);
      if (rebal.totalSellAmount != null) doc.text(`Total Sell: ₹${rebal.totalSellAmount.toLocaleString('en-IN')}`);
      if (rebal.totalBuyAmount != null) doc.text(`Total Buy: ₹${rebal.totalBuyAmount.toLocaleString('en-IN')}`);
      if (rebal.taxImpactSummary) doc.text(`Tax Impact: ${rebal.taxImpactSummary}`);

      if (rebal.actions?.length) {
        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').text('Actions:');
        doc.font('Helvetica');
        for (const a of rebal.actions) {
          const amt = Math.abs(a.transactionAmount || 0);
          doc.text(`  [${a.action}] ${a.schemeName} | ${a.assetClass} | ₹${amt.toLocaleString('en-IN')} | ${a.priority} | ${a.reason}`);
        }
      }

      if (version.editNotes) {
        doc.moveDown(1);
        doc.fontSize(10).font('Helvetica-Oblique').text(`Edit Notes: ${version.editNotes}`);
      }

      // Footer
      doc.moveDown(2);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#CCCCCC');
      doc.moveDown(0.5);
      doc.fontSize(8).font('Helvetica').text('Sparrow Invest FA Portal', { align: 'center' });

      doc.end();
    });
  }

  private transformAnalysis(analysis: any) {
    return {
      id: analysis.id,
      clientId: analysis.clientId,
      clientName: analysis.client?.name || '',
      title: analysis.title,
      status: analysis.status,
      latestVersion: analysis.latestVersion,
      createdAt: analysis.createdAt?.toISOString?.() || analysis.createdAt,
      updatedAt: analysis.updatedAt?.toISOString?.() || analysis.updatedAt,
      versions: analysis.versions?.map((v: any) => ({
        id: v.id,
        versionNumber: v.versionNumber,
        editNotes: v.editNotes,
        createdAt: v.createdAt?.toISOString?.() || v.createdAt,
      })) || [],
    };
  }
}
