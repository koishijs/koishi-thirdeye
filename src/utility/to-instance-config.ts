import {
  AnyClass,
  OriginalClassSym,
  SchemaClass,
  SchemaProperty,
} from 'schemastery-gen';
import { Instances, ParamsFromClass, TypeFromClass } from '../def';

export function ToInstancesConfig<Inner extends new (...args: any[]) => any>(
  instanceConfig: Inner,
): new () => Instances<TypeFromClass<Inner>> {
  const instanceConfigClass = class InstancesConfig {
    instances: TypeFromClass<Inner>[];
  };
  SchemaProperty({
    type: SchemaClass(instanceConfig),
    default: [],
    array: true,
  })(instanceConfigClass.prototype, 'instances');
  return instanceConfigClass;
}
