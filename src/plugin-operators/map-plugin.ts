import {
  MappingPluginBase,
  MapPluginToConfig,
  MapPluginToConfigWithSelection,
} from './mapping-base';
import {
  ClassType,
  CreatePluginFactory,
  getPluginSchema,
  PluginRegistrar,
  SchemaProperty,
} from 'cordis-decorators';
import PluginClass = PluginRegistrar.PluginClass;
import { Context, Dict } from 'koishi';

function MappedConfig<
  Ctx extends Context,
  M extends Dict<PluginClass<Context>>,
>(dict: M): ClassType<MapPluginToConfigWithSelection<Ctx, M>> {
  const PropertySchema = class SpecificPropertySchema {} as ClassType<
    MapPluginToConfigWithSelection<Ctx, M>
  >;
  for (const [key, plugin] of Object.entries(dict)) {
    SchemaProperty({
      type: getPluginSchema(plugin),
    })(PropertySchema.prototype, key);
  }
  return PropertySchema;
}

export function MapPlugin<
  Ctx extends Context,
  M extends Dict<PluginClass<Ctx>>,
  OuterConfig,
>(dict: M, outerConfig?: ClassType<OuterConfig>) {
  const basePlugin = class SpecificMapPlugin extends MappingPluginBase<
    Ctx,
    M,
    MapPluginToConfig<Ctx, M>,
    Partial<MapPluginToConfigWithSelection<Ctx, M>>
  > {
    _getDict() {
      return dict;
    }
    _getPluginConfig(key: keyof M): any {
      return this.config[key];
    }
  };
  const schema = MappedConfig(dict);
  const factory = CreatePluginFactory(basePlugin, schema);
  return factory(outerConfig);
}
