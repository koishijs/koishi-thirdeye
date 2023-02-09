import { Quester, Schema } from 'koishi';
import { CreatePluginFactory, SchemaProperty } from 'cordis-decorators';
import { StarterPlugin } from '../registrar';
import { Apply } from 'cordis-decorators/dist/src/decorators';

const questerConfigDict = { ...Quester.Config.dict };
delete questerConfigDict.endpoint;

export class HttpClientPluginConfig {
  @SchemaProperty({
    type: Schema.object(questerConfigDict),
    description: '请求设置',
    default: {},
  })
  http: Omit<Quester.Config, 'endpoint'>;
}

export class HttpClientPluginBase extends StarterPlugin(
  HttpClientPluginConfig,
) {
  http: Quester;

  @Apply()
  _initializeQuester() {
    this.http = this.ctx.http.extend(this.config.http || {});
  }
}

export const HttpClientPlugin = CreatePluginFactory(
  HttpClientPluginBase,
  HttpClientPluginConfig,
);
