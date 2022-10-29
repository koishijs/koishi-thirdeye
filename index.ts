import { Context } from 'koishi';

export * from 'satori-decorators';
export * from './src/cosmotype-exports';
export * from './src/decorators';
export * from './src/def';
export * from './src/registrar';

declare module 'satori-decorators' {
  function selectContext<Ctx extends Context>(
    root: Ctx,
    options: Selection,
  ): Ctx;
}
