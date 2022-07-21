import {
  CommandExample,
  CommandUsage,
  DefinePlugin,
  PutArg,
  PutObject,
  PutOption,
  UseCommand,
} from '../src/decorators';
import { App, Command } from 'koishi';
import { StarterPlugin } from '../src/registrar';

class Sound {
  @PutArg(0)
  sound: string;

  @PutOption('volume', '-v <volume>')
  volume: number;

  getMessage() {
    return `${this.sound} in ${this.volume}`;
  }
}

@CommandUsage('乒乓球真好玩！') // 会适用于 ping 和 pang 两个指令
@DefinePlugin()
class MyPlugin extends StarterPlugin() {
  @UseCommand('ping', 'Ping!')
  @CommandExample('枰！')
  onPing(@PutOption('sound', '-s <sound>') sound: string) {
    return `pong ${sound}`;
  }

  @UseCommand('pang', 'Pang!')
  @CommandExample('乓！')
  onPang(@PutArg(0) sound: string) {
    return `pong ${sound}`;
  }

  @UseCommand('peng', 'Peng!')
  onPeng(@PutObject() sound: Sound) {
    return sound.getMessage();
  }
}

describe('Command', () => {
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

  it('Should infer option types', () => {
    expect(pingCommand._options.sound.type).toEqual('string');
    expect(pangCommand._arguments[0].type).toEqual('string');
  });

  it('should call command', async () => {
    expect(await pingCommand.execute({ options: { sound: '枰' } })).toBe(
      'pong 枰',
    );
    expect(await pangCommand.execute({ args: ['乓'] })).toBe('pong 乓');
  });

  it('should resolve put object', async () => {
    const pengCommand = app.command('peng');
    expect(pengCommand._options.volume.type).toBe('number');
    expect(
      await pengCommand.execute({
        args: ['吵死了！'],
        options: { volume: 20 },
      }),
    ).toBe('吵死了！ in 20');
  });
});
