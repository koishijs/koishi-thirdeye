import { MappingPluginBase, MapPluginToConfig } from './mapping-base';
import {
  ClassType,
  CreatePluginFactory,
  getPluginSchema,
  Mixin,
  PluginRegistrar,
} from 'cordis-decorators';
import PluginClass = PluginRegistrar.PluginClass;
import { Context, Dict } from 'koishi';

type UnionToIntersection<T> = (T extends any ? (x: T) => any : never) extends (
  x: infer R,
) => any
  ? R
  : never;

type MergePluginConfig<
  Ctx extends Context,
  M extends Dict<PluginClass<Ctx>>,
> = UnionToIntersection<MapPluginToConfig<Ctx, M>[keyof M]>;

export function MergePlugin<
  Ctx extends Context,
  M extends Dict<PluginClass<Ctx>>,
  OuterConfig,
>(dict: M, outerConfig?: ClassType<OuterConfig>) {
  const basePlugin = class SpecificMapPlugin extends MappingPluginBase<
    Ctx,
    M,
    MergePluginConfig<Ctx, M>,
    MergePluginConfig<Ctx, M>
  > {
    _getDict() {
      return dict;
    }
    _getPluginConfig(key: keyof M): any {
      return this.config;
    }
  };
  const schemas = Object.values(dict)
    .map((plugin) => getPluginSchema(plugin))
    .filter((v) => !!v);
  const factory = CreatePluginFactory(basePlugin, Mixin(...schemas));
  return factory(outerConfig);
}
