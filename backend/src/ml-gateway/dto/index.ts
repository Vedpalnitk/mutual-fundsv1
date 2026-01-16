export * from './classify.dto';
export * from './recommend.dto';
export * from './optimize.dto';
export * from './risk.dto';

// Re-export specific DTOs for easier imports
export {
  AllocationBreakdownDto,
  PersonaDistributionItemDto,
  BlendedClassifyResponseDto,
} from './classify.dto';

export {
  AllocationTargetDto,
  BlendedRecommendRequestDto,
  BlendedRecommendResponseDto,
  BlendedFundRecommendationDto,
  AssetClassBreakdownDto,
} from './recommend.dto';
