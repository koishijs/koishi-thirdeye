import { BasePlugin, PartialDeep, PluginRegistrar } from 'cordis-decorators';
import { selectContext, Selection } from '../utility/select-context';
import PluginClass = PluginRegistrar.PluginClass;
import { Context, Dict } from 'koishi';
import { koishiRegistrar } from '../registrar';
import { ClonePlugin } from '../utility/clone-plugin';
import ClassPluginConfig = PluginRegistrar.ClassPluginConfig;
import { Apply } from 'cordis-decorators/dist/src/decorators';

export interface WithSelection {
  $filter?: Selection;
}

export type MapPluginToConfig<
  Ctx extends Context,
  M extends Dict<PluginClass<Ctx>>,
> = {
  [K in keyof M]: ClassPluginConfig<M[K]>;
};

export type MapPluginToConfigWithSelection<
  Ctx extends Context,
  M extends Dict<PluginClass<Ctx>>,
> = {
  [K in keyof M]: ClassPluginConfig<M[K]> & WithSelection;
};

export class MappingPluginBase<
  Ctx extends Context,
  M extends Dict<PluginClass<Ctx>>,
  C,
  PC = PartialDeep<C>,
> extends BasePlugin<Ctx, C, PC> {
  _getDict(): M {
    throw new Error('not implemented');
  }

  _instanceMap = new Map<string, PluginClass<Ctx>>();
  getInstance<K extends keyof M>(key: K): M[K] {
    return this._instanceMap?.get(key as string) as M[K];
  }

  _getPluginConfig(key: keyof M): any {
    return {};
  }

  @Apply()
  _registerInstances() {
    const dict = this._getDict();
    for (const [key, plugin] of Object.entries(dict)) {
      const config = this._getPluginConfig(key);
      if (config == null) continue;
      const ctx = config['$filter']
        ? selectContext(this.ctx, config.$filter)
        : this.ctx;
      const clonedPlugin = ClonePlugin(
        plugin,
        `${this.constructor.name}_${plugin.name}_dict_${key}`,
        (o) => this._instanceMap.set(key, o),
      );
      ctx.plugin(clonedPlugin, config);
    }
  }

  @(koishiRegistrar.methodDecorators().UseEvent('dispose'))
  _onThingsDispose() {
    delete this._instanceMap;
  }
}
