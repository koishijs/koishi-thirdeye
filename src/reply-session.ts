import {
  Channel,
  Element,
  Fragment,
  Next,
  PromptOptions,
  Random,
  segment,
  SendOptions,
  Session,
  User,
} from 'koishi';
import { Provide, DefinePlugin, UseMiddleware } from './decorators';
import { StarterPlugin } from './registrar';

interface Prompt {
  resolver: (value: string) => void;
  timeout: NodeJS.Timeout;
  session: ReplySession;
  callback: (session: ReplySession) => any;
}

declare module 'koishi' {
  interface Context {
    __prompt_resolver__: PromptResolver;
  }
}

export class ReplySession<
  U extends User.Field = never,
  G extends Channel.Field = never,
> extends Session<U, G> {
  replyMessages: Element[] = [];
  private midResolver: () => void;
  private emitPromise: Promise<any>;

  private midPromise = new Promise<void>((resolve) => {
    this.midResolver = resolve;
  });

  async process() {
    if (!this.app.lifecycle.isActive) return;
    const events: string[] = [this.type];
    if (this.subtype) {
      events.unshift(events[0] + '/' + this.subtype);
      if (this.subsubtype) {
        events.unshift(events[0] + '/' + this.subsubtype);
      }
    }
    this.emitPromise = Promise.all(
      events.map((event) => this.app.root.parallel(this, event as any, this)),
    );
    return this.waitForPattern();
  }

  async waitForPattern() {
    await Promise.race([
      this.emitPromise.then(() => this.midResolve(true)),
      this.midPromise,
    ]);
    return this.gatherReplyMessages();
  }

  getIdentifier() {
    return `${this.platform}:${this.selfId}:${this.channelId}:${this.userId}`;
  }

  midResolve(finish = false) {
    if (!this.midResolver) {
      return;
    }
    this.midResolver();
    if (finish) {
      delete this.midResolver;
    } else {
      this.midPromise = new Promise<void>((resolve) => {
        this.midResolver = resolve;
      });
    }
  }

  async send(content: Fragment, options: SendOptions = {}) {
    if (!content) return;
    options.session = this;
    const children = await this.transform(segment.normalize(content));
    this.replyMessages.push(
      children.length === 1 ? children[0] : segment('message', {}, children),
    );
    const messageId = Random.id();
    const sentSession = this.bot.session({
      messageId,
      userId: this.userId,
      timestamp: this.timestamp || Date.now(),
    });
    sentSession.app.emit(sentSession, 'send', sentSession);
    return [messageId];
  }

  gatherReplyMessages() {
    const result = this.replyMessages.filter((m) => !!m);
    this.replyMessages = [];
    return result;
  }

  prompt(...args: any[]) {
    if (!this.app.__prompt_resolver__) {
      this.app.root.plugin(PromptResolver);
    }
    const resolver = this.app.__prompt_resolver__;
    const callback: (session: Session) => any =
      typeof args[0] === 'function'
        ? args.shift()
        : (session) => session.content;
    const options: PromptOptions =
      typeof args[0] === 'number' ? { timeout: args[0] } : args[0] ?? {};
    const timeout = options.timeout ?? this.app.root.options.delay.prompt;
    const identifier = this.getIdentifier();
    const prom = new Promise<string>((resolve) => {
      const prompt: Prompt = {
        resolver: resolve,
        timeout: setTimeout(
          () => resolver.resolvePrompt(identifier, undefined),
          timeout,
        ),
        session: this,
        callback,
      };
      resolver.addPrompt(identifier, prompt);
    });
    this.midResolve();
    return prom;
  }
}

@Provide('__prompt_resolver__', { immediate: true })
@DefinePlugin()
class PromptResolver extends StarterPlugin() {
  prompts = new Map<string, Prompt>();

  addPrompt(identifier: string, prompt: Prompt) {
    const oldPrompt = this.prompts.get(identifier);
    if (oldPrompt) {
      this.resolvePrompt(identifier, undefined).then();
    }
    this.prompts.set(identifier, prompt);
  }

  @UseMiddleware(true)
  private async handlePrompt(session: ReplySession, next: Next) {
    if (!session.getIdentifier) {
      // not a reply session
      return next();
    }
    const identifier = session.getIdentifier();
    const prompt = await this.resolvePrompt(identifier, session);
    if (!prompt) {
      return next();
    }
    session.replyMessages.push(...(await prompt.session.waitForPattern()));
    return;
  }

  async resolvePrompt(identifier: string, session: ReplySession) {
    const prompt = this.prompts.get(identifier);
    if (prompt) {
      prompt.resolver(session ? await prompt.callback(session) : undefined);
      clearTimeout(prompt.timeout);
      this.prompts.delete(identifier);
      return prompt;
    }
    return;
  }
}
