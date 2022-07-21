import { Argv } from 'koishi';

// eslint-disable-next-line @typescript-eslint/ban-types
export const nativeTypeMapping = new Map<Function, Argv.Type>();
nativeTypeMapping.set(String, 'string');
nativeTypeMapping.set(Number, 'number');
nativeTypeMapping.set(Boolean, 'boolean');
nativeTypeMapping.set(Date, 'date');

export function applyNativeTypeToArg(
  arg: Argv.Declaration,
  // eslint-disable-next-line @typescript-eslint/ban-types
  nativeType: Function,
) {
  if (arg.type || !nativeType) {
    return;
  }
  if (nativeTypeMapping.has(nativeType)) {
    arg.type = nativeTypeMapping.get(nativeType);
  }
}
