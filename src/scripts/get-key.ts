import { HasKeyMessage } from '../types/plugin/messages';
import { MESSAGE_TYPE } from '../constants/messages';
import { parseModelOption } from '../utils/models';

export default async function getAnthropicKey(): Promise<void> {
  try {
    const [key, savedModel] = await Promise.all([
      figma.clientStorage.getAsync('anthropicKey'),
      figma.clientStorage.getAsync('anthropicModel'),
    ]);
    const model = parseModelOption(savedModel);
    const message: HasKeyMessage = {
      type: MESSAGE_TYPE.HAS_ANTHROPIC_KEY,
      hasKey: Boolean(key),
      ...(key && { key }),
      ...(model && { model }),
    };

    figma.ui.postMessage(message);
  } catch (error) {
    figma.notify('Error retrieving API key.', { error: true, timeout: 5000 });

    const message: HasKeyMessage = {
      type: MESSAGE_TYPE.HAS_ANTHROPIC_KEY,
      hasKey: false,
    };

    figma.ui.postMessage(message);
  }
}
