import { Context } from 'koishi';
import { AnyClass, ClassType, Mixin } from 'schemastery-gen';
import { PluginSchema } from './decorators';
import { PartialDeep } from './base-plugin';
import { PluginClass } from './def';

export function CreatePluginFactory<C, IC, P extends { config: IC }>(
  basePlugin: PluginClass<C, P>,
  baseConfig: ClassType<IC>,
): <S>(specificConfig?: ClassType<S>) => new (
  ctx: Context,
  config: PartialDeep<S> & C,
) => P & {
  config: IC & S;
};
export function CreatePluginFactory(
  basePlugin: PluginClass,
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
