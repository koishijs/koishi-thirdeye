import { ClonePlugin } from './utility/clone-plugin';
import { Context } from 'koishi';
import { BasePlugin } from './base-plugin';
import { ClassPluginConfig, Instances, TypeFromClass } from './def';
import { ClassType } from 'schemastery-gen';
import { ToInstancesConfig } from './utility/to-instance-config';
import Schema from 'schemastery';
import { UsingService } from './decorators';
import { UseEvent } from 'koishi-decorators';
import { CreatePluginFactory } from './plugin-factory';

export class MultiInstancePluginFramework<
  InnerPlugin extends new (ctx: Context, config: any) => any,
> extends BasePlugin<
  Instances<ClassPluginConfig<InnerPlugin>>,
  Instances<ClassPluginConfig<InnerPlugin>>
> {
  instances: TypeFromClass<InnerPlugin>[] = [];

  _getInnerPlugin(): InnerPlugin {
    throw new Error(`Not implemented`);
  }

  _registerInstances() {
    const innerPlugin = this._getInnerPlugin();
    for (let i = 0; i < this.config.instances.length; i++) {
      const clonedInnerPlugin = ClonePlugin(
        innerPlugin,
        `${innerPlugin.name}_instance_${i}`,
        (instance) => this.instances.push(instance),
      );
      this.ctx.plugin(clonedInnerPlugin, this.config.instances[i]);
    }
  }

  @UseEvent('dispose')
  _onThingsDispose() {
    delete this.instances;
  }

  onApply() {
    this._registerInstances();
  }
}

export function MultiInstancePlugin<
  InnerPlugin extends new (ctx: Context, config: any) => any,
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
    UsingService(...(innerPlugin['using'] as (keyof Context.Services)[]))(
      plugin,
    );
  }

  return plugin;
}
