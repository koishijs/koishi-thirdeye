import { reflector } from '../meta/meta-fetch';
import { DefinePlugin } from '../register';

export function getFork(obj: any) {
  const fork = reflector.get('KoishiFork', obj);
  if (!fork) {
    return;
  }
  return DefinePlugin()(fork);
}
