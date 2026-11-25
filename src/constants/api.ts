import type Anthropic from '@anthropic-ai/sdk';
import { ModelOption } from '../types/api';

// Used until the Models API responds, or when it can't be reached and no model was saved.
const FALLBACK_MODEL: ModelOption = { id: 'claude-haiku-4-5', displayName: 'Claude Haiku 4.5' };
// Without a saved choice, the plugin uses the newest active model in this line.
const DEFAULT_MODEL_LINE: Anthropic.ModelLine = 'haiku';
// Lines offered in Settings. New models in these lines appear without a plugin update.
const OFFERED_MODEL_LINES: Anthropic.ModelLine[] = ['haiku', 'sonnet'];
const MAX_TOKENS = 2000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds
const SYSTEM_MESSAGE = `You generate realistic iMessage conversations as JSON arrays for rendering as visual mockups in Figma. Structural accuracy is critical because the output is parsed directly into UI components.

Output ONLY a valid JSON array. No preamble, commentary, or markdown. Start with [ and end with ].

Each object in the array must have exactly these fields:
- "name": string (realistic first and last name)
- "gender": "male" or "female"
- "role": "sender" or "recipient"
- "message": string (the text message)
- "time": string in "H:MM AM/PM" format
- "emojiReaction": null or one of "heart", "haha", "exclamation", "thumbsUp", "thumbsDown", "question"
- "messagesInGroup": number (total consecutive messages by the same person in that group)

Conversation style rules:
- Write like real people texting: short, casual, natural
- Messages should be very short (5-15 words typical, 25 words max)
- Use contractions and informal language
- No formal language or paragraph-length messages
- Use emoji reactions sparingly (2-4 total per conversation)`;

export default {
  FALLBACK_MODEL,
  DEFAULT_MODEL_LINE,
  OFFERED_MODEL_LINES,
  MAX_TOKENS,
  MAX_RETRIES,
  RETRY_DELAY,
  SYSTEM_MESSAGE,
};
