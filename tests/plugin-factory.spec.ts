import { SchemaProperty } from 'schemastery-gen';
import { UseCommand } from 'koishi-decorators';
import { CreatePluginFactory } from '../src/plugin-factory';
import { App } from 'koishi';
import { DefinePlugin } from '../src/register';
import { BasePlugin } from '../src/base-plugin';

class MessageConfig {
  @SchemaProperty()
  msg: string;

  getMsg() {
    return this.msg;
  }
}

class Base extends BasePlugin<MessageConfig> {
  @UseCommand('message')
  async onMessage() {
    return this.config.getMsg();
  }
}

const Factory = CreatePluginFactory(Base, MessageConfig);

class SpecificConfig {
  @SchemaProperty()
  msg2: string;

  getMsg2() {
    return this.msg2;
  }
}

@DefinePlugin()
class SpecificPlugin extends Factory(SpecificConfig) {
  @UseCommand('message2')
  async onMessage2() {
    return this.config.getMsg2();
  }
}

describe('plugin factory', () => {
  it('should register SpecificPlugin', async () => {
    const app = new App();
    app.plugin(SpecificPlugin, { msg: 'hello', msg2: 'world' });
    await app.start();
    const innerCommand = app.command('message');
    const outerCommand = app.command('message2');
    expect(await innerCommand.execute({})).toBe('hello');
    expect(await outerCommand.execute({})).toBe('world');
  });
});
