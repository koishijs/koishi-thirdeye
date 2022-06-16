import { Context, Schema, WebSocketLayer } from 'koishi';
import {
  ControlType,
  KoishiAddUsingList,
  KoishiServiceInjectSym,
  KoishiServiceInjectSymKeys,
  KoishiServiceProvideSym,
  KoishiSystemInjectSym,
  KoishiSystemInjectSymKeys,
  PluginClass,
  ServiceName,
  ThirdEyeSym,
} from './def';
import { reflector } from './meta/meta-fetch';
import { SchemaClass } from 'schemastery-gen';
import _ from 'lodash';
import { Registrar, Type } from 'koishi-decorators';
import { PluginName, PluginSchema, UsingService } from './decorators';

export interface KoishiPluginRegistrationOptions<T = any> {
  name?: string;
  schema?: Schema<T> | Type<T>;
  Config?: Schema<T> | Type<T>;
  using?: ServiceName[];
  reusable?: boolean;
}

export interface PluginMeta<T = any> {
  __ctx: Context;
  __config: T;
  __registrar: Registrar;
  __pluginOptions: KoishiPluginRegistrationOptions<T>;
  __promisesToWaitFor: Promise<void>[];
  __disposables: (() => void)[];
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
  onFork?(instance: any): void | Promise<void>;
  onForkDisconnect?(instance: any): void | Promise<void>;
}

declare module 'koishi' {
  interface Context {
    __parent?: any;
  }
}

export function DefinePlugin<T>(
  options?: KoishiPluginRegistrationOptions<T>,
): <C extends PluginClass<T>>(
  plugin: C,
) => C & KoishiPluginRegistrationOptions<T>;
export function DefinePlugin<T>(
  options: KoishiPluginRegistrationOptions<T> = {},
) {
  return function <
    C extends {
      new (...args: any[]): any;
    },
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
        const schemaType = reflector.get('KoishiPredefineSchema', newClass);
        return schemaType ? SchemaClass(schemaType) : undefined;
      }

      static get using() {
        const list = reflector.getArray(KoishiAddUsingList, newClass);
        return _.uniq(list);
      }

      static get reusable() {
        const fork = reflector.get('KoishiFork', newClass);
        return !!fork;
      }

      __ctx: Context;
      __config: T;
      __pluginOptions: KoishiPluginRegistrationOptions<T>;
      __registrar: Registrar;
      __promisesToWaitFor: Promise<void>[];
      __disposables: (() => void)[];

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
            get: () => valueFunction(this, newClass),
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
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              this.__ctx[name] = val;
            },
          });
        }
      }

      _registerDeclarationsProcess(
        ctx: Context,
        methodKey: keyof C & string,
        view: Record<string, any> = {},
      ) {
        const result = this.__registrar.register(ctx, methodKey, false, view);
        const type = result?.type;
        if (type === 'ws') {
          const layer = result.result as WebSocketLayer;
          ctx.on('dispose', () => layer.close());
        } else {
          const mayBePromise = result?.result;
          if (mayBePromise instanceof Promise) {
            this.__promisesToWaitFor.push(mayBePromise);
          }
        }
      }

      _registerDeclarationsWithStack(
        ctx: Context,
        methodKey: keyof C & string,
        stack: ControlType[],
        existing: Record<string, any> = {},
      ) {
        if (!stack.length) {
          return this._registerDeclarationsProcess(ctx, methodKey, existing);
        }
        const rest = [...stack];
        const control = rest.pop();

        switch (control.type) {
          case 'if':
            if (!(control as ControlType<'if'>).condition(this, existing))
              return;
            return this._registerDeclarationsWithStack(
              ctx,
              methodKey,
              rest,
              existing,
            );
          case 'for':
            for (const view of (control as ControlType<'for'>).condition(
              this,
              existing,
            )) {
              this._registerDeclarationsWithStack(ctx, methodKey, rest, {
                ...existing,
                ...view,
              });
            }
            return;
        }
      }

      _registerDeclarationsFor(ctx: Context, methodKey: keyof C & string) {
        const scopeCtx = this.__registrar.getScopeContext(
          this.__ctx,
          methodKey,
          false,
        );
        const stack = reflector.getArray('KoishiControl', this, methodKey);
        const sub = this.__registrar
          .runLayers(
            scopeCtx,
            (innerCtx) =>
              this._registerDeclarationsWithStack(innerCtx, methodKey, stack),
            methodKey,
          )
          .subscribe();
        scopeCtx.on('dispose', () => sub.unsubscribe());
      }

      _registerDeclarations() {
        const methodKeys =
          this.__registrar.getAllFieldsToRegister() as (keyof C & string)[];
        const sub = this.__registrar
          .runLayers(this.__ctx, (innerCtx) =>
            methodKeys.forEach((methodKey) =>
              this._registerDeclarationsFor(innerCtx, methodKey),
            ),
          )
          .subscribe();
        this.__disposables.push(() => sub.unsubscribe());
      }

      _getProvidingServices() {
        return reflector.getArray(KoishiServiceProvideSym, this);
      }

      _handleServiceProvide(immediate: boolean) {
        const providingServices = this._getProvidingServices().filter(
          (serviceDef) => !serviceDef.immediate === !immediate,
        );
        for (const key of providingServices) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          this.__ctx[key.serviceName] = this as any;
        }
      }

      _uninstallServiceProvide() {
        const providingServices = this._getProvidingServices();
        for (const key of providingServices) {
          if (this.__ctx[key.serviceName] === (this as never)) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            this.__ctx[key.serviceName] = null;
          }
        }
      }

      _registerAfterInit() {
        this.__ctx.on('ready', async () => {
          if (this.__promisesToWaitFor.length) {
            await Promise.all(this.__promisesToWaitFor);
            this.__promisesToWaitFor = [];
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
          this.__disposables.forEach((dispose) => dispose());
          delete this.__ctx;
          delete this.__config;
          delete this.__pluginOptions;
          delete this.__registrar;
          delete this.__promisesToWaitFor;
          delete this.__disposables;
        });
      }

      _initializeFork() {
        let fork = reflector.get('KoishiFork', this);
        if (!fork) {
          return;
        }
        if (!fork[ThirdEyeSym]) {
          fork = DefinePlugin()(fork);
        }
        this.__ctx.on('fork', (ctx, options) => {
          ctx.__parent = this;
          const instance = new fork(ctx, options);
          ctx.on('dispose', () => {
            if (typeof this.onForkDisconnect === 'function') {
              this.onForkDisconnect(instance);
            }
            delete ctx.__parent;
          });
          if (typeof this.onFork === 'function') {
            this.onFork(instance);
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
        this._initializeFork();
        this._registerAfterInit();
      }

      constructor(...args: any[]) {
        const originalCtx: Context = args[0];
        const config = args[1];
        const ctx = new Registrar(newClass).getScopeContext(originalCtx);
        super(ctx, config, ...args.slice(2));
        this.__ctx = ctx;
        this.__config = config;
        this.__pluginOptions = options;
        this.__registrar = new Registrar(this, undefined, config);
        this.__promisesToWaitFor = [];
        this.__disposables = [];
        this._initializePluginClass();
      }
    };
    Object.defineProperty(newClass, 'name', {
      enumerable: true,
      configurable: true,
      get: () =>
        reflector.get('KoishiPredefineName', newClass) || originalClass.name,
    });
    newClass[ThirdEyeSym] = true;
    return newClass;
  };
}

export const KoishiPlugin = DefinePlugin;
