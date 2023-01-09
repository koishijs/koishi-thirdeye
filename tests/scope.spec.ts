import { OnGuild, OnPlatform } from '../src/decorators';
import { App, Session } from 'koishi';
import { koishiRegistrar } from '../src/registrar';

@OnPlatform('discord')
class MyClass {
  @OnGuild('1111111111')
  foo() {}
}

describe('Scope', () => {
  let app: App;

  beforeEach(async () => {
    app = new App();
    await app.start();
  });

  it('should check scope', () => {
    const correctSession = {
      guildId: '1111111111',
      platform: 'discord',
    } as Session;

    const wrongSession1 = {
      guildId: '2222222222',
      platform: 'discord',
    } as Session;

    const wrongSession2 = {
      guildId: '1111111111',
      platform: 'telegram',
    } as Session;

    const registrar = koishiRegistrar.aspect(new MyClass());
    const globalCtx = registrar.getScopeContext(app);
    const methodCtx = registrar.getScopeContext(app, 'foo', {}, true);

    expect(globalCtx.filter(correctSession)).toBe(true);
    expect(globalCtx.filter(wrongSession1)).toBe(true);
    expect(globalCtx.filter(wrongSession2)).toBe(false);

    expect(methodCtx.filter(correctSession)).toBe(true);
    expect(methodCtx.filter(wrongSession1)).toBe(false);
    expect(methodCtx.filter(wrongSession2)).toBe(false);
  });
});
