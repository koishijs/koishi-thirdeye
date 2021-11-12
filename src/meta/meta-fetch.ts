import {
  MetadataArrayMap,
  MetadataArrayValue,
  MetadataGenericMap,
  MetadataMapValue,
} from '../def';

export function getMetadata<K extends keyof MetadataGenericMap>(
  metadataKey: K,
  instance: any,
  key?: string | symbol,
): MetadataMapValue<K> {
  const instanceClass = instance.constructor;
  if (key) {
    return Reflect.getMetadata(metadataKey, instanceClass, key);
  } else {
    return Reflect.getMetadata(metadataKey, instanceClass);
  }
}

export function getMetadataArray<K extends keyof MetadataArrayMap>(
  metadataKey: K,
  instance: any,
  key?: string | symbol,
): MetadataArrayValue<K> {
  return getMetadata(metadataKey, instance, key) || [];
}

export function getPropertyMetadata<K extends keyof MetadataArrayMap, I = any>(
  metadataKey: K,
  instance: I,
  originalClass: any,
  key: keyof I & (string | symbol),
): MetadataArrayValue<K> {
  const valueFromClass = getMetadataArray(metadataKey, originalClass);
  const valueFromProperty = getMetadataArray(metadataKey, instance, key);
  return [...valueFromClass, ...valueFromProperty] as MetadataArrayValue<K>;
}
