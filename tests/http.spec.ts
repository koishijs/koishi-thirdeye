import { App } from 'koishi';
import { KoishiPlugin } from '../src/register';
import { Get } from '../src/decorators';
import { KoaContext } from '../src/def';
import request from 'supertest';

@KoishiPlugin()
class MyPlugin {
  @Get('ping')
  async ping(ctx: KoaContext) {
    ctx.status = 233;
    ctx.body = 'pong';
  }
}

describe('Http Routes', () => {
  let app: App;
  beforeEach(() => {
    app = new App();
  });

  it('should be able to get a route', async () => {
    app.plugin(MyPlugin);
    await app.start();
    return request(app._httpServer).get('/ping').expect(233).expect('pong');
  });
});
