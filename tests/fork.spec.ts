import { RegisterSchema, SchemaProperty } from 'schemastery-gen';
import { DefinePlugin } from '../src/register';
import { ParentPluginMap, StarterPlugin } from '../src/base-plugin';
import { Fork, InjectParent, Provide, Reusable } from '../src/decorators';
import { Apply, UseCommand } from 'koishi-decorators';
import { App } from 'koishi';
import { Prop } from '../src/def';

declare module 'koishi' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Context {
    interface Services {
      forkTest: MyPlugin;
    }
  }
}

@RegisterSchema()
class Config {
  @SchemaProperty()
  name: string;

  getName() {
    return this.name;
  }
}

@DefinePlugin()
class ChildPlugin extends StarterPlugin(Config) {
  @InjectParent()
  parent: Prop<MyPlugin>;

  @UseCommand('parent{{name}}')
  async onParentCommand() {
    return this.parent.config.getName();
  }

  @UseCommand('child{{name}}')
  async onSelfCommand() {
    return this.config.getName();
  }

  @Apply()
  increase() {
    this.parent.loadCount++;
    // console.log('fork loaded: ', this.parent.loadCount);
  }
}

@Provide('forkTest', { immediate: true })
@DefinePlugin()
class MyPlugin extends ParentPluginMap(ChildPlugin, (p) => p.config.getName()) {
  loadCount = 0;
  isParent = true;

  @Apply()
  onLoad() {
    // console.log('load', this.config);
  }
}

@Reusable()
@DefinePlugin()
class MyReusablePlugin extends StarterPlugin(Config) {
  @Apply()
  onLoad() {
    this.ctx.app['count']++;
  }
}

describe('Fork', () => {
  let app: App;
  beforeEach(async () => {
    app = new App();
    await app.start();
    app['count'] = 0;
  });

  it('should fork a plugin', async () => {
    // console.log('before 1');
    app.plugin(MyPlugin, { name: 'a' });
    // console.log('after 1: ' + app.forkTest.loadCount);
    const myPlugin = app.forkTest;
    expect(app.forkTest.config.getName()).toEqual('a');
    expect(app.forkTest.instances.get('a').config.getName()).toEqual('a');
    // console.log(myPlugin.instances.get('a').parent);
    // console.log(myPlugin);
    expect(myPlugin.instances.get('a').parent === myPlugin).toBe(true);
    expect(app.forkTest.instances.get('b')).toBeUndefined();
    expect(app.forkTest.loadCount).toBe(1);

    // console.log('before 2: ' + app.forkTest.loadCount);
    app.plugin(MyPlugin, { name: 'b' });
    // console.log('after 2: ' + app.forkTest.loadCount);
    expect(app.forkTest.instances.get('b').config.getName()).toEqual('b');
    // console.log(myPlugin.instances.get('b').parent);
    // console.log(myPlugin);
    expect(myPlugin.instances.get('b').parent === myPlugin).toBe(true);
    expect(app.forkTest.loadCount).toBe(2);

    // console.log('before 3: ' + app.forkTest.loadCount);
    app.plugin(MyPlugin, { name: 'c' });
    // console.log('after 3: ' + app.forkTest.loadCount);
    expect(app.forkTest.instances.get('c').config.getName()).toEqual('c');
    // console.log(myPlugin.instances.get('c').parent);
    // console.log(myPlugin);
    expect(myPlugin.instances.get('c').parent === myPlugin).toBe(true);
    expect(app.forkTest.loadCount).toBe(3);

    const commandChildA = app.command('childa');
    const commandChildB = app.command('childb');
    const commandParentA = app.command('parenta');
    const commandParentB = app.command('parentb');

    expect(await commandChildA.execute({})).toEqual('a');
    expect(await commandChildB.execute({})).toEqual('b');
    expect(await commandParentA.execute({})).toEqual('a');
    expect(await commandParentB.execute({})).toEqual('a');
  });

  it('it should work on reusable', async () => {
    expect(app['count']).toBe(0);
    app.plugin(MyReusablePlugin, { name: 'a' });
    expect(app['count']).toBe(1);
    app.plugin(MyReusablePlugin, { name: 'b' });
    expect(app['count']).toBe(2);
  });
});
