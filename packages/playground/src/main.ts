import { NodeRuntime } from '@effect/platform-node';
import { OpenAi } from '@legolas/core';
import { Config, Duration, Effect } from 'effect';
import { FetchHttpClient } from 'effect/http';

const program = Effect.gen(function* () {
  const llm = yield* OpenAi.make({
    baseUrl: yield* Config.String('LLM_BASE_URL'),
    apiKey: yield* Config.Redacted('LLM_API_KEY'),
  });

  const chatModel = OpenAi.ModelId.make(
    yield* Config.String('CHAT_MODEL').pipe(Config.withDefault('deepseek-v4.1-flash'))
  );
  const embeddingModel = OpenAi.ModelId.make(
    yield* Config.String('EMBEDDING_MODEL').pipe(Config.withDefault('qwen3-embedding-4b'))
  );

  // 1. Which models can we see?
  const models = yield* llm.getModels;
  yield* Effect.log(`Available models:\n${models.map((id) => `  - ${id}`).join('\n')}`);

  // 2. Ask an LLM a question
  const [chatTime, chat] = yield* Effect.timed(
    llm.chat(chatModel, [{ role: 'user', content: 'Odpověz jednou větou: co je ČVUT?' }])
  );
  yield* Effect.log(
    `Chat (${chatModel}, ${Math.round(Duration.toMillis(chatTime))} ms): ${chat.choices[0]?.message.content}`
  );
  yield* Effect.log(`Usage: ${JSON.stringify(chat.usage)}`);

  // 3. Turn texts into embeddings
  const texts = ['Podmínky ukončení studia', 'Conditions for terminating studies'];
  const [embedTime, vectors] = yield* Effect.timed(llm.embed(embeddingModel, texts));
  yield* Effect.log(
    `Embeddings (${embeddingModel}, ${Math.round(Duration.toMillis(embedTime))} ms): ` +
      vectors.map((vector, i) => `\n  - "${texts[i]}": ${vector.length} dimensions`).join('')
  );
});

program.pipe(Effect.provide(FetchHttpClient.layer), NodeRuntime.runMain);
