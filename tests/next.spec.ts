import { App } from 'koishi';

describe('Command next', () => {
  let app: App;

  beforeEach(() => {
    app = new App();
  });

  it('should response execute command', async () => {
    const cmd = app.command('test').action((argv) => 'foo');
    expect(await cmd.execute({})).toBe('foo');
  });

  it('should response execute command with args', async () => {
    const cmd = app.command('test').action((argv) => argv.args.join(' '));
    expect(await cmd.execute({ args: ['foo', 'bar'] })).toBe('foo bar');
  });

  it('should response execute command with two actions', async () => {
    const cmd = app
      .command('test')
      .action((argv) => 'foo')
      .action((argv) => 'bar');
    expect(await cmd.execute({})).toBe('foo');
  });
  it('should response execute command with two actions and next', async () => {
    const cmd = app
      .command('test')
      .action((argv) => argv.next())
      .action((argv) => 'bar');
    expect(await cmd.execute({})).toBe('bar');
  });

  it('should response execute command with two actions and next mutation', async () => {
    let ret: void | string;
    const cmd = app
      .command('test')
      .action(async (argv) => {
        ret = await argv.next();
        return `foo ${ret}`;
      })
      .action((argv) => 'bar');
    expect(await cmd.execute({})).toBe('foo bar');
    expect(ret).toBe('bar');
  });
});
