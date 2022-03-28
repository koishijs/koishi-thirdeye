import { App } from 'koishi';
import { DefinePlugin } from '../src/register';
import { UsePlugin } from '../src/decorators';
import PluginOnebot from '@koishijs/plugin-adapter-onebot';
import { BasePlugin } from '../src/base-plugin';
import { PluginDef } from 'koishi-decorators';

@DefinePlugin()
class MyPlugin extends BasePlugin<any> {
  @UsePlugin()
  loadOnebot() {
    return PluginDef(PluginOnebot, {
      bots: [{ protocol: 'wsreverse', selfId: '11111' }],
    });
  }
}

@DefinePlugin()
class MyLazyPlugin extends BasePlugin<any> {
  @UsePlugin()
  async loadOnebot() {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    this.ctx.app['_flag'] = 2;
    return PluginDef((ctx) => (ctx.app['_flag1'] = 1));
  }
}

describe('Inner plugin', () => {
  let app: App;

  it('should load inner plugin properly', async () => {
    app = new App();
    await app.start();
    app.plugin(MyPlugin);
    expect(app.bots.length).toBe(1);
    //expect(app.cache).toBeDefined();
  });

  it('should wait for plugin to load', async () => {
    app = new App();
    app['_flag'] = 1;
    app['_flag1'] = 0;
    app.plugin(MyLazyPlugin);
    expect(app['_flag']).toBe(1);
    expect(app['_flag1']).toBe(0);
    await app.start();
    expect(app['_flag']).toBe(2);
    expect(app['_flag1']).toBe(1);
  });
});
