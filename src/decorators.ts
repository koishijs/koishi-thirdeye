import {
  BeforeEventName,
  CommandConfigExtended,
  CommandDefinitionFun,
  CommandPutConfig,
  CommandPutConfigMap,
  DoRegisterConfig,
  EventName,
  GenerateMappingStruct,
  KoishiAddUsingList,
  KoishiCommandDefinition,
  KoishiCommandPutDef,
  KoishiDoRegister,
  KoishiDoRegisterKeys,
  KoishiOnContextScope,
  KoishiRouteDef,
  KoishiServiceInjectSym,
  KoishiServiceInjectSymKeys,
  KoishiServiceProvideSym,
  KoishiSystemInjectSym,
  KoishiSystemInjectSymKeys,
  OnContextFunction,
  ProvideOptions,
  SystemInjectFun,
} from './def';
import 'reflect-metadata';
import {
  App,
  Argv,
  Command,
  Context,
  FieldCollector,
  Selection,
  Session,
} from 'koishi';
import { Metadata } from './meta/metadata.decorators';

// Register methods
export const DoRegister = (value: DoRegisterConfig): MethodDecorator =>
  Metadata.set(KoishiDoRegister, value, KoishiDoRegisterKeys);

export const UseMiddleware = (prepend?: boolean): MethodDecorator =>
  DoRegister(GenerateMappingStruct('middleware', prepend));

export const UseEvent = (name: EventName, prepend?: boolean): MethodDecorator =>
  DoRegister(GenerateMappingStruct('onevent', { name, prepend }));

export const UseBeforeEvent = (
  name: BeforeEventName,
  prepend?: boolean,
): MethodDecorator =>
  DoRegister(GenerateMappingStruct('beforeEvent', { name, prepend }));

export const UsePlugin = (): MethodDecorator =>
  DoRegister(GenerateMappingStruct('plugin'));

export const UseHttpRoute = (routeDef: KoishiRouteDef): MethodDecorator =>
  DoRegister(GenerateMappingStruct('route', routeDef));

export const Get = (path: string) => UseHttpRoute({ path, method: 'get' });
export const Post = (path: string) => UseHttpRoute({ path, method: 'post' });
export const Put = (path: string) => UseHttpRoute({ path, method: 'put' });
export const Delete = (path: string) =>
  UseHttpRoute({ path, method: 'delete' });
export const Patch = (path: string) => UseHttpRoute({ path, method: 'patch' });
export const Options = (path: string) =>
  UseHttpRoute({ path, method: 'options' });
export const Head = (path: string) => UseHttpRoute({ path, method: 'head' });
export const All = (path: string) => UseHttpRoute({ path, method: 'all' });

export function UseCommand<D extends string>(
  def: D,
  config?: CommandConfigExtended,
): MethodDecorator;
export function UseCommand<D extends string>(
  def: D,
  desc: string,
  config?: CommandConfigExtended,
): MethodDecorator;
export function UseCommand(
  def: string,
  ...args: [CommandConfigExtended?] | [string, CommandConfigExtended?]
): MethodDecorator {
  const desc = typeof args[0] === 'string' ? (args.shift() as string) : '';
  const config = args[0] as CommandConfigExtended;
  return (obj, key: string, des) => {
    const putOptions: CommandPutConfig<keyof CommandPutConfigMap>[] =
      Reflect.getMetadata(KoishiCommandPutDef, obj.constructor, key) ||
      undefined;
    const metadataDec = DoRegister({
      type: 'command',
      data: {
        def,
        desc,
        config,
        putOptions,
      },
    });
    return metadataDec(obj, key, des);
  };
}

// Context scopes

export const OnContext = (
  ctxFun: OnContextFunction,
): MethodDecorator & ClassDecorator =>
  Metadata.append(KoishiOnContextScope, ctxFun);

export const OnAnywhere = () => OnContext((ctx) => ctx.any());

export const OnNowhere = () => OnContext((ctx) => ctx.never());

export const OnUser = (...values: string[]) =>
  OnContext((ctx) => ctx.user(...values));

export const OnSelf = (...values: string[]) =>
  OnContext((ctx) => ctx.self(...values));

export const OnGuild = (...values: string[]) =>
  OnContext((ctx) => ctx.guild(...values));

export const OnChannel = (...values: string[]) =>
  OnContext((ctx) => ctx.channel(...values));

export const OnPlatform = (...values: string[]) =>
  OnContext((ctx) => ctx.platform(...values));

export const OnPrivate = (...values: string[]) =>
  OnContext((ctx) => ctx.private(...values));

export const OnSelection = (selection: Selection) =>
  OnContext((ctx) => ctx.select(selection));

// Command definition

export const CommandDef = (def: CommandDefinitionFun): MethodDecorator =>
  Metadata.append(KoishiCommandDefinition, def);

export const CommandDescription = (desc: string) =>
  CommandDef((cmd) => {
    cmd.description = desc;
    return cmd;
  });

export const CommandAlias = (...names: string[]) =>
  CommandDef((cmd) => cmd.alias(...names));

export const CommandShortcut = (
  name: string | RegExp,
  config: Command.Shortcut = {},
) => CommandDef((cmd) => cmd.shortcut(name, config));

export const CommandUsage = (text: string) =>
  CommandDef((cmd) => cmd.usage(text));

export const CommandExample = (text: string) =>
  CommandDef((cmd) => cmd.example(text));

export const CommandOption = (
  name: string,
  desc: string,
  config: Argv.OptionConfig = {},
) => CommandDef((cmd) => cmd.option(name, desc, config));

export const CommandUserFields = (fields: FieldCollector<'user'>) =>
  CommandDef((cmd) => cmd.userFields(fields));

export const CommandChannelFields = (fields: FieldCollector<'channel'>) =>
  CommandDef((cmd) => cmd.channelFields(fields));

// Command put config

function PutCommandParam<T extends keyof CommandPutConfigMap>(
  type: T,
  data?: CommandPutConfigMap[T],
): ParameterDecorator {
  return (obj, key: string, index) => {
    const objClass = obj.constructor;
    const list: CommandPutConfig<T>[] =
      Reflect.getMetadata(KoishiCommandPutDef, objClass, key) || [];
    list[index] = GenerateMappingStruct(type, data);
    Reflect.defineMetadata(KoishiCommandPutDef, list, objClass, key);
  };
}

export const PutArgv = () => PutCommandParam('argv');
export const PutSession = (field?: keyof Session) =>
  field ? PutCommandParam('sessionField', field) : PutCommandParam('session');
export const PutArg = (i: number) => PutCommandParam('arg', i);
export const PutOption = (
  name: string,
  desc: string,
  config: Argv.OptionConfig = {},
) => PutCommandParam('option', { name, desc, config });

export const PutUser = (field: FieldCollector<'user'>) =>
  PutCommandParam('user', field);

export const PutChannel = (field: FieldCollector<'channel'>) =>
  PutCommandParam('channel', field);

export const PutUserName = (useDatabase = true) =>
  PutCommandParam('username', useDatabase);

export const PutUserId = () => PutSession('userId');
export const PutGuildId = () => PutSession('guildId');
export const PutGuildName = () => PutSession('guildName');
export const PutChannelId = () => PutSession('channelId');
export const PutChannelName = () => PutSession('channelName');
export const PutSelfId = () => PutSession('selfId');
export const PutBot = () => PutSession('bot');

// Service

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
  InjectSystem((obj, config) =>
    obj.__ctx.logger(
      name ||
        config.name ||
        Object.getPrototypeOf(Object.getPrototypeOf(obj))?.constructor?.name ||
        'default',
    ),
  );
