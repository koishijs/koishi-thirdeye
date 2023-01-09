import {
  BasePlugin,
  ClassType,
  CreatePluginFactory,
  PluginRegistrar,
  SchemaClass,
  SchemaProperty,
  TypeFromClass,
} from 'cordis-decorators';
import { selectContext } from '../utility/select-context';
import { ClonePlugin } from '../utility/clone-plugin';
import PluginClass = PluginRegistrar.PluginClass;
import { koishiRegistrar } from '../registrar';
import { Context, Schema } from 'koishi';
import ClassPluginConfig = PluginRegistrar.ClassPluginConfig;
import { UsingService, Apply } from 'cordis-decorators/dist/src/decorators';
import { WithSelection } from './mapping-base';

export interface Instances<T> {
  instances: T[];
}

export function ToInstancesConfig<Inner extends new (...args: any[]) => any>(
  instanceConfig: Inner,
): new () => Instances<TypeFromClass<Inner>> {
  const instanceConfigClass = class InstancesConfig {
    instances: TypeFromClass<Inner>[];
  };
  SchemaProperty({
    type: SchemaClass(instanceConfig),
    default: [],
    array: true,
  })(instanceConfigClass.prototype, 'instances');
  return instanceConfigClass;
}

export class MultiInstancePluginFramework<
  Ctx extends Context,
  InnerPlugin extends PluginClass<Ctx>,
> extends BasePlugin<
  Ctx,
  Instances<ClassPluginConfig<InnerPlugin>>,
  Instances<ClassPluginConfig<InnerPlugin> & WithSelection>
> {
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
      const instanceContext = instanceConfig['$filter']
        ? selectContext(this.ctx, instanceConfig['$filter'])
        : this.ctx;
      instanceContext.plugin(clonedInnerPlugin, instanceConfig);
    }
  }

  @(koishiRegistrar.methodDecorators().UseEvent('dispose'))
  _onThingsDispose() {
    delete this.instances;
  }
}

export function MultiInstancePlugin<
  Ctx extends Context,
  InnerPlugin extends PluginClass<Ctx>,
  OuterConfig,
>(innerPlugin: InnerPlugin, outerConfig?: ClassType<OuterConfig>) {
  const basePlugin = class SpecificMultiInstancePlugin extends MultiInstancePluginFramework<
    Ctx,
    InnerPlugin
  > {
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
    UsingService(...(innerPlugin['using'] as string[]))(plugin);
  }

  return plugin;
}
