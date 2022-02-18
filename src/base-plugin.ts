import { Context } from 'koishi';
import { InjectConfig } from './decorators';

export class BasePlugin<C, PC = Partial<C>> {
  constructor(protected ctx: Context, config: PC) {}

  @InjectConfig()
  protected config: C;
}
