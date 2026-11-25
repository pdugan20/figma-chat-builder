import maskApiKey from '../api-key';

describe('maskApiKey', () => {
  it('keeps the key type prefix and the last four characters', () => {
    expect(maskApiKey('sk-ant-api03-abcdefghijklmnopqrstuvwxyz-WXYZ')).toBe('sk-ant-••••••••WXYZ');
  });

  it('masks short keys completely', () => {
    expect(maskApiKey('sk-ant-1234')).toBe('••••••••');
  });
});
