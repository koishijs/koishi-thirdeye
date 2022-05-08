import { Dict, Selection } from 'koishi';
import { ClassPluginConfig, PluginClass } from '../def';
import { BasePlugin } from '../base-plugin';
import { LifecycleEvents } from '../register';
import { reflector } from '../meta/meta-fetch';
import { ClassType, SchemaProperty } from 'schemastery-gen';
import { CreatePluginFactory } from '../plugin-factory';
import { ClonePlugin } from '../utility/clone-plugin';
import { UseEvent } from 'koishi-decorators';

type MapPluginToConfig<M extends Dict<PluginClass>> = {
  [K in keyof M]: ClassPluginConfig<M[K]> & Selection;
};

export class MapPluginBase<M extends Dict<PluginClass>>
  extends BasePlugin<MapPluginToConfig<M>, Partial<MapPluginToConfig<M>>>
  implements LifecycleEvents
{
  _getDict(): M {
    throw new Error('not implemented');
  }

  _instanceMap = new Map<string, PluginClass>();
  getInstance<K extends keyof M>(key: K): M[K] {
    return this._instanceMap?.get(key as string) as M[K];
  }

  onApply() {
    const dict = this._getDict();
    for (const [key, plugin] of Object.entries(dict)) {
      if (this.config[key] == null) continue;
      const ctx =
        typeof this.config[key] === 'object'
          ? this.ctx.select(this.config[key])
          : this.ctx;
      const clonedPlugin = ClonePlugin(
        plugin,
        `${this.constructor.name}_${plugin.name}_dict_${key}`,
        (o) => this._instanceMap.set(key, o),
      );
      ctx.plugin(clonedPlugin, this.config[key]);
    }
  }

  @UseEvent('dispose')
  _onThingsDispose() {
    delete this._instanceMap;
  }
}
function MappedConfig<M extends Dict<PluginClass>>(
  dict: M,
): ClassType<MapPluginToConfig<M>> {
  const PropertySchema = class SpecificPropertySchema {} as ClassType<
    MapPluginToConfig<M>
  >;
  for (const [key, plugin] of Object.entries(dict)) {
    const propertySchemaClass =
      plugin['Config'] ||
      plugin['schema'] ||
      reflector.get('KoishiPredefineSchema', plugin);
    SchemaProperty({
      type: propertySchemaClass,
    })(PropertySchema.prototype, key);
  }
  return PropertySchema;
}

export function MapPlugin<M extends Dict<PluginClass>, OuterConfig>(
  dict: M,
  outerConfig?: ClassType<OuterConfig>,
) {
  const basePlugin = class SpecificMapPlugin extends MapPluginBase<M> {
    _getDict() {
      return dict;
    }
  };
  const schema = MappedConfig(dict);
  const factory = CreatePluginFactory(basePlugin, schema);
  return factory(outerConfig);
}
