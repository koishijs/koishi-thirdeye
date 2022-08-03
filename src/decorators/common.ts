import { koishiRegistrar } from '../registrar';
import {
  CommandConfigExtended,
  CommandLocaleDef,
  CommandOptionConfigWithDescription,
  CommandReturnType,
} from '../def';
import {
  adaptLocaleDict,
  applyOptionToCommand,
  registerTemplate,
} from '../utility/utility';
import { Argv, Command, Dict, FieldCollector, Session, User } from 'koishi';
import { applyNativeTypeToArg } from '../utility/native-type-mapping';
import { TypedMethodDecorator } from 'satori-decorators';

export * from 'satori-decorators/dist/src/decorators/common';

const methodDecorators = koishiRegistrar.methodDecorators();

export const {
  UseEvent,
  UseBeforeEvent,
  UseMiddleware,
  UsePreset,
  UseFormatter,
  UseInterval,
} = methodDecorators;

export function UseCommand<D extends string>(
  def: D,
  config?: CommandConfigExtended,
): TypedMethodDecorator<(...args: any[]) => CommandReturnType>;
export function UseCommand<D extends string>(
  def: D,
  desc: string,
  config?: CommandConfigExtended,
): TypedMethodDecorator<(...args: any[]) => CommandReturnType>;
export function UseCommand(
  ...args:
    | [string, CommandConfigExtended?]
    | [string, string, CommandConfigExtended?]
): TypedMethodDecorator<(...args: any[]) => CommandReturnType> {
  return methodDecorators.UseCommand(...args);
}

export const CommandLocale = koishiRegistrar.decorateCommandTransformer(
  (ctx, cmd, locale: string, def: CommandLocaleDef) => {
    ctx.i18n.define(locale, `commands.${cmd.name}`, def);
    return cmd;
  },
);

export const CommandDescription = koishiRegistrar.decorateCommandTransformer(
  (ctx, cmd, desc: string | Dict<string>) => {
    for (const localData of Object.entries(adaptLocaleDict(desc))) {
      const [locale, text] = localData;
      ctx.i18n.define(locale, `commands.${cmd.name}.description`, text);
    }
    return cmd;
  },
);

export const CommandAlias = koishiRegistrar.decorateCommandTransformer(
  (ctx, cmd, ...names: string[]) => cmd.alias(...names),
);
export const CommandShortcut = koishiRegistrar.decorateCommandTransformer(
  (ctx, cmd, name: string | RegExp, config: Command.Shortcut = {}) =>
    cmd.shortcut(name, config),
);
export const CommandUsage = koishiRegistrar.decorateCommandTransformer(
  (ctx, cmd, text: Command.Usage) => cmd.usage(text),
);
export const CommandExample = koishiRegistrar.decorateCommandTransformer(
  (ctx, cmd, text: string) => cmd.example(text),
);

export const CommandOption = koishiRegistrar.decorateCommandTransformer(
  (
    ctx,
    cmd,
    name: string,
    desc: string,
    config: CommandOptionConfigWithDescription = {},
  ) => applyOptionToCommand(ctx, cmd, { name, desc, config }),
);

export const CommandUserFields = koishiRegistrar.decorateCommandTransformer(
  (ctx, cmd, fields: FieldCollector<'user'>) => cmd.userFields(fields),
);
export const CommandChannelFields = koishiRegistrar.decorateCommandTransformer(
  (ctx, cmd, fields: FieldCollector<'channel'>) => cmd.channelFields(fields),
);
export const CommandBefore = koishiRegistrar.decorateCommandTransformer(
  (ctx, cmd, callback: Command.Action, append = false) =>
    cmd.before(callback, append),
);
export const CommandAction = koishiRegistrar.decorateCommandTransformer(
  (ctx, cmd, callback: Command.Action, prepend = false) =>
    cmd.action(callback, prepend),
);
export const CommandTemplate = koishiRegistrar.decorateCommandTransformer(
  (ctx, cmd, name: string, text: string | Dict<string>) => {
    registerTemplate({ name, text: adaptLocaleDict(text) }, ctx, cmd);
    return cmd;
  },
);

export const PutValue = koishiRegistrar.decorateCommandPut((data, v: any) => v);
export const PutArgv = koishiRegistrar.decorateCommandPut(
  (data, field?: keyof Argv) => (field ? data.argv[field] : data.argv),
);
export const PutSession = koishiRegistrar.decorateCommandPut(
  (data, field?: keyof Session) =>
    field ? data.argv.session[field] : data.argv.session,
);
export const PutContext = koishiRegistrar.decorateCommandPut(
  (data) => data.ctx,
);
export const PutCommand = koishiRegistrar.decorateCommandPut(
  (data) => data.command,
);
export const PutArg = koishiRegistrar.decorateCommandPut(
  (data, index: number, decl?: Argv.Declaration) => data.args[index],
  (data, index, decl) => {
    const cmd = data.command;
    let arg = cmd._arguments[index];
    if (!arg) {
      arg = {};
      cmd._arguments[index] = arg;
    }
    applyNativeTypeToArg(arg, data.nativeType);
    if (decl) {
      Object.assign(arg, decl);
    }
  },
);
export const PutArgs = koishiRegistrar.decorateCommandPut((data) => data.args);
export const PutOption = koishiRegistrar.decorateCommandPut(
  (
    data,
    name: string,
    desc: string,
    config?: CommandOptionConfigWithDescription,
  ) => data.argv.options[name],
  (data, name, desc, config) =>
    applyOptionToCommand(
      data.ctx,
      data.command,
      {
        name,
        desc,
        config: config || {},
      },
      data.nativeType,
    ),
);
export const PutUser = koishiRegistrar.decorateCommandPut(
  (data, field: FieldCollector<'user'>) => data.argv.session.user,
  (data, field) => data.command.userFields(field),
);
export const PutChannel = koishiRegistrar.decorateCommandPut(
  (data, field: FieldCollector<'channel'>) => data.argv.session.channel,
  (data, field) => data.command.channelFields(field),
);
export const PutGuild = koishiRegistrar.decorateCommandPut(
  (data, field: FieldCollector<'channel'>) => data.argv.session.guild,
  (data, field) => data.command.channelFields(field),
);
export const PutUserName = koishiRegistrar.decorateCommandPut(
  (data, useDatabase?: boolean) => {
    const { argv } = data;
    if (useDatabase) {
      const user = argv.session.user as User.Observed<'name'>;
      if (user?.name) {
        return user?.name;
      }
    }
    return (
      argv.session.author?.nickname ||
      argv.session.author?.username ||
      argv.session.userId
    );
  },
  (data, useDatabase) => {
    if (useDatabase !== false) {
      data.command.userFields(['name']);
    }
  },
);
export const PutUserId = koishiRegistrar.decorateCommandPut(
  (data) => data.argv.session.userId,
);
export const PutChannelName = koishiRegistrar.decorateCommandPut(
  (data) => data.argv.session.channelName,
);
export const PutChannelId = koishiRegistrar.decorateCommandPut(
  (data) => data.argv.session.channelId,
);
export const PutGuildName = koishiRegistrar.decorateCommandPut(
  (data) => data.argv.session.guildName,
);
export const PutGuildId = koishiRegistrar.decorateCommandPut(
  (data) => data.argv.session.guildId,
);
export const PutBot = koishiRegistrar.decorateCommandPut(
  (data) => data.argv.session.bot,
);
export const PutSelfId = koishiRegistrar.decorateCommandPut(
  (data) => data.argv.session.selfId,
);
export const PutNext = koishiRegistrar.decorateCommandPut(
  (data) => data.argv.next,
);
export const PutRenderer = koishiRegistrar.decorateCommandPut(
  (data, path?: string) =>
    path
      ? // eslint-disable-next-line @typescript-eslint/ban-types
        (params: object) => data.argv.session.text(path, params)
      : // eslint-disable-next-line @typescript-eslint/ban-types
        (path: string, params: object) => data.argv.session.text(path, params),
);
export const PutCommonRenderer = PutRenderer;
export const PutTemplate = koishiRegistrar.decorateCommandPut(
  // eslint-disable-next-line @typescript-eslint/ban-types
  (data, name: string, text: string | Dict<string>) => (params: object) =>
    data.argv.session.text(`.${name}`, params),
  (data, name, text) =>
    registerTemplate(
      {
        name,
        text: adaptLocaleDict(text),
      },
      data.ctx,
      data.command,
    ),
);

export const PutObject = koishiRegistrar.decorateCommandPut(
  (data) => {
    const targetClass = data.nativeType as { new (): any };
    if (!targetClass) {
      return;
    }
    const instance = new targetClass();
    const keys = koishiRegistrar.reflector.getArray(
      'KoishiCommandPutObjectKeys',
      instance,
    );
    for (const key of keys) {
      const meta = koishiRegistrar.reflector.get(
        'KoishiCommandPutObject',
        instance,
        key,
      );
      if (meta) {
        const propertyNativeType = Reflect.getMetadata(
          'design:type',
          targetClass.prototype,
          key,
        );
        instance[key] = meta.run(data.view, {
          ...data,
          nativeType: propertyNativeType,
        });
      }
    }
    return instance;
  },
  (data) => {
    const targetClass = data.nativeType as { new (): any };
    if (!targetClass) {
      return;
    }
    const keys = koishiRegistrar.reflector.getArray(
      'KoishiCommandPutObjectKeys',
      targetClass,
    );
    for (const key of keys) {
      const meta = koishiRegistrar.reflector.get(
        'KoishiCommandPutObject',
        targetClass,
        key,
      )?.info?.pre;
      if (meta) {
        const propertyNativeType = Reflect.getMetadata(
          'design:type',
          targetClass.prototype,
          key,
        );
        meta.run(data.view, {
          ...data,
          nativeType: propertyNativeType,
        });
      }
    }
  },
);
