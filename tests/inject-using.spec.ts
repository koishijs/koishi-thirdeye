import { Fork, RegisterSchema, SchemaProperty, StarterPlugin } from '..';
import { Assets, Bot, Cache } from 'koishi';
import { Inject, PluginName, UsingService } from '../src/decorators';
import { DefinePlugin } from '../src/register';
import { ServiceName } from '../src/def';

@RegisterSchema()
class Config {
  @SchemaProperty()
  foo: string;
}

describe('InjectUsing', () => {
  @DefinePlugin()
  @UsingService('foo')
  class MyFork extends StarterPlugin(Config) {}

  @PluginName('foo-plugin')
  @UsingService('router')
  @DefinePlugin({ using: ['database'], schema: Config })
  @UsingService('http')
  @Fork(MyFork)
  class MyPlugin extends StarterPlugin(Config) {
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
    const usingList = (MyPlugin as any).using as ServiceName[];
    expect(usingList).toBeInstanceOf(Array);
    expect(usingList.length).toEqual(6);
    expect(usingList.includes('database')).toEqual(true);
    expect(usingList.includes('assets')).toEqual(true);
    expect(usingList.includes('cache')).toEqual(true);
    expect(usingList.includes('router')).toEqual(true);
    expect(usingList.includes('bots')).toEqual(false);
    expect(usingList.includes('http')).toEqual(true);
    expect(usingList.includes('foo')).toEqual(true);
  });
});
