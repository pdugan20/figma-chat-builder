const VISIBLE_PREFIX_LENGTH = 7;
const VISIBLE_SUFFIX_LENGTH = 4;
const MASK = '••••••••';

// Shows enough of a saved key to recognize it without putting the secret on screen.
export default function maskApiKey(key: string): string {
  if (key.length <= VISIBLE_PREFIX_LENGTH + VISIBLE_SUFFIX_LENGTH) {
    return MASK;
  }
  return `${key.slice(0, VISIBLE_PREFIX_LENGTH)}${MASK}${key.slice(-VISIBLE_SUFFIX_LENGTH)}`;
}
