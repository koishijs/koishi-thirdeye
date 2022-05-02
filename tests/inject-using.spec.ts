import { Inject, DefinePlugin, UsingService } from '..';
import { Cache, Assets, Bot, Context } from 'koishi';

describe('InjectUsing', () => {
  @UsingService('router')
  @DefinePlugin({ using: ['database'] })
  @UsingService('http')
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
    expect(usingList.length).toEqual(5);
    expect(usingList.includes('database')).toEqual(true);
    expect(usingList.includes('assets')).toEqual(true);
    expect(usingList.includes('cache')).toEqual(true);
    expect(usingList.includes('router')).toEqual(true);
    expect(usingList.includes('bots')).toEqual(false);
    expect(usingList.includes('http')).toEqual(true);
  });
});
