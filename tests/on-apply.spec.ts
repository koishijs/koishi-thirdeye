import { App, Context } from 'koishi';
import { InjectContext, OnApply, OnConnect, OnDisconnect, Provide } from '..';
import { KoishiPlugin } from '../src/register';

declare module 'koishi' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Context {
    interface Services {
      myPlugin: MyPlugin;
    }
  }
}

@Provide('myPlugin', { immediate: true })
@KoishiPlugin()
class MyPlugin implements OnApply, OnConnect, OnDisconnect {
  @InjectContext()
  ctx: Context;

  applied = false;
  connected = false;
  disconnected = false;
  onApply() {
    this.applied = true;
  }
  onConnect() {
    this.connected = true;
  }
  onDisconnect() {
    this.disconnected = true;
  }
}

describe('Apply and Connect', () => {
  it('should be applied and connected', async () => {
    const app = new App();
    app.plugin(MyPlugin);
    const myPlugin = app.myPlugin;
    expect(myPlugin.applied).toBe(true);
    expect(myPlugin.connected).toBe(false);
    expect(myPlugin.disconnected).toBe(false);
    await app.start();
    expect(myPlugin.connected).toBe(true);
    expect(myPlugin.disconnected).toBe(false);
    await myPlugin.ctx.dispose();
    expect(myPlugin.disconnected).toBe(true);
    await app.stop();
  });
});
