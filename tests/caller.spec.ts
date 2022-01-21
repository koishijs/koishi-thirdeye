import { DefinePlugin } from '../src/register';
import { BasePlugin } from '../src/base-plugin';
import { Caller, Provide } from '../src/decorators';
import { App } from 'koishi';

declare module 'koishi' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Context {
    interface Services {
      callerTester: CallerTester;
    }
  }
}

@Provide('callerTester')
@DefinePlugin()
class CallerTester extends BasePlugin<any> {
  @Caller()
  caller: string;
}

describe('Caller', () => {
  let app: App;
  beforeEach(async () => {
    app = new App();
    app.plugin(CallerTester);
    await app.start();
  });

  it('should put caller with correct values', async () => {
    const ctx1 = app.any();
    const ctx2 = app.any();
    const caller1 = ctx1.callerTester.caller;
    const caller2 = ctx2.callerTester.caller;
    expect(caller1).toEqual(ctx1);
    expect(caller2).toEqual(ctx2);
    expect(app.callerTester.caller).toEqual(app);
  });
});
