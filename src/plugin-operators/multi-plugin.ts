import { ClonePlugin } from '../utility/clone-plugin';
import { selectContext, Selection } from 'koishi-decorators';
import { BasePlugin } from '../base-plugin';
import {
  ClassPluginConfig,
  Instances,
  PluginClass,
  ServiceName,
  TypeFromClass,
} from '../def';
import { ClassType } from 'schemastery-gen';
import { ToInstancesConfig } from '../utility/to-instance-config';
import Schema from 'schemastery';
import { UsingService } from '../decorators';
import { Apply, UseEvent } from 'koishi-decorators';
import { CreatePluginFactory } from '../plugin-factory';
import { LifecycleEvents } from '../register';

export class MultiInstancePluginFramework<InnerPlugin extends PluginClass>
  extends BasePlugin<
    Instances<ClassPluginConfig<InnerPlugin>>,
    Instances<ClassPluginConfig<InnerPlugin> & Selection>
  >
  implements LifecycleEvents
{
  instances: TypeFromClass<InnerPlugin>[] = [];

  _getInnerPlugin(): InnerPlugin {
    throw new Error(`Not implemented`);
  }

  @Apply()
  _registerInstances() {
    const innerPlugin = this._getInnerPlugin();
    for (let i = 0; i < this.config.instances.length; i++) {
      const clonedInnerPlugin = ClonePlugin(
        innerPlugin,
        `${this.constructor.name}_${innerPlugin.name}_instance_${i}`,
        (instance) => this.instances.push(instance),
      );
      const instanceConfig = this.config.instances[i];
      const instanceContext =
        typeof instanceConfig === 'object'
          ? selectContext(this.ctx, instanceConfig)
          : this.ctx;
      instanceContext.plugin(clonedInnerPlugin, instanceConfig);
    }
  }

  @UseEvent('dispose')
  _onThingsDispose() {
    delete this.instances;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onApply() {}
}

export function MultiInstancePlugin<
  InnerPlugin extends PluginClass,
  OuterConfig,
>(innerPlugin: InnerPlugin, outerConfig?: ClassType<OuterConfig>) {
  const basePlugin = class SpecificMultiInstancePlugin extends MultiInstancePluginFramework<InnerPlugin> {
    _getInnerPlugin() {
      return innerPlugin;
    }
  };
  const schema = ToInstancesConfig(
    (innerPlugin['Config'] ||
      innerPlugin['schema'] ||
      Schema.any()) as ClassType<ClassPluginConfig<InnerPlugin>>,
  );

  const factory = CreatePluginFactory(basePlugin, schema);
  const plugin = factory(outerConfig);

  if (innerPlugin['using']) {
    UsingService(...(innerPlugin['using'] as ServiceName[]))(plugin);
  }

  return plugin;
}
