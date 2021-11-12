import { Argv, Command, Context, Schema, User } from 'koishi';
import {
  CommandPutConfig,
  DoRegisterConfig,
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
import { schemaFromClass, schemaTransform } from 'koishi-utils-schemagen';
import { getMetadata, getMetadataArray } from './meta/meta-fetch';
import { applySelector } from './utility/utility';

export interface KoishiPluginRegistrationOptions<T = any> {
  name?: string;
  schema?: Schema<T> | Type<T>;
}

export interface PluginClass<T = any> {
  __ctx: Context;
  __config: T;
  __rawConfig: T;
}

export interface OnApply {
  onApply(): void | Promise<void>;
}

export interface OnConnect {
  onConnect(): void | Promise<void>;
}

export interface OnDisconnect {
  onDisconnect(): void | Promise<void>;
}

function getContextFromFilters(ctx: Context, filters: OnContextFunction[]) {
  let targetCtx = ctx;
  for (const fun of filters) {
    targetCtx = fun(targetCtx) || targetCtx;
  }
  return targetCtx;
}

export function KoishiPlugin<T = any>(
  options: KoishiPluginRegistrationOptions<T> = {},
) {
  return function <C extends { new (...args: any[]): any }>(originalClass: C) {
    const newClass = class extends originalClass implements PluginClass {
      __ctx: Context;
      __config: T;
      __rawConfig: T;

      _handleSystemInjections() {
        // console.log('Handling system injection');
        const injectKeys = getMetadataArray(KoishiSystemInjectSymKeys, this);
        for (const key of injectKeys) {
          // console.log(`Processing ${key}`);
          const valueFunction = getMetadata(KoishiSystemInjectSym, this, key);
          Object.defineProperty(this, key, {
            configurable: true,
            enumerable: true,
            get: () => valueFunction(this),
          });
        }
      }

      _handleServiceInjections() {
        // console.log('Handling service injection');
        const injectKeys = getMetadataArray(KoishiServiceInjectSymKeys, this);
        for (const key of injectKeys) {
          // console.log(`Processing ${key}`);
          const name = getMetadata(KoishiServiceInjectSym, this, key);
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
            const {
              data: channelFields,
            } = config as CommandPutConfig<'channel'>;
            if (channelFields) {
              cmd.channelFields(channelFields);
            }
            break;
          case 'username':
            const {
              data: useDatabase,
            } = config as CommandPutConfig<'username'>;
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
            const {
              data: useDatabase,
            } = config as CommandPutConfig<'username'>;
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

      async _registerDeclarationsFor(methodKey: keyof C & string) {
        // console.log(`Handling declaration for ${methodKey}`);
        const regData = getMetadata(KoishiDoRegister, this, methodKey);
        if (!regData) {
          return;
        }
        // console.log(`Type: ${regData.type}`);
        const baseContext = getContextFromFilters(
          this.__ctx,
          getMetadataArray(KoishiOnContextScope, this, methodKey),
        );
        switch (regData.type) {
          case 'middleware':
            const {
              data: midPrepend,
            } = regData as DoRegisterConfig<'middleware'>;
            baseContext.middleware(
              (session, next) => this[methodKey](session, next),
              midPrepend,
            );
            break;
          case 'onevent':
            const { data: eventData } = regData as DoRegisterConfig<'onevent'>;
            const eventName = eventData.name;
            baseContext.on(eventData.name, (...args: any[]) =>
              this[methodKey](...args),
            );
            // special events
            if (
              typeof eventName === 'string' &&
              eventName.startsWith('service/')
            ) {
              const serviceName = eventName.slice(8);
              if (baseContext[serviceName] != null) {
                this[methodKey]();
              }
            }
            break;
          case 'plugin':
            const pluginDesc: KoishiModulePlugin<any> = await this[methodKey]();
            if (!pluginDesc || !pluginDesc.plugin) {
              throw new Error(`Invalid plugin from method ${methodKey}.`);
            }
            const pluginCtx = applySelector(baseContext, pluginDesc);
            pluginCtx.plugin(pluginDesc.plugin, pluginDesc.options);
            break;
          case 'command':
            const {
              data: commandData,
            } = regData as DoRegisterConfig<'command'>;
            let command = baseContext.command(
              commandData.def,
              commandData.desc,
              commandData.config,
            );
            const commandDefs = getMetadataArray(
              KoishiCommandDefinition,
              this,
              methodKey,
            );
            for (const commandDef of commandDefs) {
              command = commandDef(command) || command;
            }
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
            break;
          default:
            throw new Error(`Unknown operation type ${regData.type}`);
        }
      }

      async _registerDeclarations() {
        const methodKeys = getMetadataArray(
          KoishiDoRegisterKeys,
          this,
        ) as (keyof C & string)[];
        // console.log(methodKeys);
        await Promise.all(
          methodKeys.map((methodKey) =>
            this._registerDeclarationsFor(methodKey),
          ),
        );
      }

      _handleServiceProvide(connect = true) {
        // console.log(`Handling service provide`);
        const providingServices = getMetadataArray(
          KoishiServiceProvideSym,
          originalClass,
        );
        for (const key of providingServices) {
          // console.log(`Processing ${key}`);
          this.__ctx[key] = connect ? (this as any) : null;
        }
      }

      _registerAfterInit() {
        // console.log(`Handling after init.`);
        this.__ctx.on('connect', async () => {
          if (typeof this.onConnect === 'function') {
            await this.onConnect();
          }
          this._handleServiceProvide(true);
        });
        this.__ctx.on('disconnect', async () => {
          if (typeof this.onDisconnect === 'function') {
            await this.onDisconnect();
          }
          this._handleServiceProvide(false);
        });
      }

      async _initializePluginClass() {
        this._handleSystemInjections();
        this._handleServiceInjections();
        this._registerAfterInit();
        await this._registerDeclarations();
        if (typeof this.onApply === 'function') {
          await this.onApply();
        }
      }

      constructor(...args: any[]) {
        const originalCtx: Context = args[0];
        const rawConfig = args[1];
        const contextFilters = getMetadataArray(
          KoishiOnContextScope,
          originalClass,
        );
        const ctx = getContextFromFilters(originalCtx, contextFilters);
        const config =
          typeof options.schema === 'function'
            ? schemaTransform(options.schema, rawConfig)
            : options.schema
            ? Schema.validate(rawConfig, options.schema)
            : rawConfig;
        super(ctx, config, ...args.slice(2));
        this.__ctx = ctx;
        this.__rawConfig = rawConfig;
        this.__config = config;
        this._initializePluginClass().then();
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
    if (options.schema) {
      const schema =
        typeof options.schema === 'function'
          ? schemaFromClass(options.schema)
          : options.schema;
      Object.defineProperty(newClass, 'schema', {
        enumerable: true,
        configurable: true,
        writable: true,
        value: schema,
      });
    }
    return newClass;
  };
}
