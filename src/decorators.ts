import 'reflect-metadata';
import { App, Context, Flatten, Keys, Schema, Selection, Tables } from 'koishi';
import { Metadata } from './meta/metadata.decorators';
import {
  Condition,
  KoishiAddUsingList,
  KoishiServiceInjectSym,
  KoishiServiceInjectSymKeys,
  KoishiServiceProvideSym,
  KoishiSystemInjectSym,
  KoishiSystemInjectSymKeys,
  PluginClass,
  ProvideOptions,
  ServiceName,
  SystemInjectFun,
} from './def';
import { CallbackLayer, TopLevelAction } from 'koishi-decorators';
import { ModelClassType, ModelRegistrar } from 'minato-decorators';
import { ClassType } from 'schemastery-gen';

// Export all koishi-decorator decorators

export * from 'koishi-decorators/dist/src/decorators';
export * from 'koishi-decorators/dist/src/http-decorators';
export { PluginDef } from 'koishi-decorators';

// Service API

export function Inject(
  name?: ServiceName,
  addUsing?: boolean,
): PropertyDecorator;
export function Inject(addUsing?: boolean): PropertyDecorator;
export function Inject(
  ...args: [(ServiceName | boolean)?, boolean?]
): PropertyDecorator {
  let name: ServiceName;
  let addUsing = false;
  if (args.length === 1) {
    if (typeof args[0] === 'boolean') {
      addUsing = args[0];
    } else {
      name = args[0];
    }
  } else if (args.length >= 2) {
    name = args[0] as ServiceName;
    addUsing = args[1];
  }
  return (obj, key) => {
    if (!name) {
      const functionType = Reflect.getMetadata('design:type', obj, key);
      let dec: PropertyDecorator;
      if (functionType === Context) {
        dec = InjectContext();
      } else if (functionType === App) {
        dec = InjectApp();
      }
      if (dec) {
        return dec(obj, key);
      }
    }
    const serviceName = name || (key as ServiceName);
    if (addUsing) {
      Metadata.appendUnique(KoishiAddUsingList, serviceName)(obj.constructor);
    }
    const dec = Metadata.set(
      KoishiServiceInjectSym,
      serviceName,
      KoishiServiceInjectSymKeys,
    );
    return dec(obj, key);
  };
}

export function Provide(
  name: ServiceName,
  options?: ProvideOptions,
): ClassDecorator {
  Context.service(name, options);
  return Metadata.append(KoishiServiceProvideSym, {
    ...options,
    serviceName: name,
  });
}

const InjectSystem = (fun: SystemInjectFun) =>
  Metadata.set(KoishiSystemInjectSym, fun, KoishiSystemInjectSymKeys);

export const InjectContext = (select?: Selection) =>
  InjectSystem((obj) => {
    if (select) {
      return obj.__ctx.select(select);
    } else {
      return obj.__ctx;
    }
  });
export const InjectApp = () => InjectSystem((obj) => obj.__ctx.app);
export const InjectConfig = () => InjectSystem((obj) => obj.__config);
export const InjectLogger = (name?: string) =>
  InjectSystem((obj) => obj.__ctx.logger(name || obj.constructor.name));
export const InjectParent = () => InjectSystem((obj) => obj.__ctx.__parent);
export const Caller = () =>
  InjectSystem((obj) => {
    const targetCtx: Context = obj[Context.current] || obj.__ctx;
    return targetCtx;
  });

export function UsingService(
  ...services: ServiceName[]
): ClassDecorator & MethodDecorator {
  return (obj, key?, des?) => {
    for (const service of services) {
      if (!key) {
        // fallback to KoishiAddUsingList
        Metadata.appendUnique(KoishiAddUsingList, service)(obj);
      } else {
        const dec = CallbackLayer((ctx, cb) => {
          ctx.plugin({
            name: `${ctx.state.id}_${key.toString()}`,
            using: services,
            apply: cb,
          });
        });
        dec(obj, key, des);
      }
    }
  };
}

export const PluginSchema = (schema: Schema | ClassType<any>) =>
  Metadata.set('KoishiPredefineSchema', schema);

export const PluginName = (name: string) =>
  Metadata.set('KoishiPredefineName', name);

export const If = <T>(
  func: Condition<boolean, T, [Record<string, any>]>,
): MethodDecorator =>
  Metadata.append('KoishiControl', { type: 'if', condition: func });

export const For = <T>(
  func: Condition<Iterable<Record<string, any>>, T, [Record<string, any>]>,
): MethodDecorator =>
  Metadata.append('KoishiControl', { type: 'for', condition: func });

export const UseModel = (...models: ModelClassType[]): ClassDecorator =>
  TopLevelAction((ctx) => {
    const registrar = new ModelRegistrar(ctx.model);
    models.forEach((m) => registrar.registerModel(m));
  });

export const MixinModel = <K extends Keys<Tables>>(
  tableName: K,
  classDict: {
    [F in Keys<Tables[K]>]?: ModelClassType<Flatten<Tables[K][F]>>;
  },
): ClassDecorator =>
  TopLevelAction((ctx) => {
    const registrar = new ModelRegistrar(ctx.model);
    registrar.mixinModel(tableName, classDict);
  });

export const Fork = (forkPlugin: PluginClass) =>
  Metadata.set('KoishiFork', forkPlugin);
