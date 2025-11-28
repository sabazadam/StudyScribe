// AI Model Configuration

export type ModelTier = 'default' | 'better' | 'star';

export interface ModelConfig {
  id: string;
  name: string;
  tier: ModelTier;
  description: string;
  icon: string;
}

export const AVAILABLE_MODELS: Record<ModelTier, ModelConfig> = {
  default: {
    id: 'gemini-2.5-flash',
    name: 'Fast Model',
    tier: 'default',
    description: 'Quick responses, good for simple tasks',
    icon: '⚡',
  },
  better: {
    id: 'gemini-2.5-pro',
    name: 'Pro Model',
    tier: 'better',
    description: 'Advanced reasoning, better quality outputs',
    icon: '🎯',
  },
  star: {
    id: 'gemini-3-pro-preview',
    name: 'Premium Model',
    tier: 'star',
    description: 'Best performance, highest quality results',
    icon: '⭐',
  },
};

export function getModelById(tier: ModelTier = 'default'): string {
  return AVAILABLE_MODELS[tier].id;
}

export function getModelConfig(tier: ModelTier = 'default'): ModelConfig {
  return AVAILABLE_MODELS[tier];
}
