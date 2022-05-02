import { ClonePlugin } from './utility/clone-plugin';
import { Context } from 'koishi';
import { PartialDeep } from './base-plugin';
import { ClassPluginConfig, MultiPluginConfig, TypeFromClass } from './def';
import { ClassType } from 'schemastery-gen';
import { ToInstancesConfig } from './utility/to-instance-config';
import Schema from 'schemastery';
import { InjectConfig, PluginSchema, UsingService } from './decorators';
import { UseEvent } from 'koishi-decorators';

export class MultiInstancePluginFramework<
  InnerPlugin extends new (ctx: Context, config: any) => any,
  OuterConfig,
> {
  constructor(
    public ctx: Context,
    config: MultiPluginConfig<
      ClassPluginConfig<InnerPlugin>,
      PartialDeep<OuterConfig>
    >,
  ) {}

  @InjectConfig()
  config: MultiPluginConfig<ClassPluginConfig<InnerPlugin>, OuterConfig>;

  instances: TypeFromClass<InnerPlugin>[] = [];

  _getInnerPlugin(): new (
    ctx: Context,
    config: ClassPluginConfig<InnerPlugin>,
  ) => any {
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
  const pluginClass = class SpecificMultiInstancePlugin extends MultiInstancePluginFramework<
    InnerPlugin,
    OuterConfig
  > {
    _getInnerPlugin() {
      return innerPlugin;
    }
  };
  const schema = ToInstancesConfig(
    (innerPlugin['Config'] ||
      innerPlugin['schema'] ||
      Schema.any()) as ClassType<ClassPluginConfig<InnerPlugin>>,
    outerConfig,
  );

  if (schema) {
    PluginSchema(schema)(pluginClass);
  }
  if (innerPlugin['using']) {
    UsingService(...(innerPlugin['using'] as (keyof Context.Services)[]))(
      pluginClass,
    );
  }

  return pluginClass;
}
