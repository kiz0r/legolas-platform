import { Effect, flow, Redacted, Schedule, Schema } from 'effect';
import { HttpClient, HttpClientRequest, HttpClientResponse } from 'effect/http';
import { ChatCompletion } from './completion.ts';
import type { Embedding } from './embedding.ts';
import { OpenAiError } from './errors.ts';
import { EmbeddingsResponse, ModelsResponse } from './internal.ts';
import { Message } from './message.ts';
import type { ModelId } from './model.ts';

export type OpenAiClient = {
  readonly getModels: Effect.Effect<readonly ModelId[], OpenAiError>;
  readonly chat: (
    model: ModelId,
    messages: readonly Message[]
  ) => Effect.Effect<ChatCompletion, OpenAiError>;
  readonly embed: (
    model: ModelId,
    input: readonly string[]
  ) => Effect.Effect<readonly Embedding[], OpenAiError>;
};

type MakeOptions = {
  /** OpenAI-compatible API base URL, without the version, e.g. `https://llm.ai.e-infra.cz`. */
  readonly baseUrl: string;
  readonly apiKey: Redacted.Redacted;
};

const encodeMessages = Message.pipe(Schema.Array, Schema.encodeSync);

export const make = Effect.fnUntraced(function* (options: MakeOptions) {
  const client = (yield* HttpClient.HttpClient).pipe(
    HttpClient.mapRequest(
      flow(
        HttpClientRequest.prependUrl(options.baseUrl),
        HttpClientRequest.bearerToken(Redacted.value(options.apiKey)),
        HttpClientRequest.acceptJson
      )
    ),
    HttpClient.filterStatusOk,
    // Shared clusters are sometimes busy, so retry transient errors.
    HttpClient.retryTransient({ schedule: Schedule.exponential(500), times: 3 })
  );

  const send = <S extends Schema.Top>(request: HttpClientRequest.HttpClientRequest, schema: S) =>
    client.execute(request).pipe(
      Effect.flatMap(HttpClientResponse.schemaBodyJson(schema)),
      Effect.mapError((cause) => new OpenAiError({ cause }))
    );

  const getModels = send(HttpClientRequest.get('/v1/models'), ModelsResponse).pipe(
    Effect.map((response) => response.data.map((model) => model.modelId)),
    Effect.withSpan('OpenAi.getModels')
  );

  const chat = (model: ModelId, messages: readonly Message[]) =>
    HttpClientRequest.post('/v1/chat/completions').pipe(
      HttpClientRequest.bodyJsonUnsafe({ model, messages: encodeMessages(messages) }),
      (request) => send(request, ChatCompletion),
      Effect.withSpan('OpenAi.chat')
    );

  const embed = (model: ModelId, input: readonly string[]) =>
    HttpClientRequest.post('/v1/embeddings').pipe(
      HttpClientRequest.bodyJsonUnsafe({ model, input }),
      (request) => send(request, EmbeddingsResponse),
      // The API does not promise to keep the input order, each item carries its index.
      Effect.map((response) =>
        response.data.toSorted((a, b) => a.index - b.index).map((item) => item.embedding)
      ),
      Effect.withSpan('OpenAi.embed')
    );

  return { getModels, chat, embed } satisfies OpenAiClient;
});
