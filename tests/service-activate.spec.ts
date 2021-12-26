import { App, Context } from 'koishi';
import { DefinePlugin } from '../src/register';
import { Inject, Provide, UseEvent } from '../src/decorators';

declare module 'koishi' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Context {
    interface Services {
      myProvider: MyProvider;
      myEagerProvider: MyEagerProvider;
      myConsumer: MyConsumer;
      myUsingConsumer: MyUsingConsumer;
    }
  }
}

@Provide('myProvider')
@DefinePlugin()
class MyProvider {
  ping() {
    return 'pong';
  }
}

@Provide('myEagerProvider', { immediate: true })
@DefinePlugin()
class MyEagerProvider {
  ping() {
    return 'pong eager';
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

  @UseEvent('service')
  async onService(name: keyof Context.Services) {
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

  @UseEvent('service')
  async onService(name: keyof Context.Services) {
    if (name === 'myProvider') {
      this.pongResult = this.myProvider.ping();
    } else if (name === 'myEagerProvider') {
      this.eagerPongResult = this.myEagerProvider.ping();
    }
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
});
