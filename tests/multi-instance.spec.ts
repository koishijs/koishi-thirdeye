import { RegisterSchema, SchemaProperty } from 'cordis-decorators';
import { MultiInstancePlugin } from '../src/plugin-operators';
import { App, Schema } from 'koishi';
import { StarterPlugin } from '../src/registrar';
import { DefinePlugin, UseEvent } from '../src/decorators';

declare module 'cordis' {
  interface Events<C> {
    message1: string;
    message2: string;
    message3: string;
  }
}

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
class Inner extends StarterPlugin(InnerMessageConfig) {
  @UseEvent('message1')
  onMessage() {
    return this.config.getMsg();
  }
}

@DefinePlugin({ schema: Schema.object({ msg: Schema.string() }) })
class Inner2 extends StarterPlugin(InnerMessageConfig) {
  @UseEvent('message1')
  onMessage() {
    return this.config.msg;
  }
}

@DefinePlugin()
class Outer extends MultiInstancePlugin(Inner, OuterMessageConfig) {
  @UseEvent('message2')
  onMessage() {
    return this.config.getMsg();
  }

  @UseEvent('message3')
  onInnerMessage() {
    return this.instances[0].config.getMsg();
  }
}

@DefinePlugin()
class Outer2 extends MultiInstancePlugin(Inner2, OuterMessageConfig) {
  @UseEvent('message2')
  onMessage() {
    return this.config.getMsg();
  }

  @UseEvent('message3')
  onInnerMessage() {
    return this.instances[0].config.msg;
  }
}

describe('register multi plugin instance', () => {
  it('should work on schemastery-gen', async () => {
    const app = new App();
    app.plugin(Outer, { msg: 'hello', instances: [{ msg: 'world' }] });
    await app.start();
    expect(app.bail('message1')).toBe('world');
    expect(app.bail('message2')).toBe('hello');
    expect(app.bail('message3')).toBe('world');
  });

  it('should work on common schemastery', async () => {
    const app = new App();
    app.plugin(Outer2, { msg: 'hello', instances: [{ msg: 'world' }] });
    await app.start();
    expect(app.bail('message1')).toBe('world');
    expect(app.bail('message2')).toBe('hello');
    expect(app.bail('message3')).toBe('world');
  });
});
