import type Anthropic from '@anthropic-ai/sdk';
import { chooseModel, filterOfferedModels, parseModelOption, toModelOption } from '../models';
import API_CONSTANTS from '../../constants/api';

function createModelInfo(id: string, line: Anthropic.ModelLine | null, supportsLowEffort = false): Anthropic.ModelInfo {
  const capabilities = { effort: { low: { supported: supportsLowEffort } } };
  return { id, display_name: `Display ${id}`, line, lifecycle: 'active', capabilities } as Anthropic.ModelInfo;
}

describe('parseModelOption', () => {
  it('accepts a model with an id, display name and effort support', () => {
    expect(parseModelOption({ id: 'claude-haiku-5', displayName: 'Claude Haiku 5', supportsLowEffort: true })).toEqual({
      id: 'claude-haiku-5',
      displayName: 'Claude Haiku 5',
      supportsLowEffort: true,
    });
  });

  it('treats choices saved without effort support as unsupported and drops other fields', () => {
    expect(parseModelOption({ id: 'claude-haiku-5', displayName: 'Claude Haiku 5', extra: true })).toEqual({
      id: 'claude-haiku-5',
      displayName: 'Claude Haiku 5',
      supportsLowEffort: false,
    });
  });

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['a string', 'claude-haiku-5'],
    ['a missing display name', { id: 'claude-haiku-5' }],
    ['an empty id', { id: '', displayName: 'Claude Haiku 5' }],
    ['a non-string id', { id: 5, displayName: 'Claude Haiku 5' }],
    ['an oversized id', { id: 'c'.repeat(101), displayName: 'Claude Haiku 5' }],
  ])('rejects %s', (_, value) => {
    expect(parseModelOption(value)).toBeNull();
  });
});

describe('toModelOption', () => {
  it('reads low effort support from the model capabilities', () => {
    expect(toModelOption(createModelInfo('claude-haiku-5', 'haiku', true))).toEqual({
      id: 'claude-haiku-5',
      displayName: 'Display claude-haiku-5',
      supportsLowEffort: true,
    });
  });

  it('treats missing capabilities as no effort support', () => {
    const model = {
      id: 'claude-haiku-4-5',
      display_name: 'Claude Haiku 4.5',
      capabilities: null,
    } as Anthropic.ModelInfo;
    expect(toModelOption(model).supportsLowEffort).toBe(false);
  });
});

describe('filterOfferedModels', () => {
  it('keeps only the Haiku and Sonnet lines', () => {
    const activeModels = [
      createModelInfo('claude-opus-5', 'opus'),
      createModelInfo('claude-sonnet-5', 'sonnet'),
      createModelInfo('claude-fable-5', 'fable'),
      createModelInfo('claude-custom', null),
      createModelInfo('claude-haiku-5', 'haiku'),
    ];
    expect(filterOfferedModels(activeModels).map((model) => model.id)).toEqual(['claude-sonnet-5', 'claude-haiku-5']);
  });

  it('keeps every active model when none are in the offered lines', () => {
    const activeModels = [createModelInfo('claude-opus-5', 'opus'), createModelInfo('claude-custom', null)];
    expect(filterOfferedModels(activeModels)).toEqual(activeModels);
  });
});

describe('chooseModel', () => {
  const savedModel = { id: 'claude-sonnet-5', displayName: 'Claude Sonnet 5', supportsLowEffort: false };

  it('uses the fallback model when nothing is listed or saved', () => {
    expect(chooseModel([], null)).toEqual(API_CONSTANTS.FALLBACK_MODEL);
  });

  it('keeps the saved model when nothing is listed', () => {
    expect(chooseModel([], savedModel)).toEqual(savedModel);
  });

  it('keeps the saved model while it is active, with details from the list', () => {
    const activeModels = [
      createModelInfo('claude-haiku-5', 'haiku'),
      createModelInfo('claude-sonnet-5', 'sonnet', true),
    ];
    expect(chooseModel(activeModels, savedModel)).toEqual({
      id: 'claude-sonnet-5',
      displayName: 'Display claude-sonnet-5',
      supportsLowEffort: true,
    });
  });

  it('picks the newest default-line model when the saved model is no longer active', () => {
    const activeModels = [
      createModelInfo('claude-opus-5', 'opus'),
      createModelInfo('claude-haiku-5', 'haiku'),
      createModelInfo('claude-haiku-4-5', 'haiku'),
    ];
    expect(chooseModel(activeModels, savedModel).id).toBe('claude-haiku-5');
  });

  it('picks the newest model when no default-line model is active', () => {
    const activeModels = [createModelInfo('claude-opus-5', 'opus'), createModelInfo('claude-custom', null)];
    expect(chooseModel(activeModels, null).id).toBe('claude-opus-5');
  });
});
