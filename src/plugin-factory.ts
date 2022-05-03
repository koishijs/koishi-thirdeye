import { Context } from 'koishi';
import { AnyClass, ClassType, Mixin } from 'schemastery-gen';
import { PluginSchema } from './decorators';
import { PartialDeep } from './base-plugin';

export function CreatePluginFactory<C, IC, P extends { config: IC }>(
  basePlugin: new (ctx: Context, config: C) => P,
  baseConfig: ClassType<IC>,
): <S>(specificConfig?: ClassType<S>) => new (
  ctx: Context,
  config: PartialDeep<S> & C,
) => Omit<P, 'config'> & {
  config: IC & S;
};
export function CreatePluginFactory(
  basePlugin: new (ctx: Context, config: any) => any,
  baseConfig: AnyClass,
) {
  return (specificConfig: AnyClass) => {
    const plugin = class specificPlugin extends basePlugin {};
    const config = specificConfig
      ? Mixin(specificConfig, baseConfig)
      : baseConfig;
    PluginSchema(config)(plugin);
    return plugin;
  };
}
