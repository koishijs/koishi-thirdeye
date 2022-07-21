import { Command, Context, Dict } from 'koishi';
import { CommandOptionConfig, TemplateConfig } from '../def';
import { applyNativeTypeToArg } from './native-type-mapping';

export function adaptLocaleDict(value: string | Dict<string>): Dict<string> {
  if (typeof value === 'string') {
    return {
      '': value,
    };
  }
  return value;
}

export const registerTemplate = (
  templateConfig: TemplateConfig,
  ctx: Context,
  command?: Command,
) => {
  const key =
    (command ? `commands.${command.name}.messages.` : '') + templateConfig.name;
  for (const [locale, text] of Object.entries(templateConfig.text)) {
    ctx.i18n.define(locale, key, text);
  }
};

export function applyOptionToCommand(
  ctx: Context,
  cmd: Command,
  def: CommandOptionConfig,
  // eslint-disable-next-line @typescript-eslint/ban-types
  nativeType?: Function,
) {
  const { name, config } = def;
  const { desc } = def;
  if (config?.description) {
    const desc = adaptLocaleDict(config.description);
    for (const [locale, text] of Object.entries(desc)) {
      ctx.i18n.define(locale, `commands.${cmd.name}.options.${name}`, text);
    }
  }
  const clonedConfig = { ...(config || {}) };
  delete clonedConfig.description;
  cmd = cmd.option(name, desc, clonedConfig);
  const option = cmd._options[name];
  applyNativeTypeToArg(option, nativeType);
  return cmd;
}
