import { App } from 'koishi';
import { DefinePlugin } from '../src/register';
import { UsePlugin } from '../src/decorators';
import { PluginDef } from '../src/def';
import PluginLru from '@koishijs/plugin-cache-lru';
import PluginOnebot from '@koishijs/plugin-adapter-onebot';

@DefinePlugin()
class MyPlugin {
  @UsePlugin()
  loadLru() {
    return PluginDef(PluginLru);
  }

  @UsePlugin()
  loadOnebot() {
    return PluginDef(PluginOnebot, { bots: [] });
  }
}

describe('Inner plugin', () => {
  let app: App;
  beforeEach(() => {
    app = new App();
    // app.plugin(PluginOnebot, { bots: [] });
  });

  it('should load inner plugin properly', () => {});
});
