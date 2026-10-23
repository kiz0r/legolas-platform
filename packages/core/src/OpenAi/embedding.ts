import { Schema } from 'effect';

/** A single embedding vector. */
export const Embedding = Schema.Finite.pipe(Schema.Array);
export type Embedding = typeof Embedding.Type;
