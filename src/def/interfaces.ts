import { Context } from 'koishi';
import { KoishiPluginRegistrationOptions, PluginClass } from '../register';

// Command stuff

export type SystemInjectFun = <T = any>(
  obj: PluginClass<T>,
  pluginMeta: KoishiPluginRegistrationOptions<T>,
) => any;

export interface ProvideOptions {
  immediate?: boolean;
}

export interface ProvideDefinition extends ProvideOptions {
  serviceName: keyof Context.Services;
}
