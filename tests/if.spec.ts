import { DefinePlugin } from '../src/register';
import { PutValue, UseCommand } from 'koishi-decorators';
import { For, If } from '../src/decorators';
import { App } from 'koishi';
import { BasePlugin } from '../src/base-plugin';

@DefinePlugin()
class MyPlugin extends BasePlugin<{ foo: boolean; bar: boolean }> {
  @If<MyPlugin>((o) => o.config.foo)
  @UseCommand('foo')
  foo() {
    return 'foo';
  }

  @If<MyPlugin>((o) => o.config.bar)
  @UseCommand('bar')
  bar() {
    return 'bar';
  }
}

@DefinePlugin()
class MyPlugin2 extends BasePlugin<{
  prefix: string;
  commands: { name: string; return: string }[];
}> {
  @For<MyPlugin2>(({ config }) => config.commands)
  @UseCommand('{{name}}')
  onCommand(
    @PutValue('{{return}}') returnValue: string,
    @PutValue('{{prefix}}') prefix: string,
  ) {
    return prefix + returnValue;
  }
}

describe('It should register conditionally', () => {
  it('registers command on condition', async () => {
    const app = new App();
    app.plugin(MyPlugin, { foo: true, bar: false });
    await app.start();
    const commandFoo = app.command('foo');
    const commandBar = app.command('bar');
    expect(await commandFoo.execute({})).toBe('foo');
    expect(await commandBar.execute({})).toBeFalsy();
  });

  it('iterates commands on condition', async () => {
    const app = new App();
    app.plugin(MyPlugin2, {
      commands: [
        { name: 'foo', return: 'bar' },
        { name: 'bar', return: 'baz' },
      ],
      prefix: '> ',
    });
    await app.start();
    const commandFoo = app.command('foo');
    const commandBar = app.command('bar');
    expect(await commandFoo.execute({})).toBe('> bar');
    expect(await commandBar.execute({})).toBe('> baz');
  });
});
