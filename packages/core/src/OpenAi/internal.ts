import { Schema } from 'effect';
import { Embedding } from './embedding.ts';
import { ModelId } from './model.ts';

const Model = Schema.Struct({
  modelId: ModelId,
}).pipe(Schema.encodeKeys({ modelId: 'id' }));

export const ModelsResponse = Schema.Struct({
  data: Model.pipe(Schema.Array),
});

export const EmbeddingsResponse = Schema.Struct({
  data: Schema.Struct({
    index: Schema.Int,
    embedding: Embedding,
  }).pipe(Schema.Array),
});
