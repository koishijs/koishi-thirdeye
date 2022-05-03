import { Context, Plugin, Schema, WebSocketLayer } from 'koishi';
import {
  KoishiAddUsingList,
  KoishiPartialUsing,
  KoishiServiceInjectSym,
  KoishiServiceInjectSymKeys,
  KoishiServiceProvideSym,
  KoishiSystemInjectSym,
  KoishiSystemInjectSymKeys,
} from './def';
import { reflector } from './meta/meta-fetch';
import { SchemaClass } from 'schemastery-gen';
import _ from 'lodash';
import { Registrar, Type } from 'koishi-decorators';

export interface KoishiPluginRegistrationOptions<T = any> {
  name?: string;
  schema?: Schema<any, T> | Type<T>;
  using?: (keyof Context.Services)[];
}

export interface PluginClass<T = any> {
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
    const schemaType =
      options.schema || reflector.get('KoishiPredefineSchema', originalClass);
    const newClass = class extends originalClass implements PluginClass {
      static Config = schemaType ? SchemaClass(schemaType) : undefined;
      static get using() {
        const list = reflector
          .getArray(KoishiAddUsingList, originalClass)
          .concat(options.using || [])
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
          Object.defineProperty(this, key, {
            configurable: true,
            enumerable: true,
            get: () => valueFunction(this, options),
          });
        }
      }

      _handleServiceInjections() {
        const injectKeys = reflector.getArray(KoishiServiceInjectSymKeys, this);
        for (const key of injectKeys) {
          const name = reflector.get(KoishiServiceInjectSym, this, key);
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

      _registerDeclarationsProcess(methodKey: keyof C & string, ctx: Context) {
        const result = this.__registrar.register(ctx, methodKey, false);
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

      _registerDeclarationsFor(methodKey: keyof C & string) {
        const ctx = this.__registrar.getScopeContext(
          this.__ctx,
          methodKey,
          false,
        );
        const conditions = reflector.getArray('KoishiIf', this, methodKey);
        if (
          conditions.some(
            (condition) => !condition(this, this.__config as any, this.__ctx),
          )
        )
          return;
        const partialUsing = reflector.getArray(
          KoishiPartialUsing,
          this,
          methodKey,
        );
        if (partialUsing.length) {
          const name = `${options.name || originalClass.name}-${methodKey}`;
          const innerPlugin: Plugin.Object = {
            name,
            using: partialUsing,
            apply: (innerCtx) =>
              this._registerDeclarationsProcess(methodKey, innerCtx),
          };
          ctx.plugin(innerPlugin);
        } else {
          this._registerDeclarationsProcess(methodKey, ctx);
        }
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
        this.__registrar = new Registrar(this, originalClass);
        this.__pluginsToWaitFor = [];
        this._initializePluginClass();
      }
    };
    Object.defineProperty(newClass, 'name', {
      enumerable: true,
      configurable: true,
      writable: true,
      value: options.name || originalClass.name,
    });
    return newClass;
  };
}

export const KoishiPlugin = DefinePlugin;
