import { DefinePlugin } from '../src/register';
import { OnGuild, UseCommand } from 'koishi-decorators';
import { BasePlugin } from '../dist';
import { If } from '../src/decorators';
import { App } from 'koishi';

@DefinePlugin()
class MyPlugin extends BasePlugin<{ foo: boolean; bar: boolean }> {
  @If<MyPlugin>((o, config, ctx) => config.foo)
  @UseCommand('foo')
  foo() {
    return 'foo';
  }

  @If<MyPlugin>((o, config, ctx) => config.bar)
  @UseCommand('bar')
  bar() {
    return 'bar';
  }
}

describe('It should register conditionally', () => {
  it('register command on condition', async () => {
    const app = new App();
    app.plugin(MyPlugin, { foo: true, bar: false });
    await app.start();
    const commandFoo = app.command('foo');
    const commandBar = app.command('bar');
    expect(await commandFoo.execute({})).toBe('foo');
    expect(await commandBar.execute({})).toBeFalsy();
  });
});
