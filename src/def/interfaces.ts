import { Context, Dict, Selection } from 'koishi';
import { PluginMeta } from '../register';

export * from 'koishi-decorators/dist/src/def/interfaces';

// Command stuff

export type SystemInjectFun = <T = any>(obj: PluginMeta<T>) => any;

export interface ProvideOptions {
  immediate?: boolean;
}

export interface ProvideDefinition extends ProvideOptions {
  serviceName: keyof Context.Services;
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

export type MapPluginToConfig<M extends Dict<PluginClass>> = {
  [K in keyof M]: ClassPluginConfig<M[K]>;
};

export type MapPluginToConfigWithSelection<M extends Dict<PluginClass>> = {
  [K in keyof M]: ClassPluginConfig<M[K]> & Selection;
};

export type TypedMethodDecorator<T> = <P>(
  target: T,
  propertyKey: string | symbol,
  descriptor: TypedPropertyDescriptor<P>,
) => void;
