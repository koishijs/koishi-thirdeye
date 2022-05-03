import {
  AnyClass,
  OriginalClassSym,
  SchemaClass,
  SchemaProperty,
} from 'schemastery-gen';
import { Instances, ParamsFromClass, TypeFromClass } from '../def';

export function ToInstancesConfig<Inner extends new (...args: any[]) => any>(
  instanceConfig: Inner,
): new () => Instances<TypeFromClass<Inner>>;
export function ToInstancesConfig<
  Inner extends AnyClass,
  Outer extends AnyClass,
>(
  instanceConfig: Inner,
  outerConfig?: Outer,
): new (...args: ParamsFromClass<Outer>) => Instances<TypeFromClass<Inner>> &
  TypeFromClass<Outer>;
export function ToInstancesConfig<
  Inner extends AnyClass,
  Outer extends AnyClass,
>(
  instanceConfig: Inner,
  outerConfig?: Outer,
): new (...args: ParamsFromClass<Outer>) => Instances<TypeFromClass<Inner>> &
  TypeFromClass<Outer> {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  outerConfig ??= class EmptyConfig {};
  if (outerConfig[OriginalClassSym]) {
    outerConfig = outerConfig[OriginalClassSym];
  }
  const instanceConfigClass = class MixedInstancesConfig extends outerConfig {
    instances: TypeFromClass<Inner>[];
  };
  SchemaProperty({
    type: SchemaClass(instanceConfig),
    default: [],
    array: true,
  })(instanceConfigClass.prototype, 'instances');
  return instanceConfigClass;
}
