import { App } from 'koishi';
import { DefinePlugin } from '../src/register';
import { UsePlugin } from '../src/decorators';
import { PluginDef } from '../src/def';
import PluginOnebot from '@koishijs/plugin-adapter-onebot';
import { BasePlugin } from '../src/base-plugin';

@DefinePlugin()
class MyPlugin extends BasePlugin<any> {
  @UsePlugin()
  loadOnebot() {
    return PluginDef(PluginOnebot, {
      bots: [{ protocol: 'wsreverse', selfId: '11111' }],
    });
  }
}

describe('Inner plugin', () => {
  let app: App;
  beforeEach(async () => {
    app = new App({ port: 11111 });
    await app.start();
    // app.plugin(PluginOnebot, { bots: [] });
  });

  it('should load inner plugin properly', () => {
    app.plugin(MyPlugin);
    expect(app.bots.length).toBe(1);
    //expect(app.cache).toBeDefined();
  });
});
