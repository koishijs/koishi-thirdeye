import { MapPluginToConfig, PluginClass } from '../def';
import { Dict } from 'koishi';
import { AnyClass, ClassType, Mixin } from 'schemastery-gen';
import { MappingPluginBase } from './mapping-base';
import { CreatePluginFactory } from '../plugin-factory';
import _ from 'lodash';
import { getPluginSchema } from '../utility/get-schema';

type UnionToIntersection<T> = (T extends any ? (x: T) => any : never) extends (
  x: infer R,
) => any
  ? R
  : never;

type MergePluginConfig<M extends Dict<PluginClass>> = UnionToIntersection<
  MapPluginToConfig<M>[keyof M]
>;

export function MergePlugin<M extends Dict<PluginClass>, OuterConfig>(
  dict: M,
  outerConfig?: ClassType<OuterConfig>,
) {
  const basePlugin = class SpecificMapPlugin extends MappingPluginBase<
    M,
    MergePluginConfig<M>,
    MergePluginConfig<M>
  > {
    _getDict() {
      return dict;
    }
    _getPluginConfig(key: keyof M): any {
      return this.config;
    }
  };
  const schemas = _.compact(
    Object.values(dict).map((plugin) => getPluginSchema(plugin)),
  );
  const factory = CreatePluginFactory(basePlugin, Mixin(...schemas));
  return factory(outerConfig);
}
