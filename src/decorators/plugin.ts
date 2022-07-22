import { koishiRegistrar } from '../registrar';
import { ModelClassType, ModelRegistrar } from 'minato-decorators';
import { Flatten, Keys, Tables } from 'koishi';

export * from 'satori-decorators/dist/src/decorators/plugin';

export const { DefinePlugin } = koishiRegistrar.pluginDecorators();
export const UseModel = koishiRegistrar.decorateTopLevelAction(
  (ctx, obj, ...models: ModelClassType[]) => {
    const registrar = new ModelRegistrar(ctx.model);
    models.forEach((m) => registrar.registerModel(m));
  },
);

export const MixinModel = <K extends Keys<Tables>>(
  tableName: K,
  classDict: {
    [F in Keys<Tables[K]>]?: ModelClassType<Flatten<Tables[K][F]>>;
  },
): ClassDecorator =>
  koishiRegistrar.decorateTopLevelAction((ctx, obj) => {
    const registrar = new ModelRegistrar(ctx.model);
    registrar.mixinModel(tableName, classDict);
  })();

export const InjectLogger = (name?: string) =>
  koishiRegistrar
    .pluginDecorators()
    .InjectSystem((obj) => obj.__ctx.logger(name || obj.constructor.name));
