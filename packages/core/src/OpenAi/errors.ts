import { Data } from 'effect';

export class OpenAiError extends Data.TaggedError('OpenAi.OpenAiError')<{
  readonly cause: unknown;
}> {}
