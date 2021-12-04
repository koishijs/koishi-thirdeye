# koishi-thirdeye

装饰器形式的 [Koishi](https://koishi.js.org/v4) 插件开发框架。

## 安装

```shell
npm install koishi-thirdeye koishi@next
```

## 快速入门

可以简单定义类以快速开发 Koishi 插件。

```ts
import { KoishiPlugin, DefineSchema, CommandUsage, PutOption, UseCommand, OnApply } from 'koishi-thirdeye'

export class MyPluginConfig {
  @DefineSchema({ default: 'bar' })
  foo: string;
}

@KoishiPlugin({ name: 'my-plugin', schema: MyPluginConfig })
export default class MyPlugin implements OnApply {
  constructor(private ctx: Context, private config: Partial<MyPluginConfig>) {
  }

  onApply() {
    // 该方法会在插件加载时调用，用于在上下文中注册事件等操作。
  }

  @UseCommand('echo', '命令描述')
  @CommandUsage('命令说明')
  onEcho(@PutOption('content', '-c <content:string>  命令参数') content: string) {
    return content;
  }
}
```

## 使用

使用 koishi-thirdeye 编写的插件，需要在插件类上使用 `@KoishiPlugin(options: KoishiPluginRegistrationOptions)` 装饰器。

您可以在参数中指定该插件的基本信息。

* `name` 插件名称。

* `schema` 插件的配置描述模式。可以是 Schema 描述模式，也可以是由 `schemastery-gen` 生成的 Schema 类。

koishi-thirdeye 内建了 `schemastery-gen` 的支持。只需要导入这1个包即可。另外，系统会自动进行 `@RegisterSchema` 的配置描述的注册。

## API

### 注入

您可以在类成员变量中，使用下列装饰器进行注入成员变量。 **注入的变量在构造函数中无效。** 请在 `onApply` 等生命周期钩子函数中调用。

* `@InjectContext(select?: Selection)` 注入上下文对象。 **注入的上下文对象会受全局选择器影响。**

* `@InjectApp()` 注入 Koishi 实例对象。

* `@InjectLogger(name: string)` 注入 Koishi 日志记录器。

### 声明周期钩子

下列方法是一些生命周期方法。这些方法会在插件特定生命周期中调用，便于注册方法等操作。

要声明钩子，让插件类实现对应的接口，并添加对应的方法即可。

```ts
// 在插件加载时调用
export interface OnApply {
  onApply(): void | Promise<void>;
}

// 在 Koishi 实例启动完毕时调用
export interface OnConnect {
  onConnect(): void | Promise<void>;
}

// 在插件卸载或 Koishi 实例关闭时调用
export interface OnDisconnect {
  onDisconnect(): void | Promise<void>;
}
```

### 选择器

选择器装饰器可以注册在插件类顶部，也可以注册在插件方法函数。

插件类顶部定义的上下文选择器是全局的，会影响使用 `@Inject` 或 `@InjectContext` 注入的任何上下文对象，以及构造函数中传入的上下文对象。

选择器的使用请参照 [Koishi 文档](https://koishi.js.org/v4/guide/plugin/context.html#%E4%BD%BF%E7%94%A8%E9%80%89%E6%8B%A9%E5%99%A8) 。

* `@OnUser(value)` 等价于 `ctx.user(value)`。

* `@OnSelf(value)` 等价于 `ctx.self(value)`。

* `@OnGuild(value)` 等价于 `ctx.guild(value)`。

* `@OnChannel(value)` 等价于 `ctx.channel(value)`。

* `@OnPlatform(value)` 等价于 `ctx.platform(value)`。

* `@OnPrivate(value)` 等价于 `ctx.private(value)`。

* `@OnSelection(value)` 等价于 `ctx.select(value)`。

* `@OnContext((ctx: Context) => Context)` 手动指定上下文选择器，用于不支持的选择器。例如，

```ts
@OnContext(ctx => ctx.platform('onebot'))
```

### 注册方法

* `@UseMiddleware(prepend?: boolean)` 注册中间件，等价于 `ctx.middleware((session, next) => { }, prepend)`。[参考](https://koishi.js.org/v4/guide/message/message.html#%E6%B3%A8%E5%86%8C%E5%92%8C%E5%8F%96%E6%B6%88%E4%B8%AD%E9%97%B4%E4%BB%B6)

* `@UseEvent(name: EventName, prepend?: boolean)` 注册事件监听器。等价于 `ctx.on(name, (session) => { }, prepend)`。[参考](https://koishi.js.org/v4/guide/plugin/lifecycle.html#%E4%BA%8B%E4%BB%B6%E7%B3%BB%E7%BB%9F)

* `@UsePlugin()` 使用该方法注册插件。在 Koishi 实例注册时该方法会自动被调用。该方法需要返回插件定义，可以使用 `PluginDef(plugin, options, select)` 方法生成。 [参考](https://koishi.js.org/v4/guide/plugin/plugin.html#%E5%AE%89%E8%A3%85%E6%8F%92%E4%BB%B6)

* `@UseCommand(def: string, desc?: string, config?: Command.Config)` 注册指令。指令系统可以参考 [Koishi 文档](https://koishi.js.org/guide/command.html) 。指令回调参数位置和类型和 Koishi 指令一致。

### 指令描述装饰器

koishi-thirdeye 使用一组装饰器进行描述指令的行为。这些装饰器需要和 `@UseCommand(def)` 一起使用。

* `@CommandDescription(text: string)` 指令描述。等价于 `ctx.command(def, desc)` 中的描述。

* `@CommandUsage(text: string)` 指令介绍。等价于 `cmd.usage(text)`。

* `@CommandExample(text: string)` 指令示例。等价于 `cmd.example(text)`。

* `@CommandAlias(def: string)` 指令别名。等价于 `cmd.alias(def)`。

* `@CommandShortcut(def: string, config?: Command.Shortcut)` 指令快捷方式。等价于 `cmd.shortcut(def, config)`。

* `@CommandDef((cmd: Command) => Command)` 手动定义指令信息，用于不支持的指令类型。

### 指令参数

指令参数也使用一组装饰器对指令参数进行注入。下列装饰器应对由 `@UseCommand` 配置的类成员方法参数进行操作。

* `@PutArgv()` 注入 `Argv` 对象。

* `@PutSession(field?: keyof Session)` 注入 `Session` 对象，或 `Session` 对象的指定字段。

* `@PutArg(index: number)` 注入指令的第 n 个参数。

* `@PutOption(name: string, desc: string, config: Argv.OptionConfig = {})` 给指令添加选项并注入到该参数。等价于 `cmd.option(name, desc, config)` 。

* `@PutUser(fields: string[])` 添加一部分字段用于观测，并将 User 对象注入到该参数。

* `@PutChannel(fields: string[])` 添加一部分字段用于观测，并将 Channel 对象注入到该参数。

关于 Koishi 的观察者概念详见 [Koishi 文档](https://koishi.js.org/v4/guide/database/observer.html#%E8%A7%82%E5%AF%9F%E8%80%85%E5%AF%B9%E8%B1%A1) 。

* `@PutUserName(useDatabase: boolean = true)` 注入当前用户的用户名。
  * `useDatabase` 是否尝试从数据库获取用户名。

### 上下文 Service 交互

您可以使用装饰器与 Koishi 的 Service 系统进行交互。

#### 注入上下文 Service

注入的 Service 通常来自其他 Koishi 插件。

```ts
import { Inject, UseEvent } from 'koishi-thirdeye';
import { Cache } from 'koishi';

@KoishiPlugin({ name: 'my-plugin' })
export class MyPlugin {
  constructor(private ctx: Context, private config: any) {
  }

  // 注入 Service
  @Inject('cache')
  private cache2: Cache;

  // 成员变量名与 Service 名称一致时 name 可省略。
  @Inject()
  private cache: Cache;
  
  // 成员类型是 Context 会自动注入 Koishi 上下文，等效于 `@InjectContext()` 。
  @Inject()
  private anotherCtx: Context;


  @UseEvent('service/cache')
  async onCacheAvailable() {
    // 建议监听 Service 事件
    const user = this.cache.get('user', '111111112');
  }
}
```

#### 提供上下文 Service

您也可以直接使用 `@Provide` 方法进行 Koishi 的 Service 提供，供其他插件使用。

```ts
import { Provide } from 'koishi-thirdeye';

// 需要定义 Service 类型
declare module 'koishi' {
  namespace Context {
    interface Services {
      myService: MyDatabasePlugin;
    }
  }
}


// `@Provide(name)` 装饰器会自动完成 `Context.service(name)` 的声明操作
@Provide('myService')
@KoishiPlugin({ name: 'my-database' })
export class MyDatabasePlugin {
  // 该类会作为 Koishi 的 Service 供其他 Koishi 插件进行引用
}
```

#### 定义

* `@Inject(name?: string, addUsing?: boolean)` 在插件类某一属性注入特定上下文 Service 。 `name` 若为空则默认为类方法名。

`addUsing` 若为 `true` 则会为插件注册的 Service 。

特别的，为了编写简便，如果成员类型也是 Context 则会注入 Koishi 上下文，等效于 `@InjectContext()` 。

* `@Provide(name: string, options?: ProvideOptions)` 使用该插件提供 Service 。会自动完成 Koishi 的 `Context.service(name)` 声明操作。
  * `immediate` 会在插件加载阶段瞬间完成 Service 注册。

