import { Provide } from 'cordis-decorators/dist/src/decorators';
import { DefinePlugin } from '../src/decorators';
import { HttpClientPlugin } from '../src/plugin-operators';
import { App } from 'koishi';
import { RegisterSchema, SchemaProperty } from 'cordis-decorators';

@RegisterSchema()
class TestHttpPluginConfig {
  @SchemaProperty({ default: 'https://sapi.moecube.com:444/apps.json' })
  endpoint: string;
}

@Provide('testHttp', { immediate: true })
@DefinePlugin()
class TestHttpPlugin extends HttpClientPlugin(TestHttpPluginConfig) {
  req() {
    return this.http.get(this.config.endpoint);
  }
}

describe('register map plugin instance', () => {
  it('should make http ok', async () => {
    const app = new App();
    app.plugin(TestHttpPlugin, {
      http: {
        headers: {
          'User-Agent': 'test',
        },
      },
    });
    await app.start();
    expect(app['testHttp'].req()).resolves.toBeInstanceOf(Array);
  });
});
