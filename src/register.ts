import { Argv, Awaitable, Command, Context, Schema, User } from 'koishi';
import {
  CommandPutConfig,
  DoRegisterConfig,
  KoishiAddUsingList,
  KoishiCommandDefinition,
  KoishiDoRegister,
  KoishiDoRegisterKeys,
  KoishiModulePlugin,
  KoishiOnContextScope,
  KoishiServiceInjectSym,
  KoishiServiceInjectSymKeys,
  KoishiServiceProvideSym,
  KoishiSystemInjectSym,
  KoishiSystemInjectSymKeys,
  OnContextFunction,
  Type,
} from './def';
import { reflector } from './meta/meta-fetch';
import { applySelector } from './utility/utility';
import { ClassType, SchemaClass } from 'schemastery-gen';
import _ from 'lodash';

export interface KoishiPluginRegistrationOptions<T = any> {
  name?: string;
  schema?: Schema<any, T> | Type<T>;
  using?: (keyof Context.Services)[];
}

export interface PluginClass<T = any> {
  __ctx: Context;
  __config: T;
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

function getContextFromFilters(ctx: Context, filters: OnContextFunction[]) {
  let targetCtx = ctx;
  for (const fun of filters) {
    targetCtx = fun(targetCtx) || targetCtx;
  }
  return targetCtx;
}

export function DefinePlugin<T = any>(
  options: KoishiPluginRegistrationOptions<T> = {},
) {
  return function <
    C extends {
      new (...args: any[]): any;
    } & KoishiPluginRegistrationOptions<any>,
  >(originalClass: C) {
    const addUsingList = reflector.getArray(KoishiAddUsingList, originalClass);
    const newClass = class extends originalClass implements PluginClass {
      static Config =
        options.schema &&
        ((options.schema as Schema).type
          ? (options.schema as Schema<Partial<T>, T>)
          : SchemaClass(options.schema as ClassType<T>));
      static using = _.uniq([...(options.using || []), ...addUsingList]);
      __ctx: Context;
      __config: T;
      __pluginOptions: KoishiPluginRegistrationOptions<T>;

      _handleSystemInjections() {
        // console.log('Handling system injection');
        const injectKeys = reflector.getArray(KoishiSystemInjectSymKeys, this);
        for (const key of injectKeys) {
          // console.log(`Processing ${key}`);
          const valueFunction = reflector.get(KoishiSystemInjectSym, this, key);
          Object.defineProperty(this, key, {
            configurable: true,
            enumerable: true,
            get: () => valueFunction(this, options),
          });
        }
      }

      _handleServiceInjections() {
        // console.log('Handling service injection');
        const injectKeys = reflector.getArray(KoishiServiceInjectSymKeys, this);
        for (const key of injectKeys) {
          // console.log(`Processing ${key}`);
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

      _preRegisterCommandActionArg(config: CommandPutConfig, cmd: Command) {
        if (!config) {
          return;
        }
        switch (config.type) {
          case 'option':
            const { data: optionData } = config as CommandPutConfig<'option'>;
            cmd.option(optionData.name, optionData.desc, optionData.config);
            break;
          case 'user':
            const { data: userFields } = config as CommandPutConfig<'user'>;
            if (userFields) {
              cmd.userFields(userFields);
            }
            break;
          case 'channel':
            const { data: channelFields } =
              config as CommandPutConfig<'channel'>;
            if (channelFields) {
              cmd.channelFields(channelFields);
            }
            break;
          case 'username':
            const { data: useDatabase } =
              config as CommandPutConfig<'username'>;
            if (useDatabase) {
              cmd.userFields(['name']);
            }
            break;
          default:
            break;
        }
        return;
      }

      _getCommandActionArg(config: CommandPutConfig, argv: Argv, args: any[]) {
        if (!config) {
          return;
        }
        switch (config.type) {
          case 'arg':
            const { data: index } = config as CommandPutConfig<'arg'>;
            return args[index];
          case 'argv':
            return argv;
          case 'session':
            return argv.session;
          case 'option':
            const { data: optionData } = config as CommandPutConfig<'option'>;
            return argv.options[optionData.name];
          case 'user':
            return argv.session.user;
          case 'channel':
            return argv.session.channel;
          case 'username':
            const { data: useDatabase } =
              config as CommandPutConfig<'username'>;
            if (useDatabase) {
              const user = argv.session.user as User.Observed<'name'>;
              if (user?.name) {
                return user?.name;
              }
            }
            return (
              argv.session.author?.nickname || argv.session.author?.username
            );
          case 'sessionField':
            const { data: field } = config as CommandPutConfig<'sessionField'>;
            return argv.session[field];
          default:
            return;
        }
      }

      _applyInnerPluginDesc(
        baseContext: Context,
        methodKey: keyof C & string,
        pluginDesc: KoishiModulePlugin<any>,
      ) {
        const pluginCtx = applySelector(baseContext, pluginDesc);
        if (pluginDesc == null) {
          return;
        }
        if (!pluginDesc || !pluginDesc.plugin) {
          throw new Error(`Invalid plugin from method ${methodKey}.`);
        }
        pluginCtx.plugin(pluginDesc.plugin, pluginDesc.options);
      }

      _applyInnerPlugin(baseContext: Context, methodKey: keyof C & string) {
        const pluginDescMayBeProm: Awaitable<KoishiModulePlugin<any>> =
          this[methodKey]();
        if (pluginDescMayBeProm instanceof Promise) {
          pluginDescMayBeProm.then((pluginDesc) => {
            this._applyInnerPluginDesc(baseContext, methodKey, pluginDesc);
          });
        } else {
          this._applyInnerPluginDesc(
            baseContext,
            methodKey,
            pluginDescMayBeProm,
          );
        }
      }

      _registerDeclarationsFor(methodKey: keyof C & string) {
        // console.log(`Handling declaration for ${methodKey}`);
        const regData = reflector.get(KoishiDoRegister, this, methodKey);
        if (!regData) {
          return;
        }
        // console.log(`Type: ${regData.type}`);
        const baseContext = getContextFromFilters(
          this.__ctx,
          reflector.getArray(KoishiOnContextScope, this, methodKey),
        );
        switch (regData.type) {
          case 'middleware':
            const { data: midPrepend } =
              regData as DoRegisterConfig<'middleware'>;
            baseContext.middleware(
              (session, next) => this[methodKey](session, next),
              midPrepend,
            );
            break;
          case 'onevent':
            const { data: eventData } = regData as DoRegisterConfig<'onevent'>;
            const eventName = eventData.name;
            baseContext.on(
              eventName,
              (...args: any[]) => this[methodKey](...args),
              eventData.prepend,
            );
            break;
          case 'beforeEvent':
            const { data: beforeEventData } =
              regData as DoRegisterConfig<'beforeEvent'>;
            const beforeEventName = beforeEventData.name;
            baseContext.before(
              beforeEventName,
              (...args: any[]) => this[methodKey](...args),
              beforeEventData.prepend,
            );
          case 'plugin':
            this._applyInnerPlugin(baseContext, methodKey);
            break;
          case 'command':
            const { data: commandData } =
              regData as DoRegisterConfig<'command'>;
            let command = baseContext.command(
              commandData.def,
              commandData.desc,
              commandData.config,
            );
            const commandDefs = reflector.getArray(
              KoishiCommandDefinition,
              this,
              methodKey,
            );
            for (const commandDef of commandDefs) {
              command = commandDef(command) || command;
            }
            if (!commandData.config?.empty) {
              if (!commandData.putOptions) {
                command.action((argv: Argv, ...args: any[]) =>
                  this[methodKey](argv, ...args),
                );
              } else {
                for (const _optionToRegister of commandData.putOptions) {
                  this._preRegisterCommandActionArg(_optionToRegister, command);
                }
                command.action((argv: Argv, ...args: any[]) => {
                  const params = commandData.putOptions.map((o) =>
                    this._getCommandActionArg(o, argv, args),
                  );
                  return this[methodKey](...params);
                });
              }
            }
            break;
          case 'route':
            const { data: routeData } = regData as DoRegisterConfig<'route'>;
            const realPath = routeData.path.startsWith('/')
              ? routeData.path
              : `/${routeData.path}`;
            baseContext.router[routeData.method](realPath, (ctx, next) =>
              this[methodKey](ctx, next),
            );
            break;
          default:
            throw new Error(`Unknown operation type ${regData.type}`);
        }
      }

      _registerDeclarations() {
        const methodKeys = reflector.getArray(
          KoishiDoRegisterKeys,
          this,
        ) as (keyof C & string)[];
        // console.log(methodKeys);
        methodKeys.forEach((methodKey) =>
          this._registerDeclarationsFor(methodKey),
        );
      }

      _handleServiceProvide(immediate: boolean) {
        // console.log(`Handling service provide`);
        const providingServices = [
          ...reflector.getArray(KoishiServiceProvideSym, originalClass),
          ...reflector.getArray(KoishiServiceProvideSym, this),
        ].filter((serviceDef) => !serviceDef.immediate === !immediate);
        for (const key of providingServices) {
          // console.log(`Processing ${key}`);
          this.__ctx[key.serviceName] = this as any;
        }
      }

      _registerAfterInit() {
        // console.log(`Handling after init.`);
        this.__ctx.on('ready', async () => {
          if (typeof this.onConnect === 'function') {
            await this.onConnect();
          }
          this._handleServiceProvide(false);
        });
        this.__ctx.on('dispose', async () => {
          if (typeof this.onDisconnect === 'function') {
            await this.onDisconnect();
          }
          // this._handleServiceProvide(false);
        });
      }

      _initializePluginClass() {
        this._handleServiceProvide(true);
        this._handleSystemInjections();
        this._handleServiceInjections();
        this._registerDeclarations();
        if (typeof this.onApply === 'function') {
          this.onApply();
        }
        this._registerAfterInit();
      }

      constructor(...args: any[]) {
        const originalCtx: Context = args[0];
        const config = args[1];
        const contextFilters = [
          ...reflector.getArray(KoishiOnContextScope, originalClass),
          ...reflector.getArray(KoishiOnContextScope, newClass),
        ];
        const ctx = getContextFromFilters(originalCtx, contextFilters);
        super(ctx, config, ...args.slice(2));
        this.__ctx = ctx;
        this.__config = config;
        this.__pluginOptions = options;
        this._initializePluginClass();
      }
    };
    if (options.name) {
      Object.defineProperty(newClass, 'name', {
        enumerable: true,
        configurable: true,
        writable: true,
        value: options.name,
      });
    }
    return newClass;
  };
}

export const KoishiPlugin = DefinePlugin;
