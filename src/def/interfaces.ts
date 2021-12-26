import {
  Argv,
  Command,
  Context,
  EventMap,
  FieldCollector,
  Modules,
  Plugin,
  Selection,
  Session,
} from 'koishi';
import { KoishiPluginRegistrationOptions, PluginClass } from '../register';
import type { DefaultContext, DefaultState, ParameterizedContext } from 'koa';
import type { RouterParamContext } from '@koa/router';

export interface Type<T = any> extends Function {
  new (...args: any[]): T;
}

export interface ContextSelector {
  select?: Selection;
  useSelector?: OnContextFunction;
}

export type KoishiPluginOptions<T extends keyof Modules | Plugin> =
  | boolean
  | (T extends keyof Modules
      ? Plugin.ModuleConfig<Modules[T]>
      : T extends Plugin
      ? Plugin.Config<T>
      : never);

export interface KoishiModulePlugin<T extends keyof Modules | Plugin>
  extends ContextSelector {
  plugin: T;
  options?: boolean | KoishiPluginOptions<T>;
}

export function PluginDef<T extends keyof Modules>(
  plugin: T,
  options?: boolean | Plugin.ModuleConfig<Modules[T]>,
  select?: Selection,
): KoishiModulePlugin<T>;
export function PluginDef<T extends Plugin>(
  plugin: T,
  options?: boolean | Plugin.Config<T>,
  select?: Selection,
): KoishiModulePlugin<T>;
export function PluginDef<T extends keyof Modules | Plugin>(
  plugin: T,
  options?: KoishiPluginOptions<T>,
  select?: Selection,
): KoishiModulePlugin<T> {
  return { plugin, options, select };
}

export interface CommonEventNameAndPrepend<T extends keyof any> {
  name: T;
  prepend?: boolean;
}

export type EventName = keyof EventMap;
export type EventNameAndPrepend = CommonEventNameAndPrepend<EventName>;

type OmitSubstring<
  S extends string,
  T extends string,
> = S extends `${infer L}${T}${infer R}` ? `${L}${R}` : never;
export type BeforeEventName = OmitSubstring<EventName & string, 'before-'>;
export type BeforeEventNameAndPrepend =
  CommonEventNameAndPrepend<BeforeEventName>;

export type ContextFunction<T> = (ctx: Context) => T;
export type OnContextFunction = ContextFunction<Context>;
export interface DoRegisterConfigDataMap {
  middleware: boolean; // prepend
  onevent: EventNameAndPrepend;
  beforeEvent: BeforeEventNameAndPrepend;
  plugin: never;
  command: CommandRegisterConfig;
  route: KoishiRouteDef;
}

export interface MappingStruct<
  T extends Record<string | number | symbol, any>,
  K extends keyof T,
> {
  type: K;
  data?: T[K];
}

export function GenerateMappingStruct<
  T extends Record<string | number | symbol, any>,
  K extends keyof T,
>(type: K, data?: T[K]): MappingStruct<T, K> {
  return {
    type,
    data,
  };
}

export type DoRegisterConfig<
  K extends keyof DoRegisterConfigDataMap = keyof DoRegisterConfigDataMap,
> = MappingStruct<DoRegisterConfigDataMap, K>;

// Command stuff

export interface CommandRegisterConfig<D extends string = string> {
  def: D;
  desc?: string;
  config?: CommandConfigExtended;
  putOptions?: CommandPutConfig<keyof CommandPutConfigMap>[];
}

export interface CommandConfigExtended extends Command.Config {
  empty?: boolean;
}

export interface CommandOptionConfig {
  name: string;
  desc: string;
  config?: Argv.OptionConfig;
}

export interface CommandPutConfigMap {
  arg: number;
  argv: never;
  session: never;
  option: CommandOptionConfig;
  user: FieldCollector<'user'>;
  channel: FieldCollector<'channel'>;
  username: boolean;
  sessionField: keyof Session;
}

export type CommandPutConfig<
  K extends keyof CommandPutConfigMap = keyof CommandPutConfigMap,
> = MappingStruct<CommandPutConfigMap, K>;

export type CommandDefinitionFun = (cmd: Command) => Command;

export type SystemInjectFun = <T = any>(
  obj: PluginClass<T>,
  pluginMeta: KoishiPluginRegistrationOptions<T>,
) => any;

export interface ProvideOptions {
  immediate?: boolean;
}

export interface ProvideDefinition extends ProvideOptions {
  serviceName: keyof Context.Services;
}

export interface KoishiRouteDef {
  path: string;
  method:
    | 'get'
    | 'post'
    | 'put'
    | 'delete'
    | 'patch'
    | 'options'
    | 'head'
    | 'all';
}

export type KoaContext = ParameterizedContext<
  DefaultState,
  DefaultContext & RouterParamContext<DefaultState, DefaultContext>,
  any
>;
