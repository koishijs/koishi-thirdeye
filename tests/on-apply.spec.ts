import { App, Context, Logger } from 'koishi';
import {
  DefinePlugin,
  OnApply,
  OnConnect,
  OnDisconnect,
} from '../src/register';
import {
  Inject,
  InjectContext,
  InjectLogger,
  Provide,
} from '../src/decorators';
import { BasePlugin } from '../src/base-plugin';

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
@DefinePlugin()
class ImmediateDependency {}

@Provide('nonImmediateDependency')
@DefinePlugin()
class NonImmediateDependency {}

@Provide('myPlugin', { immediate: true })
@DefinePlugin()
class TestingBase
  extends BasePlugin<any>
  implements OnConnect, OnDisconnect, OnApply
{
  @InjectLogger()
  logger: Logger;

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

async function RunApplyTest(app: App, plugin: any) {
  app.plugin(plugin);
  await app.start();
  const myPlugin = app.myPlugin;
  expect(myPlugin.applied).toBe(true);
  expect(myPlugin.connected).toBe(true);
  expect(myPlugin.disconnected).toBe(false);
  app.dispose(plugin);
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
    await RunApplyTest(app, MyPlugin);
  });
  it('should be applied and connected with immediate dependency', async () => {
    await RunApplyTest(app, MyPlugin2);
  });
  it('should be applied and connected with non-immediate dependency', async () => {
    await RunApplyTest(app, MyPlugin3);
  });

  it('should name logger correctly', () => {
    app.plugin(MyPlugin);
    const myPlugin = app.myPlugin;
    expect(myPlugin.logger.name).toBe('MyPlugin');
  });
});
