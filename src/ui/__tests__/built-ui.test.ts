/* eslint-disable testing-library/no-node-access -- loading the built HTML page needs direct DOM access */
import fs from 'node:fs';
import path from 'node:path';
import { screen, waitFor } from '@testing-library/react';
import { MESSAGE_TYPE } from '../../constants/messages';

const BUILT_UI_PATH = path.resolve(__dirname, '../../../dist/ui.html');
// jsdom can't parse the Tailwind 4 stylesheet. Figma's browser can, so the warning is ignored.
const JSDOM_STYLESHEET_WARNING = 'Could not parse CSS stylesheet';

function sendPluginMessage(pluginMessage: Record<string, unknown>) {
  window.dispatchEvent(new MessageEvent('message', { data: { pluginMessage } }));
}

// The plugin sends these once the UI has mounted. React mounts asynchronously, so the test
// repeats them until the UI is listening.
function sendStartupMessages() {
  sendPluginMessage({ type: MESSAGE_TYPE.HAS_ANTHROPIC_KEY, hasKey: false });
  sendPluginMessage({ type: MESSAGE_TYPE.HAS_FONTS, hasFonts: true });
  sendPluginMessage({ type: MESSAGE_TYPE.HAS_COMPONENT_LIBRARY, hasLibrary: true });
  sendPluginMessage({ type: MESSAGE_TYPE.HAS_LOCAL_COMPONENTS, hasLocalComponents: true });
}

// Runs the production bundle the way Figma does, so bundler problems that unit tests can't
// see, such as a module swapped for a throwing stub, fail the suite. CI builds before testing.
describe('built plugin UI', () => {
  it('loads dist/ui.html and renders the first screen', async () => {
    if (!fs.existsSync(BUILT_UI_PATH)) {
      throw new Error('dist/ui.html is missing. Run npm run build before this test.');
    }
    const builtDocument = new DOMParser().parseFromString(fs.readFileSync(BUILT_UI_PATH, 'utf8'), 'text/html');
    const bundle = builtDocument.querySelector('script')?.textContent ?? '';
    document.body.innerHTML = builtDocument.body.innerHTML;

    const pageErrors: string[] = [];
    window.addEventListener('error', (event) => pageErrors.push(event.message));
    const consoleError = jest.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      const message = String(args[0]);
      if (!message.includes(JSDOM_STYLESHEET_WARNING)) {
        pageErrors.push(message);
      }
    });

    window.eval(bundle);
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await waitFor(() => {
      sendStartupMessages();
      expect(screen.getByText('Get started')).toBeInTheDocument();
    });
    expect(pageErrors).toEqual([]);
    consoleError.mockRestore();
  });
});
