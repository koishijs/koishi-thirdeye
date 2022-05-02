import { OriginalClassSym, SchemaClass, SchemaProperty } from 'schemastery-gen';
import {
  AnyClassType,
  Instances,
  ParamsFromClass,
  TypeFromClass,
} from '../def';
import { kSchema } from 'schemastery-gen/dist/src/utility/kschema';

export function ToInstancesConfig<Inner extends new (...args: any[]) => any>(
  instanceConfig: Inner,
): new () => Instances<TypeFromClass<Inner>>;
export function ToInstancesConfig<
  Inner extends new (...args: any[]) => any,
  Outer extends new (...args: any[]) => any,
>(
  instanceConfig: Inner,
  outerConfig?: Outer,
): new (...args: ParamsFromClass<Outer>) => Instances<TypeFromClass<Inner>> &
  TypeFromClass<Outer>;
export function ToInstancesConfig<
  Inner extends AnyClassType,
  Outer extends AnyClassType,
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
