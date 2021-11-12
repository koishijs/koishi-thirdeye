import { Context } from 'koishi';
import { ContextSelector } from '../def';

export function getStringFromNativeType(nativeType: any) {
  if (!nativeType) {
    return;
  }
  const nativeTypeString = nativeType.toString() as string;
  if (!nativeTypeString) {
    return;
  }
  if (nativeTypeString.startsWith('class')) {
    return 'class';
  }
  if (!nativeTypeString.startsWith('function ')) {
    return;
  }
  return nativeType.name?.toLowerCase();
}

export function applySelector(
  ctx: Context,
  selector: ContextSelector,
): Context {
  if (!selector) {
    return ctx;
  }
  let targetCtx = ctx;
  if (selector.select) {
    targetCtx = targetCtx.select(selector.select);
  }
  if (selector.useSelector) {
    targetCtx = selector.useSelector(targetCtx) || targetCtx;
  }
  return targetCtx;
}
