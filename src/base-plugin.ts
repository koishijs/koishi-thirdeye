import { Context } from 'koishi';
import { InjectConfig } from './decorators';

export class BasePlugin<C> {
  constructor(protected ctx: Context, config: Partial<C>) {}

  @InjectConfig()
  protected config: C;
}
