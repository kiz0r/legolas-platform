import { Schema } from 'effect';

export const ModelId = Schema.String.pipe(Schema.brand('@legolas/core/ModelId'));
export type ModelId = typeof ModelId.Type;
