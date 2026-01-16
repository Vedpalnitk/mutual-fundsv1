import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateMlModelDto,
  UpdateMlModelDto,
  CreateModelVersionDto,
  CreatePersonaMappingDto,
} from './dto/ml-model.dto';

@Injectable()
export class MlModelsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.mlModel.findMany({
      include: {
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        _count: {
          select: {
            versions: true,
            personaMappings: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const model = await this.prisma.mlModel.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { createdAt: 'desc' },
        },
        personaMappings: {
          where: { isActive: true },
          include: {
            persona: { select: { id: true, name: true, slug: true } },
          },
        },
        abTests: {
          where: { status: 'running' },
        },
      },
    });

    if (!model) {
      throw new NotFoundException(`ML Model with ID ${id} not found`);
    }

    // Add production version convenience field
    const productionVersion = model.versions.find((v) => v.isProduction);

    return {
      ...model,
      productionVersion,
    };
  }

  async findBySlug(slug: string) {
    const model = await this.prisma.mlModel.findUnique({
      where: { slug },
      include: {
        versions: {
          where: { isProduction: true },
        },
      },
    });

    if (!model) {
      throw new NotFoundException(`ML Model with slug ${slug} not found`);
    }

    return model;
  }

  async create(dto: CreateMlModelDto) {
    const existingSlug = await this.prisma.mlModel.findUnique({
      where: { slug: dto.slug },
    });

    if (existingSlug) {
      throw new ConflictException(`Model with slug ${dto.slug} already exists`);
    }

    return this.prisma.mlModel.create({
      data: dto,
    });
  }

  async update(id: string, dto: UpdateMlModelDto) {
    await this.findOne(id);

    return this.prisma.mlModel.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string) {
    await this.findOne(id);

    return this.prisma.mlModel.delete({
      where: { id },
    });
  }

  // Versions
  async createVersion(modelId: string, dto: CreateModelVersionDto) {
    await this.findOne(modelId);

    // Check if version already exists
    const existingVersion = await this.prisma.modelVersion.findFirst({
      where: { modelId, version: dto.version },
    });

    if (existingVersion) {
      throw new ConflictException(`Version ${dto.version} already exists`);
    }

    return this.prisma.modelVersion.create({
      data: {
        modelId,
        ...dto,
        status: 'staged',
      },
    });
  }

  async getVersion(modelId: string, versionId: string) {
    const version = await this.prisma.modelVersion.findFirst({
      where: { id: versionId, modelId },
    });

    if (!version) {
      throw new NotFoundException(`Version with ID ${versionId} not found`);
    }

    return version;
  }

  async promoteVersion(modelId: string, versionId: string, demoteCurrent = true) {
    const version = await this.getVersion(modelId, versionId);

    if (version.isProduction) {
      throw new BadRequestException('Version is already in production');
    }

    // Transaction to demote current and promote new
    return this.prisma.$transaction(async (tx) => {
      if (demoteCurrent) {
        // Demote current production version
        await tx.modelVersion.updateMany({
          where: { modelId, isProduction: true },
          data: { isProduction: false, status: 'deprecated' },
        });
      }

      // Promote new version
      return tx.modelVersion.update({
        where: { id: versionId },
        data: { isProduction: true, status: 'active' },
      });
    });
  }

  async rollbackVersion(modelId: string, versionId: string) {
    const version = await this.getVersion(modelId, versionId);

    if (!version.isProduction) {
      throw new BadRequestException('Version is not in production');
    }

    // Find previous production version
    const previousVersion = await this.prisma.modelVersion.findFirst({
      where: {
        modelId,
        status: 'deprecated',
        id: { not: versionId },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!previousVersion) {
      throw new BadRequestException('No previous version to rollback to');
    }

    return this.prisma.$transaction(async (tx) => {
      // Demote current
      await tx.modelVersion.update({
        where: { id: versionId },
        data: { isProduction: false, status: 'deprecated' },
      });

      // Promote previous
      return tx.modelVersion.update({
        where: { id: previousVersion.id },
        data: { isProduction: true, status: 'active' },
      });
    });
  }

  async deleteVersion(modelId: string, versionId: string) {
    const version = await this.getVersion(modelId, versionId);

    if (version.isProduction) {
      throw new BadRequestException('Cannot delete production version');
    }

    return this.prisma.modelVersion.delete({
      where: { id: versionId },
    });
  }

  // Persona Mappings
  async getPersonaMappings(modelId: string) {
    await this.findOne(modelId);

    return this.prisma.personaMlMapping.findMany({
      where: { modelId },
      include: {
        persona: { select: { id: true, name: true, slug: true, riskBand: true } },
      },
    });
  }

  async createPersonaMapping(modelId: string, dto: CreatePersonaMappingDto) {
    await this.findOne(modelId);

    // Check if mapping already exists
    const existingMapping = await this.prisma.personaMlMapping.findFirst({
      where: {
        modelId,
        personaId: dto.personaId,
        modelPurpose: dto.modelPurpose,
      },
    });

    if (existingMapping) {
      throw new ConflictException('Mapping already exists');
    }

    return this.prisma.personaMlMapping.create({
      data: {
        modelId,
        ...dto,
      },
      include: {
        persona: { select: { id: true, name: true } },
      },
    });
  }

  async updatePersonaMapping(
    modelId: string,
    mappingId: string,
    dto: Partial<CreatePersonaMappingDto>,
  ) {
    const mapping = await this.prisma.personaMlMapping.findFirst({
      where: { id: mappingId, modelId },
    });

    if (!mapping) {
      throw new NotFoundException(`Mapping with ID ${mappingId} not found`);
    }

    return this.prisma.personaMlMapping.update({
      where: { id: mappingId },
      data: dto,
      include: {
        persona: { select: { id: true, name: true } },
      },
    });
  }

  async deletePersonaMapping(modelId: string, mappingId: string) {
    const mapping = await this.prisma.personaMlMapping.findFirst({
      where: { id: mappingId, modelId },
    });

    if (!mapping) {
      throw new NotFoundException(`Mapping with ID ${mappingId} not found`);
    }

    return this.prisma.personaMlMapping.delete({
      where: { id: mappingId },
    });
  }

  // Get production model for a specific type
  async getProductionModel(modelType: string) {
    const model = await this.prisma.mlModel.findFirst({
      where: { modelType },
      include: {
        versions: {
          where: { isProduction: true },
        },
      },
    });

    if (!model || model.versions.length === 0) {
      throw new NotFoundException(`No production model found for type ${modelType}`);
    }

    return {
      ...model,
      productionVersion: model.versions[0],
    };
  }
}
