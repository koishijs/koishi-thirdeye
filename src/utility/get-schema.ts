import { PluginClass } from '../def';
import { BasePlugin } from '../base-plugin';
import { ClassType } from 'schemastery-gen';
import { reflector } from '../meta/meta-fetch';

export function getPluginSchema<P extends PluginClass>(
  plugin: P,
): ClassType<
  P extends BasePlugin<any, infer PC>
    ? PC
    : P extends PluginClass<infer C>
    ? C
    : never
> {
  return (
    plugin['Config'] ||
    plugin['schema'] ||
    reflector.get('KoishiPredefineSchema', plugin)
  );
}
