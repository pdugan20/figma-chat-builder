import { MessageType, MESSAGE_TYPE } from '../../constants/messages';
import { ModelOption } from '../api';

interface BaseMessage {
  type: MessageType;
}

export interface HasKeyMessage extends BaseMessage {
  type: typeof MESSAGE_TYPE.HAS_ANTHROPIC_KEY;
  hasKey: boolean;
  key?: string;
  model?: ModelOption;
}

export interface UpdateKeyMessage extends BaseMessage {
  type: typeof MESSAGE_TYPE.UPDATE_ANTHROPIC_KEY;
  keyDidUpdate: boolean;
  key?: string;
}
