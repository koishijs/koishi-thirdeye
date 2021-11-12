import {
  MetadataArrayMap,
  MetadataArrayValue,
  MetadataArrayValueMap,
  MetadataGenericMap,
  MetadataKey,
} from '../def';

export type AllDecorators = MethodDecorator &
  ClassDecorator &
  PropertyDecorator;

function getMetadataInDecorator<
  K extends MetadataKey,
  VM extends Partial<MetadataGenericMap> = MetadataGenericMap
>(metaKey: K, target: any, key?: any): VM[K] {
  const targetClass = target.constructor;
  if (key) {
    return Reflect.getMetadata(metaKey, targetClass, key);
  } else {
    return Reflect.getMetadata(metaKey, targetClass);
  }
}

function setMetadataInDecorator<
  K extends MetadataKey,
  VM extends Partial<MetadataGenericMap> = MetadataGenericMap
>(metaKey: K, value: VM[K], target: any, key?: any) {
  const targetClass = target.constructor;
  if (key) {
    return Reflect.defineMetadata(metaKey, value, targetClass, key);
  } else {
    return Reflect.defineMetadata(metaKey, value, targetClass);
  }
}

function TransformMetadata<
  K extends MetadataKey,
  VM extends Partial<MetadataGenericMap> = MetadataGenericMap
>(
  metadataKey: K,
  metadataValueFun: (oldValue: VM[K]) => VM[K],
  keysIndexMeta?: keyof MetadataArrayMap,
): AllDecorators {
  return (target: any, key?: any, descriptor?: any) => {
    const oldValue: VM[K] = getMetadataInDecorator(metadataKey, target, key);
    const newValue = metadataValueFun(oldValue);
    setMetadataInDecorator(metadataKey, newValue, target, key);
    if (keysIndexMeta) {
      const keysDec = AppendMetadataUnique(keysIndexMeta, key);
      keysDec(target);
    }
    if (descriptor) {
      return descriptor;
    }
    return target;
  };
}

export const SetMetadata = <K extends keyof MetadataGenericMap>(
  metadataKey: K,
  metadataValue: MetadataGenericMap[K],
  keysIndexMeta?: keyof MetadataArrayMap,
): AllDecorators =>
  TransformMetadata<K>(metadataKey, () => metadataValue, keysIndexMeta);

export const AppendMetadata = <K extends keyof MetadataArrayMap>(
  metadataKey: K,
  metadataValue: MetadataArrayMap[K],
  keysIndexMeta?: keyof MetadataArrayMap,
): AllDecorators =>
  TransformMetadata<K, MetadataArrayValueMap>(
    metadataKey,
    (arr) => {
      const newArr = arr || [];
      newArr.push(metadataValue);
      return newArr;
    },
    keysIndexMeta,
  );

export const AppendMetadataUnique = <K extends keyof MetadataArrayMap>(
  metadataKey: K,
  metadataValue: MetadataArrayMap[K],
  keysIndexMeta?: keyof MetadataArrayMap,
): AllDecorators =>
  TransformMetadata<K, MetadataArrayValueMap>(
    metadataKey,
    (arr) => {
      const newArr = arr || [];
      if (newArr.includes(metadataValue)) {
        return newArr;
      }
      newArr.push(metadataValue);
      return newArr;
    },
    keysIndexMeta,
  );

export const ConcatMetadata = <K extends keyof MetadataArrayValueMap>(
  metadataKey: K,
  metadataValue: MetadataArrayValue<K>,
  keysIndexMeta?: keyof MetadataArrayMap,
): AllDecorators =>
  TransformMetadata<K, MetadataArrayValueMap>(
    metadataKey,
    (arr) => ((arr || []) as any[]).concat(metadataValue),
    keysIndexMeta,
  );
