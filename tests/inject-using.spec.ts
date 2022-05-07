import { RegisterSchema, SchemaProperty } from '..';
import { Assets, Bot, Cache, Context } from 'koishi';
import { PluginName, UsingService, Inject, PluginSchema } from '../src/decorators';
import { DefinePlugin } from '../src/register';

@RegisterSchema()
class Config {
  @SchemaProperty()
  foo: string;
}

describe('InjectUsing', () => {
  @PluginSchema(Config)
  @PluginName('foo-plugin')
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
    expect(MyPlugin.name).toBe('foo-plugin');
    expect(MyPlugin['Config']).toEqual(Config);
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
