import { TypeFromClass } from 'cordis-decorators';

export function ClonePlugin<P extends { new (...args: any[]): any }>(
  target: P,
  name: string,
  callback?: (instance: TypeFromClass<P>) => void,
): P {
  const clonedPlugin = class extends target {
    constructor(...args: any[]) {
      super(...args);
      if (callback) {
        callback(this as any);
      }
    }
  };
  for (const property of ['Config', 'schema', 'using']) {
    Object.defineProperty(clonedPlugin, property, {
      enumerable: true,
      configurable: true,
      writable: true,
      value: target[property],
    });
  }
  Object.defineProperty(clonedPlugin, 'name', {
    enumerable: true,
    configurable: true,
    writable: true,
    value: name,
  });
  return clonedPlugin;
}
