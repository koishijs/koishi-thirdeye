import { DefinePlugin } from '../src/register';
import { RegisterSchema, SchemaProperty } from 'schemastery-gen';
import { BasePlugin } from '../src/base-plugin';
import { UseCommand } from 'koishi-decorators';
import { MultiInstancePlugin } from '../src/multi-plugin';
import { App } from 'koishi';

class MessageConfig {
  @SchemaProperty()
  msg: string;

  getMsg() {
    return this.msg;
  }
}

@RegisterSchema()
class InnerMessageConfig extends MessageConfig {}

@RegisterSchema()
class OuterMessageConfig extends MessageConfig {}

@DefinePlugin({ schema: InnerMessageConfig })
class Inner extends BasePlugin<InnerMessageConfig> {
  @UseCommand('message')
  async onMessage() {
    return this.config.getMsg();
  }
}

@DefinePlugin()
class Outer extends MultiInstancePlugin(Inner, OuterMessageConfig) {
  @UseCommand('message2')
  async onMessage() {
    return this.config.getMsg();
  }

  @UseCommand('message3')
  async onInnerMessage() {
    return this.instances[0].config.getMsg();
  }
}

describe('It should register multi plugin instance', () => {
  it('register command on condition', async () => {
    const app = new App();
    app.plugin(Outer, { msg: 'hello', instances: [{ msg: 'world' }] });
    await app.start();
    const innerCommand = app.command('message');
    const outerCommand = app.command('message2');
    const innerInnerCommand = app.command('message3');
    expect(await innerCommand.execute({})).toBe('world');
    expect(await outerCommand.execute({})).toBe('hello');
    expect(await innerInnerCommand.execute({})).toBe('world');
  });
});
