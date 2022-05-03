import { Context } from 'koishi';
import { ClassType, Mixin, SchemaProperty } from 'schemastery-gen';
import { PluginSchema } from './decorators';
import { BasePlugin } from './base-plugin';

export function CreatePluginFactory<C, P>(
  basePlugin: new (ctx: Context, config: C) => P,
  baseConfig: ClassType<C>,
): <S>(specificConfig?: ClassType<S>) => new (ctx: Context, config: S & C) => P;
export function CreatePluginFactory<C, P>(
  basePlugin: new (ctx: Context, config: C) => any,
  baseConfig: ClassType<C>,
): <S>(
  specificConfig?: ClassType<S>,
) => new (ctx: Context, config: S & C) => P {
  return (specificConfig) => {
    const plugin = class specificPlugin extends basePlugin {};
    const config = specificConfig
      ? Mixin(specificConfig, baseConfig)
      : baseConfig;
    PluginSchema(config)(plugin);
    return plugin;
  };
}

class TestConfig {
  @SchemaProperty()
  foo: string;
}
