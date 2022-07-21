import { Argv, Command, Context, Dict, I18n } from 'koishi';
import { CanBeObserved } from '../utility/rxjs-session';

type CommandReg<A extends any[] = any[], R = any> = (
  ctx: Context,
  command: Command,
  ...args: A
) => R;

export type CommandTransformer<A extends any[] = any[]> = CommandReg<
  A,
  Command
>;

export interface CommandPutData {
  ctx: Context;
  command: Command;
  // eslint-disable-next-line @typescript-eslint/ban-types
  nativeType: Function;
  view: any;
}

export interface CommandPutRuntime extends CommandPutData {
  args: any[];
  argv: Argv;
}

export type CommandPutPre<A extends any[] = any[]> = (
  data: CommandPutData,
  ...args: A
) => any;

export type CommandPut<A extends any[] = any[]> = (
  data: CommandPutRuntime,
  ...args: A
) => any;

export interface CommandConfigExtended extends Command.Config {
  empty?: boolean;
}

export interface CommandOptionConfigWithDescription extends Argv.OptionConfig {
  description?: string | Dict<string>;
}

export interface CommandLocaleDef extends I18n.Store {
  description?: string;
  options?: Dict<string>;
  usage?: string;
  examples?: string;
  messages?: I18n.Store;
}

// eslint-disable-next-line @typescript-eslint/ban-types
export type Renderer<T = any> = (params?: T) => string;
// eslint-disable-next-line @typescript-eslint/ban-types
export type CRenderer = (path: string, params?: object) => string;

export interface TemplateConfig {
  name: string;
  text: Dict<string>;
}

export interface CommandArgDef {
  index: number;
  decl?: Argv.Declaration;
}

export interface CommandRegisterConfig<D extends string = string> {
  def: D;
  desc?: string;
  config?: CommandConfigExtended;
  // putOptions?: CommandPut.Config[];
  // eslint-disable-next-line @typescript-eslint/ban-types
  paramTypes: Function[];
}

export interface CommandConfigExtended extends Command.Config {
  empty?: boolean;
}

export interface CommandOptionConfig {
  name: string;
  desc: string;
  config?: CommandOptionConfigWithDescription;
}

export type CommandReturnType = CanBeObserved<string | void>;
