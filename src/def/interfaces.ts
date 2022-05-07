import { Context } from 'koishi';
import { KoishiPluginRegistrationOptions, PluginClass } from '../register';

export * from 'koishi-decorators/dist/src/def/interfaces';

// Command stuff

export type SystemInjectFun = <T = any>(obj: PluginClass<T>) => any;

export interface ProvideOptions {
  immediate?: boolean;
}

export interface ProvideDefinition extends ProvideOptions {
  serviceName: keyof Context.Services;
}

export type Condition<R, T = any> = (
  o: T,
  config: T extends { config: infer C } ? C : any,
  ctx: Context,
) => R;

export interface Instances<T> {
  instances: T[];
}

export type TypeFromClass<T> = T extends { new (...args: any[]): infer U }
  ? U
  : never;

export type ParamsFromClass<T> = T extends { new (...args: infer U): any }
  ? U
  : never;

export type MultiPluginConfig<Inner, Outer> = Instances<Inner> & Outer;

export type ClassPluginConfig<
  P extends new (ctx: Context, config: any) => any,
> = P extends new (ctx: Context, config: infer C) => any ? C : never;
