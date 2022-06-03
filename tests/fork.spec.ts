import { RegisterSchema, SchemaProperty } from 'schemastery-gen';
import { DefinePlugin } from '../src/register';
import { ParentPluginMap, StarterPlugin } from '../src/base-plugin';
import { Fork, InjectParent, Provide } from '../src/decorators';
import { UseCommand } from 'koishi-decorators';
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
}

@Provide('forkTest', { immediate: true })
@DefinePlugin()
class MyPlugin extends ParentPluginMap(ChildPlugin, (p) => p.config.getName()) {
  isParent = true;
}

describe('Fork', () => {
  let app: App;
  beforeEach(async () => {
    app = new App();
    await app.start();
  });

  it('should fork a plugin', async () => {
    app.plugin(MyPlugin, { name: 'a' });
    const myPlugin = app.forkTest;
    expect(app.forkTest.config.getName()).toEqual('a');
    expect(app.forkTest.instances.get('a').config.getName()).toEqual('a');
    expect(app.forkTest.instances.get('a').parent).toEqual(myPlugin);
    expect(app.forkTest.instances.get('b')).toBeUndefined();
    app.plugin(MyPlugin, { name: 'b' });
    expect(app.forkTest.instances.get('b').config.getName()).toEqual('b');
    expect(myPlugin.instances.get('b').parent).toEqual(app.forkTest);

    const commandChildA = app.command('childa');
    const commandChildB = app.command('childb');
    const commandParentA = app.command('parenta');
    const commandParentB = app.command('parentb');

    expect(await commandChildA.execute({})).toEqual('a');
    expect(await commandChildB.execute({})).toEqual('b');
    expect(await commandParentA.execute({})).toEqual('a');
    // expect(await commandParentB.execute({})).toEqual('a');
  });
});
