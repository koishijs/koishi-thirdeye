import { Context } from 'koishi';
import { ClassType } from 'schemastery-gen';
import { Fork, InjectConfig, PluginSchema } from './decorators';
import { ExactClassPluginConfig, PluginClass, TypeFromClass } from './def';
import { LifecycleEvents } from './register';

export type PartialDeep<T> = T extends
  | string
  | number
  | bigint
  | boolean
  | null
  | undefined
  | symbol
  | Date
  // eslint-disable-next-line @typescript-eslint/ban-types
  | Function
  ? T | undefined
  : // Arrays, Sets and Maps and their readonly counterparts have their items made
  // deeply partial, but their own instances are left untouched
  T extends Array<infer ArrayType>
  ? Array<PartialDeep<ArrayType>>
  : T extends ReadonlyArray<infer ArrayType>
  ? ReadonlyArray<ArrayType>
  : T extends Set<infer SetType>
  ? Set<PartialDeep<SetType>>
  : T extends ReadonlySet<infer SetType>
  ? ReadonlySet<SetType>
  : T extends Map<infer KeyType, infer ValueType>
  ? Map<PartialDeep<KeyType>, PartialDeep<ValueType>>
  : T extends ReadonlyMap<infer KeyType, infer ValueType>
  ? ReadonlyMap<PartialDeep<KeyType>, PartialDeep<ValueType>>
  : // ...and finally, all other objects.
    {
      [K in keyof T]?: PartialDeep<T[K]>;
    };

export class BasePlugin<C, PC = PartialDeep<C>> {
  constructor(public ctx: Context, config: PC) {}

  @InjectConfig()
  config: C;
}

export function StarterPlugin<C>(config: ClassType<C>) {
  const plugin = class StarterPluginBase extends BasePlugin<C> {};
  PluginSchema(config)(plugin);
  return plugin;
}

export function ParentPlugin<PC extends PluginClass>(child: PC) {
  const plugin = class ParentPluginBase
    extends StarterPlugin<ExactClassPluginConfig<PC>>(child['Config'])
    implements LifecycleEvents
  {
    onFork(instance: TypeFromClass<PC>): void | Promise<void> {}
    onForkDisconnect(instance: TypeFromClass<PC>): void | Promise<void> {}
  };
  Fork(child)(plugin);
  return plugin;
}

export function ParentPluginSet<PC extends PluginClass>(child: PC) {
  return class ParentPluginSet extends ParentPlugin(child) {
    instances = new Set<TypeFromClass<PC>>();

    onFork(instance: TypeFromClass<PC>) {
      this.instances.add(instance);
    }

    onForkDisconnect(instance: TypeFromClass<PC>) {
      this.instances.delete(instance);
    }
  };
}

export function ParentPluginMap<PC extends PluginClass, R>(
  child: PC,
  classifyFunction: (instance: TypeFromClass<PC>) => R,
) {
  return class ParentPluginMapBase extends ParentPlugin(child) {
    instances = new Map<R, TypeFromClass<PC>>();

    onFork(instance: TypeFromClass<PC>) {
      this.instances.set(classifyFunction(instance), instance);
    }

    onForkDisconnect(instance: TypeFromClass<PC>) {
      this.instances.delete(classifyFunction(instance));
    }
  };
}
