import { ModelDecorators } from 'minato-decorators';
import { Tables } from 'koishi';

export const {
  DefineModel,
  ModelField,
  Primary,
  PrimaryGenerated,
  Foreign,
  Unique,
  ChildModel,
} = new ModelDecorators<Tables>();
