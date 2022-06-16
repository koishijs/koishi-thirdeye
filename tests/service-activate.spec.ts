import { App, Context } from 'koishi';
import { DefinePlugin } from '../src/register';
import { Inject, Provide, UseEvent, UsingService } from '../src/decorators';
import { BasePlugin } from '../src/base-plugin';
import { ServiceName } from '../src/def';

declare module 'koishi' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Context {
    interface Services {
      myProvider: MyProvider;
      myEagerProvider: MyEagerProvider;
      myConsumer: MyConsumer;
      myUsingConsumer: MyUsingConsumer;
      myPartialConsumer: MyPartialConsumer;
      dummyProvider: any;
    }
  }

  interface EventMap {
    'pang'(message: string): Promise<string>;
    'pong'(message: string): Promise<string>;
  }
}

@Provide('myProvider')
@DefinePlugin()
class MyProvider extends BasePlugin<any> {
  ping() {
    return 'pong';
  }

  dispose() {
    return this.ctx.dispose();
  }
}

@Provide('myEagerProvider', { immediate: true })
@DefinePlugin()
class MyEagerProvider extends BasePlugin<any> {
  ping() {
    return 'pong eager';
  }

  dispose() {
    return this.ctx.dispose();
  }
}

@Provide('myConsumer', { immediate: true })
@DefinePlugin()
class MyConsumer {
  @Inject()
  myProvider: MyProvider;

  @Inject()
  myEagerProvider: MyEagerProvider;

  pongResult: string;

  eagerPongResult: string;

  @UseEvent('internal/service')
  async onService(name: ServiceName) {
    if (name === 'myProvider') {
      this.pongResult = this.myProvider.ping();
    } else if (name === 'myEagerProvider') {
      this.eagerPongResult = this.myEagerProvider.ping();
    }
  }
}

@Provide('myUsingConsumer', { immediate: true })
@DefinePlugin()
class MyUsingConsumer {
  @Inject(true)
  myProvider: MyProvider;

  @Inject(true)
  myEagerProvider: MyEagerProvider;

  pongResult: string;

  eagerPongResult: string;

  @UseEvent('internal/service')
  async onService(name: ServiceName) {
    if (name === 'myProvider') {
      this.pongResult = this.myProvider.ping();
    } else if (name === 'myEagerProvider') {
      this.eagerPongResult = this.myEagerProvider.ping();
    }
  }

  emitResult: string;
}

@Provide('myPartialConsumer', { immediate: true })
@DefinePlugin()
class MyPartialConsumer {
  @Inject()
  dummyProvider: number;

  pongResult: string;

  @UsingService('dummyProvider')
  @UseEvent('pang')
  async onPang(content: string) {
    const msg = `pang: ${content}`;
    console.log(msg);
    return msg;
  }

  @UseEvent('pong')
  async onPong(content: string) {
    const msg = `pong: ${content}`;
    console.log(msg);
    return msg;
  }
}

describe('On service', () => {
  let app: App;

  it('Should call service', async () => {
    app = new App();
    app.plugin(MyProvider);
    app.plugin(MyEagerProvider);
    app.plugin(MyConsumer);
    expect(app.myEagerProvider).toBeDefined();
    expect(app.myEagerProvider.ping()).toBe('pong eager');
    expect(app.myProvider).toBeUndefined();
    await app.start();
    expect(app.myConsumer).toBeDefined();
    expect(app.myProvider).toBeDefined();
    // expect(app.myConsumer.eagerPongResult).toBe('pong eager');
    expect(app.myConsumer.pongResult).toBe('pong');
  });

  it('Should call service with using', async () => {
    app = new App();
    app.plugin(MyUsingConsumer);
    expect(app.myUsingConsumer).toBeUndefined();
    app.plugin(MyProvider);
    expect(app.myUsingConsumer).toBeUndefined();
    app.plugin(MyEagerProvider);
    expect(app.myUsingConsumer).toBeUndefined();
    await app.start();
    expect(app.myUsingConsumer).toBeDefined();
    expect(app.myProvider).toBeDefined();
    expect(app.myProvider.ping()).toBe('pong');
    expect(app.myEagerProvider).toBeDefined();
    expect(app.myEagerProvider.ping()).toBe('pong eager');
    //expect(app.myUsingConsumer.eagerPongResult).toBe('pong eager');
    //expect(app.myUsingConsumer.pongResult).toBe('pong');
  });

  it('Should handle partial using deps', async () => {
    Context.service('dummyProvider');
    app = new App();
    await app.start();
    app.plugin(MyPartialConsumer);
    expect(app.myPartialConsumer).toBeDefined();
    expect(await app.waterfall('pang', 'hello')).toEqual('hello');
    expect(await app.waterfall('pong', 'hello')).toEqual('pong: hello');
    app.dummyProvider = { foo: 'bar' };
    expect(await app.waterfall('pang', 'hello')).toEqual('pang: hello');
    expect(await app.waterfall('pong', 'hello')).toEqual('pong: hello');
    app.dummyProvider = undefined;
    expect(await app.waterfall('pang', 'hi')).toEqual('hi');
    expect(await app.waterfall('pong', 'hi')).toEqual('pong: hi');
    app.dummyProvider = { foo: 'baz' };
    expect(await app.waterfall('pang', 'hi')).toEqual('pang: hi');
    expect(await app.waterfall('pong', 'hi')).toEqual('pong: hi');
  });
});
