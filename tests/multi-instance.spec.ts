import { DefinePlugin } from '../src/register';
import { RegisterSchema, SchemaProperty } from 'schemastery-gen';
import { BasePlugin } from '../src/base-plugin';
import { UseCommand } from 'koishi-decorators';
import { MultiInstancePlugin } from '../src/plugin-operators/multi-plugin';
import { App, Schema } from 'koishi';

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

@DefinePlugin({ schema: Schema.object({ msg: Schema.string() }) })
class Inner2 extends BasePlugin<InnerMessageConfig> {
  @UseCommand('message')
  async onMessage() {
    return this.config.msg;
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

@DefinePlugin()
class Outer2 extends MultiInstancePlugin(Inner2, OuterMessageConfig) {
  @UseCommand('message2')
  async onMessage() {
    return this.config.getMsg();
  }

  @UseCommand('message3')
  async onInnerMessage() {
    return this.instances[0].config.msg;
  }
}

describe('register multi plugin instance', () => {
  it('should work on schemastery-gen', async () => {
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

  it('should work on common schemastery', async () => {
    const app = new App();
    app.plugin(Outer2, { msg: 'hello', instances: [{ msg: 'world' }] });
    await app.start();
    const innerCommand = app.command('message');
    const outerCommand = app.command('message2');
    const innerInnerCommand = app.command('message3');
    expect(await innerCommand.execute({})).toBe('world');
    expect(await outerCommand.execute({})).toBe('hello');
    expect(await innerInnerCommand.execute({})).toBe('world');
  });
});
