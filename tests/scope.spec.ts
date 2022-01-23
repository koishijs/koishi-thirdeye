import { App, Session } from 'koishi';
import { OnGuild, OnPlatform, Registrar, UseCommand } from 'koishi-decorators';
import { DefinePlugin } from '../src/register';

@OnPlatform('discord')
@DefinePlugin()
class MyClass {
  @OnGuild('1111111111')
  @UseCommand('foo')
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

    app.plugin(MyClass);
    const methodCtx = app.command('foo').context;

    expect(methodCtx.filter(correctSession)).toBe(true);
    expect(methodCtx.filter(wrongSession1)).toBe(false);
    expect(methodCtx.filter(wrongSession2)).toBe(false);
  });
});
