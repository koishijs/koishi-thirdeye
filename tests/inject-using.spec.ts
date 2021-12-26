import { Inject, DefinePlugin } from '..';
import { Cache, Assets, Bot, Context } from 'koishi';

describe('InjectUsing', () => {
  @DefinePlugin({ using: ['database'] })
  class MyPlugin {
    @Inject(true)
    cache: Cache;

    @Inject('assets', true)
    assets: Assets;

    @Inject('bots')
    bots: Bot[];
  }

  it('Should include injected using services', () => {
    const usingList = (MyPlugin as any).using as (keyof Context.Services)[];
    expect(usingList).toBeInstanceOf(Array);
    expect(usingList.length).toEqual(3);
    expect(usingList.includes('database')).toEqual(true);
    expect(usingList.includes('assets')).toEqual(true);
    expect(usingList.includes('cache')).toEqual(true);
    expect(usingList.includes('bots')).toEqual(false);
  });
});
