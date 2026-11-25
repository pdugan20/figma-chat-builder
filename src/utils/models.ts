import type Anthropic from '@anthropic-ai/sdk';
import { ModelOption } from '../types/api';
import API_CONSTANTS from '../constants/api';

const MAX_MODEL_FIELD_LENGTH = 100;

function isModelField(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= MAX_MODEL_FIELD_LENGTH;
}

// Validates a model option crossing the plugin/UI message boundary or read from client storage.
export function parseModelOption(value: unknown): ModelOption | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  const { id, displayName } = value as Record<string, unknown>;
  if (!isModelField(id) || !isModelField(displayName)) {
    return null;
  }
  return { id, displayName };
}

export function toModelOption(model: Anthropic.ModelInfo): ModelOption {
  return { id: model.id, displayName: model.display_name };
}

// Keeps the saved model while it is still active for this key. Otherwise picks the newest
// model in the default line; the Models API lists newer models first.
export function chooseModel(activeModels: Anthropic.ModelInfo[], savedModel: ModelOption | null): ModelOption {
  if (activeModels.length === 0) {
    return savedModel ?? API_CONSTANTS.FALLBACK_MODEL;
  }
  if (savedModel && activeModels.some((model) => model.id === savedModel.id)) {
    return savedModel;
  }
  const defaultModel = activeModels.find((model) => model.line === API_CONSTANTS.DEFAULT_MODEL_LINE) ?? activeModels[0];
  return toModelOption(defaultModel);
}
