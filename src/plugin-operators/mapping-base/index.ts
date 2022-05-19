import { Dict } from 'koishi';
import { PluginClass } from '../../def';
import { BasePlugin, PartialDeep } from '../../base-plugin';
import { LifecycleEvents } from '../../register';
import { ClonePlugin } from '../../utility/clone-plugin';
import { UseEvent } from 'koishi-decorators';

export class MappingPluginBase<
    M extends Dict<PluginClass>,
    C,
    PC = PartialDeep<C>,
  >
  extends BasePlugin<C, PC>
  implements LifecycleEvents
{
  _getDict(): M {
    throw new Error('not implemented');
  }

  _instanceMap = new Map<string, PluginClass>();
  getInstance<K extends keyof M>(key: K): M[K] {
    return this._instanceMap?.get(key as string) as M[K];
  }

  _getPluginConfig(key: keyof M): any {
    return {};
  }

  onApply() {
    const dict = this._getDict();
    for (const [key, plugin] of Object.entries(dict)) {
      const config = this._getPluginConfig(key);
      if (config == null) continue;
      const ctx =
        typeof config === 'object' ? this.ctx.select(config) : this.ctx;
      const clonedPlugin = ClonePlugin(
        plugin,
        `${this.constructor.name}_${plugin.name}_dict_${key}`,
        (o) => this._instanceMap.set(key, o),
      );
      ctx.plugin(clonedPlugin, config);
    }
  }

  @UseEvent('dispose')
  _onThingsDispose() {
    delete this._instanceMap;
  }
}
