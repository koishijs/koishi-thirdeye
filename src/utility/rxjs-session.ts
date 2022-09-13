import { Awaitable, Session, segment } from 'koishi';
import { isObservable, Observable } from 'rxjs';

export type CanBeObserved<T> = Awaitable<T | Observable<T>>;

export async function sessionRxToPromise(
  session: Session,
  obs: CanBeObserved<string | void | segment>,
) {
  const obsAwaited = await obs;
  if (!isObservable(obsAwaited)) {
    return obsAwaited;
  }
  return new Promise<string>((resolve, reject) => {
    let lastValue: string;
    obsAwaited.subscribe({
      next: async (value) => {
        if (lastValue && session.send) {
          await session.send(lastValue);
        }
        lastValue = value as string;
      },
      error: async (error) => {
        if (lastValue && session.send) {
          await session.send(lastValue);
        }
        reject(error);
      },
      complete: () => {
        resolve(lastValue);
      },
    });
  });
}
