import { App, Context } from 'koishi';
import {
  KoishiPlugin,
  OnApply,
  OnConnect,
  OnDisconnect,
} from '../src/register';
import { Inject, InjectContext, Provide } from '../src/decorators';

declare module 'koishi' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Context {
    interface Services {
      immediateDependency: ImmediateDependency;
      nonImmediateDependency: NonImmediateDependency;
      myPlugin: TestingBase;
    }
  }
}

@Provide('immediateDependency', { immediate: true })
@KoishiPlugin()
class ImmediateDependency {}

@Provide('nonImmediateDependency')
@KoishiPlugin()
class NonImmediateDependency {}

@Provide('myPlugin', { immediate: true })
@KoishiPlugin()
class TestingBase implements OnConnect, OnDisconnect, OnApply {
  @InjectContext()
  ctx: Context;

  onApply() {
    this.applied = true;
  }

  onConnect() {
    this.connected = true;
  }

  onDisconnect() {
    this.disconnected = true;
  }

  applied = false;
  connected = false;
  disconnected = false;
}

class MyPlugin extends TestingBase {}

class MyPlugin2 extends TestingBase {
  @Inject(true)
  immediateDependency: ImmediateDependency;
}

class MyPlugin3 extends TestingBase {
  @Inject(true)
  nonImmediateDependency: NonImmediateDependency;
}

async function RunApplyTest(app: App) {
  await app.start();
  const myPlugin = app.myPlugin;
  expect(myPlugin.applied).toBe(true);
  expect(myPlugin.connected).toBe(true);
  expect(myPlugin.disconnected).toBe(false);
  await myPlugin.ctx.dispose();
  expect(myPlugin.disconnected).toBe(true);
  expect(app.immediateDependency).toBeDefined();
  expect(app.nonImmediateDependency).toBeDefined();
  await app.stop();
}

describe('Apply and Connect in koishi-thirdeye', () => {
  let app: App;
  beforeEach(() => {
    app = new App();
    app.plugin(ImmediateDependency);
    app.plugin(NonImmediateDependency);
  });

  it('should be applied and connected', async () => {
    app.plugin(MyPlugin);
    const myPlugin = app.myPlugin;
    expect(myPlugin.applied).toBe(true);
    expect(myPlugin.connected).toBe(false);
    expect(myPlugin.disconnected).toBe(false);
    await RunApplyTest(app);
  });
  it('should be applied and connected with immediate dependency', async () => {
    app.plugin(MyPlugin2);
    await RunApplyTest(app);
  });
  /*it('should be applied and connected with non-immediate dependency', async () => {
    app.plugin(MyPlugin3);
    await RunApplyTest(app);
  });*/
});
