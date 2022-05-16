import { ModelDecorators } from 'minato-decorators';
import { Tables } from 'koishi';

const decorators = new ModelDecorators<Tables>();

export const DefineModel = decorators.DefineModel;
export const ModelField = decorators.ModelField;
export const Primary = decorators.Primary;
export const PrimaryGenerated = decorators.PrimaryGenerated;
export const Foreign = decorators.Foreign;
export const Unique = decorators.Unique;
export const ChildModel = decorators.ChildModel;
