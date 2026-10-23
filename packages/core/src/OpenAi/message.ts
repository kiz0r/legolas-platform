import { Schema } from 'effect';

export const ToolCall = Schema.Struct({
  id: Schema.String,
  type: Schema.Literal('function'),
  function: Schema.Struct({
    name: Schema.String,
    /** JSON-encoded arguments, parse them separately. */
    arguments: Schema.String,
  }),
});
export type ToolCall = typeof ToolCall.Type;

export const SystemMessage = Schema.Struct({
  role: Schema.Literal('system'),
  content: Schema.String,
});

export const UserMessage = Schema.Struct({
  role: Schema.Literal('user'),
  content: Schema.String,
});

export const AssistantMessage = Schema.Struct({
  role: Schema.Literal('assistant'),
  content: Schema.String.pipe(Schema.NullOr),
  toolCalls: ToolCall.pipe(Schema.Array, Schema.optionalKey),
}).pipe(Schema.encodeKeys({ toolCalls: 'tool_calls' }));

export const ToolMessage = Schema.Struct({
  role: Schema.Literal('tool'),
  toolCallId: Schema.String,
  content: Schema.String,
}).pipe(Schema.encodeKeys({ toolCallId: 'tool_call_id' }));

export const Message = Schema.Union([SystemMessage, UserMessage, AssistantMessage, ToolMessage]);
export type Message = typeof Message.Type;
