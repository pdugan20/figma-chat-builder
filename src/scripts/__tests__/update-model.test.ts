import updateAnthropicModel from '../update-model';

describe('updateAnthropicModel', () => {
  const setAsync = jest.fn();
  const notify = jest.fn();

  beforeEach(() => {
    setAsync.mockReset();
    notify.mockReset();
    (globalThis as any).figma.clientStorage = { setAsync };
    (globalThis as any).figma.notify = notify;
  });

  it('saves a valid model', async () => {
    await updateAnthropicModel({ id: 'claude-haiku-5', displayName: 'Claude Haiku 5', supportsLowEffort: true });
    expect(setAsync).toHaveBeenCalledWith('anthropicModel', {
      id: 'claude-haiku-5',
      displayName: 'Claude Haiku 5',
      supportsLowEffort: true,
    });
  });

  it('ignores an invalid model', async () => {
    await updateAnthropicModel({ id: 42 });
    expect(setAsync).not.toHaveBeenCalled();
  });

  it('notifies the user when saving fails', async () => {
    setAsync.mockRejectedValue(new Error('storage full'));
    await updateAnthropicModel({ id: 'claude-haiku-5', displayName: 'Claude Haiku 5' });
    expect(notify).toHaveBeenCalledWith(expect.stringContaining('could not be saved'), expect.anything());
  });
});
