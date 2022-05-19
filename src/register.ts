import { Context, Plugin, Schema, WebSocketLayer } from 'koishi';
import {
  Condition,
  KoishiAddUsingList,
  KoishiPartialUsing,
  KoishiServiceInjectSym,
  KoishiServiceInjectSymKeys,
  KoishiServiceProvideSym,
  KoishiSystemInjectSym,
  KoishiSystemInjectSymKeys,
  ThirdEyeSym,
} from './def';
import { reflector } from './meta/meta-fetch';
import { SchemaClass } from 'schemastery-gen';
import _ from 'lodash';
import { Registrar, Type } from 'koishi-decorators';
import { PluginName, PluginSchema, UsingService } from './decorators';

export interface KoishiPluginRegistrationOptions<T = any> {
  name?: string;
  schema?: Schema<any, T> | Type<T>;
  using?: (keyof Context.Services)[];
}

export interface PluginMeta<T = any> {
  __ctx: Context;
  __config: T;
  __registrar: Registrar;
  __pluginOptions: KoishiPluginRegistrationOptions<T>;
}

export interface OnApply {
  onApply(): void;
}

export interface OnConnect {
  onConnect(): void | Promise<void>;
}

export interface OnDisconnect {
  onDisconnect(): void | Promise<void>;
}

export interface LifecycleEvents {
  onApply?(): void;
  onConnect?(): void | Promise<void>;
  onDisconnect?(): void | Promise<void>;
}

export function DefinePlugin<T = any>(
  options: KoishiPluginRegistrationOptions<T> = {},
) {
  return function <
    C extends {
      new (...args: any[]): any;
    } & KoishiPluginRegistrationOptions<T>,
  >(originalClass: C) {
    if (options.name) {
      PluginName(options.name)(originalClass);
    }
    if (options.schema) {
      PluginSchema(options.schema)(originalClass);
    }
    if (options.using) {
      UsingService(...options.using)(originalClass);
    }
    if (originalClass[ThirdEyeSym]) {
      return originalClass;
    }
    const newClass = class extends originalClass implements PluginMeta {
      static get Config() {
        const schemaType =
          reflector.get('KoishiPredefineSchema', newClass) ||
          reflector.get('KoishiPredefineSchema', originalClass);
        return schemaType ? SchemaClass(schemaType) : undefined;
      }

      static get using() {
        const list = reflector
          .getArray(KoishiAddUsingList, originalClass)
          .concat(reflector.getArray(KoishiAddUsingList, newClass));
        return _.uniq(list);
      }
      __ctx: Context;
      __config: T;
      __pluginOptions: KoishiPluginRegistrationOptions<T>;
      __registrar: Registrar;
      __pluginsToWaitFor: Promise<void>[];

      _handleSystemInjections() {
        const injectKeys = reflector.getArray(KoishiSystemInjectSymKeys, this);
        for (const key of injectKeys) {
          const valueFunction = reflector.get(KoishiSystemInjectSym, this, key);
          if (!valueFunction) {
            continue;
          }
          Object.defineProperty(this, key, {
            configurable: true,
            enumerable: true,
            get: () => valueFunction(this),
          });
        }
      }

      _handleServiceInjections() {
        const injectKeys = reflector.getArray(KoishiServiceInjectSymKeys, this);
        for (const key of injectKeys) {
          const name = reflector.get(KoishiServiceInjectSym, this, key);
          if (!name) {
            continue;
          }
          Object.defineProperty(this, key, {
            enumerable: true,
            configurable: true,
            get: () => {
              return this.__ctx[name];
            },
            set: (val: any) => {
              this.__ctx[name] = val;
            },
          });
        }
      }

      _registerDeclarationsProcess(
        methodKey: keyof C & string,
        ctx: Context,
        view: Record<string, any> = {},
      ) {
        const result = this.__registrar.register(ctx, methodKey, false, view);
        if (result?.type === 'ws') {
          const layer = result.result as WebSocketLayer;
          ctx.on('dispose', () => layer.close());
        } else if (result?.type === 'plugin') {
          const mayBePromise = result.result;
          if (mayBePromise instanceof Promise) {
            this.__pluginsToWaitFor.push(mayBePromise);
          }
        }
      }

      _registerDeclarationsResolving(
        methodKey: keyof C & string,
        view: Record<string, any> = {},
      ) {
        const conditions = reflector.getArray('KoishiIf', this, methodKey);
        if (
          conditions.some(
            (condition) => !condition(this, { ...this.__config, ...view }),
          )
        )
          return;
        const ctx = this.__registrar.getScopeContext(
          this.__ctx,
          methodKey,
          false,
        );
        const partialUsing = reflector.getArray(
          KoishiPartialUsing,
          this,
          methodKey,
        );
        if (partialUsing.length) {
          const name = `${newClass.name}-${methodKey}`;
          const innerPlugin: Plugin.Object = {
            name,
            using: partialUsing,
            apply: (innerCtx) =>
              this._registerDeclarationsProcess(methodKey, innerCtx, view),
          };
          ctx.plugin(innerPlugin);
        } else {
          this._registerDeclarationsProcess(methodKey, ctx, view);
        }
      }

      _registerDeclarationsWithStack(
        methodKey: keyof C & string,
        stack: Condition<
          Iterable<Record<string, any>>,
          any,
          [Record<string, any>]
        >[],
        existing: Record<string, any> = {},
      ) {
        if (!stack.length) {
          return this._registerDeclarationsResolving(methodKey, existing);
        }
        const [iter, ...rest] = stack;
        for (const view of iter(this, existing)) {
          this._registerDeclarationsWithStack(methodKey, rest, {
            ...existing,
            ...view,
          });
        }
      }

      _registerDeclarationsFor(methodKey: keyof C & string) {
        const stack = reflector.getArray('KoishiFor', this, methodKey);
        return this._registerDeclarationsWithStack(methodKey, stack);
      }

      _registerDeclarations() {
        const methodKeys =
          this.__registrar.getAllFieldsToRegister() as (keyof C & string)[];
        methodKeys.forEach((methodKey) =>
          this._registerDeclarationsFor(methodKey),
        );
      }

      _getProvidingServices() {
        return [
          ...reflector.getArray(KoishiServiceProvideSym, originalClass),
          ...reflector.getArray(KoishiServiceProvideSym, this),
        ];
      }

      _handleServiceProvide(immediate: boolean) {
        const providingServices = this._getProvidingServices().filter(
          (serviceDef) => !serviceDef.immediate === !immediate,
        );
        for (const key of providingServices) {
          this.__ctx[key.serviceName] = this as any;
        }
      }

      _uninstallServiceProvide() {
        const providingServices = this._getProvidingServices();
        for (const key of providingServices) {
          if (this.__ctx[key.serviceName] === (this as never)) {
            this.__ctx[key.serviceName] = null;
          }
        }
      }

      _registerAfterInit() {
        this.__ctx.on('ready', async () => {
          if (this.__pluginsToWaitFor.length) {
            await Promise.all(this.__pluginsToWaitFor);
            this.__pluginsToWaitFor = [];
          }
          if (typeof this.onConnect === 'function') {
            await this.onConnect();
          }
          this._handleServiceProvide(false);
        });
        this.__ctx.on('dispose', async () => {
          this._uninstallServiceProvide();
          if (typeof this.onDisconnect === 'function') {
            await this.onDisconnect();
          }
        });
      }

      _initializePluginClass() {
        this._handleSystemInjections();
        this._handleServiceInjections();
        this.__registrar.performTopActions(this.__ctx);
        this._registerDeclarations();
        if (typeof this.onApply === 'function') {
          this.onApply();
        }
        this._handleServiceProvide(true);
        this._registerAfterInit();
      }

      constructor(...args: any[]) {
        const originalCtx: Context = args[0];
        const config = args[1];
        const ctx = new Registrar(originalClass, newClass).getScopeContext(
          originalCtx,
        );
        super(ctx, config, ...args.slice(2));
        this.__ctx = ctx;
        this.__config = config;
        this.__pluginOptions = options;
        this.__registrar = new Registrar(this, originalClass, config);
        this.__pluginsToWaitFor = [];
        this._initializePluginClass();
      }
    };
    Object.defineProperty(newClass, 'name', {
      enumerable: true,
      configurable: true,
      get: () =>
        reflector.get('KoishiPredefineName', newClass) ||
        reflector.get('KoishiPredefineName', originalClass) ||
        originalClass.name,
    });
    newClass[ThirdEyeSym] = true;
    return newClass;
  };
}

export const KoishiPlugin = DefinePlugin;
