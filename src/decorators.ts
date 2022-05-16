import 'reflect-metadata';
import { App, Context, Flatten, Keys, Schema, Selection, Tables } from 'koishi';
import { Metadata } from './meta/metadata.decorators';
import {
  Condition,
  KoishiAddUsingList,
  KoishiPartialUsing,
  KoishiServiceInjectSym,
  KoishiServiceInjectSymKeys,
  KoishiServiceProvideSym,
  KoishiSystemInjectSym,
  KoishiSystemInjectSymKeys,
  ProvideOptions,
  SystemInjectFun,
} from './def';
import { TopLevelAction } from 'koishi-decorators';
import { ModelClassType, ModelRegistrar } from 'minato-decorators';
import { ClassType } from 'schemastery-gen';

// Export all koishi-decorator decorators

export * from 'koishi-decorators/dist/src/decorators';
export * from 'koishi-decorators/dist/src/http-decorators';
export { PluginDef } from 'koishi-decorators';

// Service API

export function Inject(
  name?: keyof Context.Services,
  addUsing?: boolean,
): PropertyDecorator;
export function Inject(addUsing?: boolean): PropertyDecorator;
export function Inject(
  ...args: [(keyof Context.Services | boolean)?, boolean?]
): PropertyDecorator {
  let name: keyof Context.Services;
  let addUsing = false;
  if (args.length === 1) {
    if (typeof args[0] === 'boolean') {
      addUsing = args[0];
    } else {
      name = args[0];
    }
  } else if (args.length >= 2) {
    name = args[0] as keyof Context.Services;
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
    const serviceName = name || (key as keyof Context.Services);
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
  name: keyof Context.Services,
  options?: ProvideOptions,
): ClassDecorator {
  Context.service(name);
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
export const Caller = () =>
  InjectSystem((obj) => {
    const targetCtx: Context = obj[Context.current] || obj.__ctx;
    return targetCtx;
  });

export function UsingService(
  ...services: (keyof Context.Services)[]
): ClassDecorator & MethodDecorator {
  return (obj, key?) => {
    for (const service of services) {
      if (!key) {
        // fallback to KoishiAddUsingList
        Metadata.appendUnique(KoishiAddUsingList, service)(obj);
      } else {
        Metadata.appendUnique(KoishiPartialUsing, service)(obj, key);
      }
    }
  };
}

export const PluginSchema = (schema: Schema | ClassType<any>) =>
  Metadata.set('KoishiPredefineSchema', schema);

export const PluginName = (name: string) =>
  Metadata.set('KoishiPredefineName', name);

export const If = <T>(func: Condition<boolean, T>): MethodDecorator =>
  Metadata.append('KoishiIf', func);

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
