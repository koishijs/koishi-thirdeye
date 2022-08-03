import { RegisterMeta, SatoriRegistrar } from 'satori-decorators';
import { BeforeEventMap, Command, Context, I18n, Next, Session } from 'koishi';
import { CanBeObserved, sessionRxToPromise } from './utility/rxjs-session';
import {
  CommandConfigExtended,
  CommandPut,
  CommandPutPre,
  CommandReturnType,
  CommandTransformer,
} from './def';

type PutMeta = RegisterMeta<CommandPut, { pre?: RegisterMeta<CommandPutPre> }>;

declare module 'satori-decorators' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Registrar {
    interface MetadataMap {
      KoishiCommandPutObject: PutMeta;
    }
    interface MetadataArrayMap {
      KoishiCommandTransformer: RegisterMeta<CommandTransformer>;
      KoishiCommandPut: PutMeta;
      KoishiCommandPutObjectKeys: string;
    }
  }
}

export class KoishiRegistrar extends SatoriRegistrar<Context> {
  decorateCommandTransformer<A extends any[]>(
    transformer: CommandTransformer<A>,
  ) {
    return (...args: A): ClassDecorator & MethodDecorator =>
      this.metadata.append(
        'KoishiCommandTransformer',
        new RegisterMeta(transformer, args),
      );
  }

  decorateCommandPut<A extends any[]>(
    put: CommandPut<A>,
    pre?: CommandPutPre<A>,
  ) {
    return (...args: A): ParameterDecorator & PropertyDecorator =>
      (obj, key, i?) => {
        const meta = new RegisterMeta(put, args, {
          pre: pre && new RegisterMeta(pre, args),
        });
        if (typeof i === 'number') {
          this.metadata.param('KoishiCommandPut', meta)(obj, key, i);
        } else {
          this.metadata.set(
            'KoishiCommandPutObject',
            meta,
            'KoishiCommandPutObjectKeys',
          )(obj, key, i);
        }
      };
  }

  override methodDecorators() {
    return {
      ...super.methodDecorators(),
      UseMiddleware: this.decorateMethod(
        'middleware',
        (
          { ctx },
          fun: (session: Session, next: Next) => CommandReturnType,
          prepend?: boolean,
        ) =>
          ctx.middleware(
            (s, next) => sessionRxToPromise(s, fun(s, next)),
            prepend,
          ),
      ),
      UseBeforeEvent: this.decorateMethod(
        'before',
        (
          { ctx },
          fun: BeforeEventMap[keyof BeforeEventMap],
          event: keyof BeforeEventMap,
          append?: boolean,
        ) => ctx.before(event, fun, append),
      ),
      UseCommand: this.decorateMethod(
        'command',
        (
          info,
          fun: (...args: any[]) => CommandReturnType,
          ...args:
            | [string, CommandConfigExtended?]
            | [string, string, CommandConfigExtended?]
        ) => {
          const { ctx, view, obj, key } = info;
          const def = args.shift() as string;
          const desc =
            typeof args[0] === 'string' ? (args.shift() as string) : '';
          const config = args[0] as CommandConfigExtended;
          const transformers = this.reflector.getProperty(
            'KoishiCommandTransformer',
            obj,
            key,
          );
          let command: Command = ctx.command(def, desc, config);
          for (const transformer of transformers) {
            command = transformer.run(view, ctx, command) || command;
          }
          if (config?.empty) {
            return command;
          }
          // eslint-disable-next-line @typescript-eslint/ban-types
          const paramTypes: Function[] = Reflect.getMetadata(
            'design:paramtypes',
            obj,
            key,
          );
          const putOptions = this.reflector.getArray(
            'KoishiCommandPut',
            obj,
            key,
          );
          for (let i = 0; i < putOptions.length; i++) {
            const prePutOption = putOptions[i]?.info?.pre;
            if (!prePutOption) {
              continue;
            }
            const nativeType = paramTypes[i];
            prePutOption.run(view, { ctx, command, nativeType, view });
          }
          command.action(async (argv, ...args) => {
            const params = putOptions.map((option, i) =>
              option?.run(view, {
                ctx,
                command,
                nativeType: paramTypes[i],
                argv,
                args,
                view,
              }),
            );
            return sessionRxToPromise(
              argv.session,
              fun(...params) as CanBeObserved<string>,
            );
          });
          return command;
        },
      ),
      UseFormatter: this.decorateMethod(
        'formatter',
        ({ ctx }, fun: I18n.Formatter, name: string) => {
          ctx.i18n.formatter(name, fun);
          ctx.on('dispose', () => {
            delete ctx.i18n._formatters[name];
          });
        },
      ),
      UsePreset: this.decorateMethod(
        'preset',
        ({ ctx }, fun: I18n.Renderer, name: string) => {
          ctx.i18n.preset(name, fun);
          ctx.on('dispose', () => {
            delete ctx.i18n._presets[fun.name];
          });
        },
      ),
      UseInterval: this.decorateMethod(
        'interval',
        ({ ctx }, fun: (...args: any[]) => any, interval: number) =>
          ctx.setInterval(fun, interval),
      ),
    };
  }
}

export const koishiRegistrar = new KoishiRegistrar(Context);
export const StarterPlugin = koishiRegistrar.starterPluginFactory();
