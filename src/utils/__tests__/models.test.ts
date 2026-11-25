import type Anthropic from '@anthropic-ai/sdk';
import { chooseModel, parseModelOption } from '../models';
import API_CONSTANTS from '../../constants/api';

function createModelInfo(id: string, line: Anthropic.ModelLine | null): Anthropic.ModelInfo {
  return { id, display_name: `Display ${id}`, line, lifecycle: 'active' } as Anthropic.ModelInfo;
}

describe('parseModelOption', () => {
  it('accepts a model with an id and display name', () => {
    expect(parseModelOption({ id: 'claude-haiku-5', displayName: 'Claude Haiku 5' })).toEqual({
      id: 'claude-haiku-5',
      displayName: 'Claude Haiku 5',
    });
  });

  it('drops fields other than id and display name', () => {
    expect(parseModelOption({ id: 'claude-haiku-5', displayName: 'Claude Haiku 5', extra: true })).toEqual({
      id: 'claude-haiku-5',
      displayName: 'Claude Haiku 5',
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

describe('chooseModel', () => {
  const savedModel = { id: 'claude-sonnet-5', displayName: 'Claude Sonnet 5' };

  it('uses the fallback model when nothing is listed or saved', () => {
    expect(chooseModel([], null)).toEqual(API_CONSTANTS.FALLBACK_MODEL);
  });

  it('keeps the saved model when nothing is listed', () => {
    expect(chooseModel([], savedModel)).toEqual(savedModel);
  });

  it('keeps the saved model while it is active', () => {
    const activeModels = [createModelInfo('claude-haiku-5', 'haiku'), createModelInfo('claude-sonnet-5', 'sonnet')];
    expect(chooseModel(activeModels, savedModel)).toEqual(savedModel);
  });

  it('picks the newest default-line model when the saved model is no longer active', () => {
    const activeModels = [
      createModelInfo('claude-opus-5', 'opus'),
      createModelInfo('claude-haiku-5', 'haiku'),
      createModelInfo('claude-haiku-4-5', 'haiku'),
    ];
    expect(chooseModel(activeModels, savedModel)).toEqual({
      id: 'claude-haiku-5',
      displayName: 'Display claude-haiku-5',
    });
  });

  it('picks the newest model when no default-line model is active', () => {
    const activeModels = [createModelInfo('claude-opus-5', 'opus'), createModelInfo('claude-custom', null)];
    expect(chooseModel(activeModels, null)).toEqual({ id: 'claude-opus-5', displayName: 'Display claude-opus-5' });
  });
});
