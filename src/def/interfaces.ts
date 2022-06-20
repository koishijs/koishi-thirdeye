import { Context, Dict } from 'koishi';
import { PluginMeta } from '../register';
import { Selection } from 'koishi-decorators';

export * from 'koishi-decorators/dist/src/def/interfaces';

// Command stuff

export type SystemInjectFun = <T = any>(
  obj: PluginMeta<T>,
  cl: PluginClass,
) => any;

export type ServiceName = keyof Context | string;

export interface ProvideOptions extends Context.ServiceOptions {
  immediate?: boolean;
}

export interface ProvideDefinition extends ProvideOptions {
  serviceName: ServiceName;
}

export type Condition<R, T = any, Ext extends any[] = []> = (
  o: T,
  ...ext: Ext
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

export type PluginClass<C = any, P = any> = new (ctx: Context, config: C) => P;

export type ClassPluginConfig<P extends PluginClass> = P extends PluginClass<
  infer C
>
  ? C
  : never;

export type ExactClassPluginConfig<P extends PluginClass> =
  P extends PluginClass<any, { config: infer IC }> ? IC : ClassPluginConfig<P>;

export type MapPluginToConfig<M extends Dict<PluginClass>> = {
  [K in keyof M]: ClassPluginConfig<M[K]>;
};

export type MapPluginToConfigWithSelection<M extends Dict<PluginClass>> = {
  [K in keyof M]: ClassPluginConfig<M[K]> & Selection;
};

export interface ControlTypeMap {
  if: boolean;
  for: Iterable<Record<string, any>>;
}

export interface ControlType<
  T extends keyof ControlTypeMap = keyof ControlTypeMap,
> {
  type: T;
  condition: Condition<ControlTypeMap[T], any, [Record<string, any>]>;
}

export type Prop<T> = T;
