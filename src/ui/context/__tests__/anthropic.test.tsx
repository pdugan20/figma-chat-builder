import type Anthropic from '@anthropic-ai/sdk';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AnthropicProvider, useAnthropic } from '../anthropic';
import { listActiveModels } from '../../../api/anthropic';
import { MESSAGE_TYPE } from '../../../constants/messages';
import API_CONSTANTS from '../../../constants/api';

jest.mock('../../../api/anthropic');

const mockListActiveModels = listActiveModels as jest.MockedFunction<typeof listActiveModels>;

function createModelInfo(id: string, displayName: string, line: Anthropic.ModelLine): Anthropic.ModelInfo {
  return { id, display_name: displayName, line, lifecycle: 'active' } as Anthropic.ModelInfo;
}

function ModelConsumer() {
  const context = useAnthropic();
  return (
    <>
      <span data-testid='model'>{context.model.id}</span>
      <span data-testid='available'>{context.availableModels.map((model) => model.id).join(',')}</span>
      <button type='button' onClick={() => context.selectModel('claude-sonnet-5')}>
        Use Sonnet
      </button>
    </>
  );
}

function sendKeyMessage(pluginMessage: Record<string, unknown>) {
  act(() => {
    window.dispatchEvent(new MessageEvent('message', { data: { pluginMessage } }));
  });
}

describe('AnthropicProvider model selection', () => {
  beforeEach(() => {
    mockListActiveModels.mockReset();
    (parent.postMessage as jest.Mock).mockClear();
  });

  it('uses the fallback model before a key is loaded', () => {
    render(
      <AnthropicProvider>
        <ModelConsumer />
      </AnthropicProvider>
    );

    expect(screen.getByTestId('model')).toHaveTextContent(API_CONSTANTS.FALLBACK_MODEL.id);
    expect(mockListActiveModels).not.toHaveBeenCalled();
  });

  it('replaces a saved model that is no longer active with the newest Haiku model', async () => {
    mockListActiveModels.mockResolvedValue([
      createModelInfo('claude-sonnet-5', 'Claude Sonnet 5', 'sonnet'),
      createModelInfo('claude-haiku-5', 'Claude Haiku 5', 'haiku'),
    ]);
    render(
      <AnthropicProvider>
        <ModelConsumer />
      </AnthropicProvider>
    );

    sendKeyMessage({
      type: MESSAGE_TYPE.HAS_ANTHROPIC_KEY,
      hasKey: true,
      key: 'sk-ant-key',
      model: { id: 'claude-haiku-4-5', displayName: 'Claude Haiku 4.5' },
    });

    expect(screen.getByTestId('model')).toHaveTextContent('claude-haiku-4-5');
    await waitFor(() => expect(screen.getByTestId('model')).toHaveTextContent('claude-haiku-5'));
    expect(screen.getByTestId('available')).toHaveTextContent('claude-sonnet-5,claude-haiku-5');
    expect(mockListActiveModels).toHaveBeenCalledWith('sk-ant-key');
  });

  it('keeps the saved model when listing models fails', async () => {
    mockListActiveModels.mockRejectedValue(new Error('network'));
    render(
      <AnthropicProvider>
        <ModelConsumer />
      </AnthropicProvider>
    );

    sendKeyMessage({
      type: MESSAGE_TYPE.HAS_ANTHROPIC_KEY,
      hasKey: true,
      key: 'sk-ant-key',
      model: { id: 'claude-sonnet-5', displayName: 'Claude Sonnet 5' },
    });

    await waitFor(() => expect(mockListActiveModels).toHaveBeenCalled());
    expect(screen.getByTestId('model')).toHaveTextContent('claude-sonnet-5');
    expect(screen.getByTestId('available')).toBeEmptyDOMElement();
  });

  it('saves a selected model through the plugin', async () => {
    mockListActiveModels.mockResolvedValue([
      createModelInfo('claude-sonnet-5', 'Claude Sonnet 5', 'sonnet'),
      createModelInfo('claude-haiku-5', 'Claude Haiku 5', 'haiku'),
    ]);
    render(
      <AnthropicProvider>
        <ModelConsumer />
      </AnthropicProvider>
    );
    sendKeyMessage({ type: MESSAGE_TYPE.HAS_ANTHROPIC_KEY, hasKey: true, key: 'sk-ant-key' });
    await waitFor(() => expect(screen.getByTestId('model')).toHaveTextContent('claude-haiku-5'));

    fireEvent.click(screen.getByRole('button', { name: 'Use Sonnet' }));

    expect(screen.getByTestId('model')).toHaveTextContent('claude-sonnet-5');
    expect(parent.postMessage).toHaveBeenCalledWith(
      {
        pluginMessage: {
          type: MESSAGE_TYPE.UPDATE_ANTHROPIC_MODEL,
          model: { id: 'claude-sonnet-5', displayName: 'Claude Sonnet 5', supportsLowEffort: false },
        },
      },
      '*'
    );
  });
});
