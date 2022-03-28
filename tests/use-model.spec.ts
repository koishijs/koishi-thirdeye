import {
  ChildModel,
  DefineModel,
  Foreign,
  ModelField,
  PrimaryGenerated,
  Unique,
} from 'koishi-entities';
import { UseModel } from '../src/decorators';
import { App } from 'koishi';
import { BasePlugin } from '../src/base-plugin';
import { DefinePlugin } from '../src/register';

declare module 'koishi' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface Tables {
    dress: Dress;
  }
}

class DressProperty {
  @ModelField('string(8)')
  color: string;
  @ModelField('integer(7)')
  size: string;

  getProperty() {
    return `${this.color} ${this.size}`;
  }
}

@DefineModel('dress')
class Dress {
  @PrimaryGenerated()
  @ModelField('integer(11)')
  id: number;

  @Unique()
  @ModelField()
  name: string; // test if it can infer type

  getName() {
    return this.name;
  }

  @ModelField('integer(11)')
  @Foreign('dress', 'id')
  parentId: number;

  @ChildModel()
  properties: DressProperty;
}

@UseModel(Dress)
@DefinePlugin()
class MyPlugin extends BasePlugin<any> {}

describe('Test of model', () => {
  it('should register model', async () => {
    const app = new App();
    app.plugin(MyPlugin);
    expect(app.model.config.dress.fields.name.type).toBe('string');
  });
});
