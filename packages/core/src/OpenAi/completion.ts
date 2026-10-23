import { Schema } from 'effect';
import { AssistantMessage } from './message.ts';

export const Usage = Schema.Struct({
  promptTokens: Schema.Int,
  completionTokens: Schema.Int,
  totalTokens: Schema.Int,
}).pipe(
  Schema.encodeKeys({
    promptTokens: 'prompt_tokens',
    completionTokens: 'completion_tokens',
    totalTokens: 'total_tokens',
  })
);
export type Usage = typeof Usage.Type;

const Choice = Schema.Struct({
  // Kept as a plain string: providers return values beyond the OpenAI spec.
  finishReason: Schema.String,
  message: AssistantMessage,
}).pipe(Schema.encodeKeys({ finishReason: 'finish_reason' }));

export const ChatCompletion = Schema.Struct({
  choices: Choice.pipe(Schema.Array),
  usage: Usage,
});
export type ChatCompletion = typeof ChatCompletion.Type;
