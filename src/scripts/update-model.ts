import { parseModelOption } from '../utils/models';

export default async function updateAnthropicModel(value: unknown): Promise<void> {
  const model = parseModelOption(value);
  if (!model) {
    return;
  }

  try {
    await figma.clientStorage.setAsync('anthropicModel', model);
  } catch (error) {
    figma.notify('Your model choice could not be saved. Please try again.', { error: true, timeout: 5000 });
  }
}
