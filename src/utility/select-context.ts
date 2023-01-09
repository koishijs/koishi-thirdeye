import { Context, makeArray, MaybeArray } from 'koishi';

const selectors = [
  'user',
  'guild',
  'channel',
  'self',
  'private',
  'platform',
] as const;

export type SelectorType = typeof selectors[number];
export type SelectorValue = boolean | MaybeArray<string | number>;
export type BaseSelection = { [K in SelectorType]?: SelectorValue };

export interface Selection extends BaseSelection {
  and?: Selection[];
  or?: Selection[];
  not?: Selection;
}

export function selectContext<Ctx extends Context>(
  root: Ctx,
  options: Selection,
) {
  let ctx = root;

  // basic selectors
  for (const type of selectors) {
    const value = options[type];
    if (value === true) {
      ctx = ctx[type]();
    } else if (value === false) {
      ctx = ctx.exclude(ctx[type]());
    } else if (value !== undefined) {
      // we turn everything into string
      ctx = ctx[type](...makeArray(value).map((item) => '' + item));
    }
  }

  // intersect
  if (options.and) {
    for (const selection of options.and) {
      ctx = ctx.intersect(selectContext<Ctx>(root, selection));
    }
  }

  // union
  if (options.or) {
    let ctx2: Context = ctx.never();
    for (const selection of options.or) {
      ctx2 = ctx2.union(selectContext<Ctx>(root, selection));
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    ctx = ctx.intersect(ctx2);
  }

  // exclude
  if (options.not) {
    ctx = ctx.exclude(selectContext<Ctx>(root, options.not));
  }

  return ctx;
}
