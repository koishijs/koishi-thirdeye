import { Dict } from 'koishi';
import { MapPluginToConfigWithSelection, PluginClass } from '../def';
import { ClassType, SchemaProperty } from 'schemastery-gen';
import { CreatePluginFactory } from '../plugin-factory';
import { MappingPluginBase } from './mapping-base';
import { getPluginSchema } from '../utility/get-schema';

function MappedConfig<M extends Dict<PluginClass>>(
  dict: M,
): ClassType<MapPluginToConfigWithSelection<M>> {
  const PropertySchema = class SpecificPropertySchema {} as ClassType<
    MapPluginToConfigWithSelection<M>
  >;
  for (const [key, plugin] of Object.entries(dict)) {
    SchemaProperty({
      type: getPluginSchema(plugin),
    })(PropertySchema.prototype, key);
  }
  return PropertySchema;
}

export function MapPlugin<M extends Dict<PluginClass>, OuterConfig>(
  dict: M,
  outerConfig?: ClassType<OuterConfig>,
) {
  const basePlugin = class SpecificMapPlugin extends MappingPluginBase<
    M,
    MapPluginToConfigWithSelection<M>,
    Partial<MapPluginToConfigWithSelection<M>>
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
