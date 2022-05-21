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
  matrix: { commands: { name: string; return: string }[] }[];
}> {
  @For<MyPlugin2>(({ config }) => config.commands)
  @If<MyPlugin2>((_, def) => def.name !== 'badthing')
  @UseCommand('{{name}}')
  onCommand(
    @PutValue('{{return}}') returnValue: string,
    @PutValue('{{prefix}}') prefix: string,
  ) {
    return prefix + returnValue;
  }
  @For<MyPlugin2>(({ config }) => config.matrix)
  @For<MyPlugin2>((_, matrix) => matrix.commands)
  @If<MyPlugin2>((_, def) => def.name !== 'badthing')
  @UseCommand('{{name}}')
  onMatrix(
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
        { name: 'badthing', return: 'bad' },
      ],
      matrix: [
        {
          commands: [
            { name: 'foo1', return: 'bar1' },
            { name: 'bar1', return: 'baz1' },
            { name: 'badthing', return: 'bad' },
          ],
        },
        {
          commands: [
            { name: 'foo2', return: 'bar2' },
            { name: 'bar2', return: 'baz2' },
            { name: 'badthing', return: 'bad' },
          ],
        },
      ],
      prefix: '> ',
    });
    await app.start();
    const commandFoo = app.command('foo');
    const commandBar = app.command('bar');
    expect(await commandFoo.execute({})).toBe('> bar');
    expect(await commandBar.execute({})).toBe('> baz');
    const commandFoo1 = app.command('foo1');
    const commandBar1 = app.command('bar1');
    expect(await commandFoo1.execute({})).toBe('> bar1');
    expect(await commandBar1.execute({})).toBe('> baz1');
    const commandFoo2 = app.command('foo2');
    const commandBar2 = app.command('bar2');
    expect(await commandFoo2.execute({})).toBe('> bar2');
    expect(await commandBar2.execute({})).toBe('> baz2');
    expect(await app.command('badthing').execute({})).toBeFalsy();
  });
});
