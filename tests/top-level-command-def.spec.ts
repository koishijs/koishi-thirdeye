import { CommandExample, CommandUsage, UseCommand } from '../src/decorators';
import { BasePlugin } from '../src/base-plugin';
import { DefinePlugin } from '../src/register';
import { App, Command } from 'koishi';

@CommandUsage('乒乓球真好玩！') // 会适用于 ping 和 pang 两个指令
@DefinePlugin()
class MyPlugin extends BasePlugin<any> {
  @UseCommand('ping', 'Ping!')
  @CommandExample('枰！')
  onPing() {
    return 'pong';
  }

  @UseCommand('pang', 'Pang!')
  @CommandExample('乓！')
  onPang() {
    return 'peng';
  }
}

describe('Top level command def', () => {
  let app: App;
  let pingCommand: Command;
  let pangCommand: Command;
  beforeEach(() => {
    app = new App();
    app.plugin(MyPlugin);
    pingCommand = app.command('ping');
    pangCommand = app.command('pang');
  });

  it('Should check top level command def', () => {
    expect(pingCommand._usage).toBe('乒乓球真好玩！');
    expect(pangCommand._usage).toBe('乒乓球真好玩！');
  });

  it('Should check specific commmand def', () => {
    expect(pingCommand._examples[0]).toEqual('枰！');
    expect(pangCommand._examples[0]).toEqual('乓！');
  });
});
