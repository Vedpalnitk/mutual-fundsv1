import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMlModelDto {
  @ApiProperty({ example: 'Persona Classifier' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'persona-classifier' })
  @IsString()
  slug: string;

  @ApiProperty({
    example: 'persona_classifier',
    enum: ['persona_classifier', 'portfolio_optimizer', 'fund_recommender', 'risk_assessor']
  })
  @IsString()
  modelType: string;

  @ApiPropertyOptional({ example: 'XGBoost-based persona classification model' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'xgboost', enum: ['scikit-learn', 'xgboost', 'lightgbm', 'pytorch', 'tensorflow'] })
  @IsString()
  @IsOptional()
  framework?: string;
}

export class UpdateMlModelDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  framework?: string;
}

export class CreateModelVersionDto {
  @ApiProperty({ example: '1.0.0' })
  @IsString()
  version: string;

  @ApiProperty({ example: 'models/persona-classifier/v1.0.0/model.joblib' })
  @IsString()
  storagePath: string;

  @ApiPropertyOptional({ example: 1024000 })
  @IsNumber()
  @IsOptional()
  fileSizeBytes?: number;

  @ApiPropertyOptional({ description: 'Model hyperparameters and training info' })
  @IsOptional()
  metadata?: any;

  @ApiPropertyOptional({ description: 'Model performance metrics' })
  @IsOptional()
  metrics?: any;
}

export class PromoteVersionDto {
  @ApiPropertyOptional({ default: true, description: 'Demote current production version' })
  @IsBoolean()
  @IsOptional()
  demoteCurrent?: boolean;
}

export class CreatePersonaMappingDto {
  @ApiProperty({ example: 'uuid-of-persona' })
  @IsString()
  personaId: string;

  @ApiProperty({ example: 'classification', enum: ['classification', 'optimization', 'recommendation'] })
  @IsString()
  modelPurpose: string;

  @ApiPropertyOptional({ example: 1.0, description: 'Weight for ensemble models' })
  @IsNumber()
  @IsOptional()
  weight?: number;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

// Define ModelVersionResponseDto before MlModelResponseDto to avoid reference error
export class ModelVersionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  version: string;

  @ApiProperty()
  storagePath: string;

  @ApiPropertyOptional()
  fileSizeBytes?: number;

  @ApiPropertyOptional()
  metadata?: any;

  @ApiPropertyOptional()
  metrics?: any;

  @ApiProperty()
  status: string;

  @ApiProperty()
  isProduction: boolean;

  @ApiPropertyOptional()
  trainedAt?: Date;

  @ApiProperty()
  createdAt: Date;
}

export class MlModelResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  modelType: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  framework?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  versions?: ModelVersionResponseDto[];

  @ApiPropertyOptional()
  productionVersion?: ModelVersionResponseDto;
}
