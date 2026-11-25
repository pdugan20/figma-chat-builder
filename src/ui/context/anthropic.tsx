import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import type Anthropic from '@anthropic-ai/sdk';
import { listActiveModels } from '../../api/anthropic';
import { MESSAGE_TYPE } from '../../constants/messages';
import { ModelOption } from '../../types/api';
import { chooseModel, parseModelOption, toModelOption } from '../../utils/models';

interface AnthropicContextType {
  anthropicKey: string | null;
  setAnthropicKey: (key: string | null) => void;
  isLoading: boolean;
  model: ModelOption;
  availableModels: ModelOption[];
  selectModel: (modelId: string) => void;
}

const AnthropicContext = createContext<AnthropicContextType | undefined>(undefined);

export function AnthropicProvider({ children }: { children: ReactNode }) {
  const [anthropicKey, setAnthropicKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savedModel, setSavedModel] = useState<ModelOption | null>(null);
  const [activeModels, setActiveModels] = useState<Anthropic.ModelInfo[]>([]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { type } = event.data.pluginMessage;

      switch (type) {
        case 'HAS_ANTHROPIC_KEY':
          if (event.data.pluginMessage.hasKey) {
            setAnthropicKey(event.data.pluginMessage.key);
          }
          setSavedModel(parseModelOption(event.data.pluginMessage.model));
          setIsLoading(false);
          break;

        case 'UPDATE_ANTHROPIC_KEY':
          if (event.data.pluginMessage.keyDidUpdate) {
            setAnthropicKey(event.data.pluginMessage.key);
          }
          break;

        default:
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (!anthropicKey) {
      return undefined;
    }

    let isCurrentKey = true;
    listActiveModels(anthropicKey)
      .then((models) => {
        if (isCurrentKey) {
          setActiveModels(models);
        }
      })
      .catch(() => {
        // Generation still works with the saved or fallback model.
        if (isCurrentKey) {
          setActiveModels([]);
        }
      });

    return () => {
      isCurrentKey = false;
    };
  }, [anthropicKey]);

  const selectModel = useCallback(
    (modelId: string) => {
      const selected = activeModels.find((model) => model.id === modelId);
      if (!selected) {
        return;
      }
      const option = toModelOption(selected);
      setSavedModel(option);
      parent.postMessage({ pluginMessage: { type: MESSAGE_TYPE.UPDATE_ANTHROPIC_MODEL, model: option } }, '*');
    },
    [activeModels]
  );

  const value = useMemo(
    () => ({
      anthropicKey,
      setAnthropicKey,
      isLoading,
      model: chooseModel(activeModels, savedModel),
      availableModels: activeModels.map(toModelOption),
      selectModel,
    }),
    [anthropicKey, isLoading, activeModels, savedModel, selectModel]
  );

  return <AnthropicContext.Provider value={value}>{children}</AnthropicContext.Provider>;
}

export function useAnthropic() {
  const context = useContext(AnthropicContext);
  if (context === undefined) {
    throw new Error('useAnthropic must be used within an AnthropicProvider');
  }
  return context;
}
