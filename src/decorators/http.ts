import { koishiRegistrar } from '../registrar';

const { RouterMethod } = koishiRegistrar.methodDecorators();

export const Get = (path: string) => RouterMethod('get', path);
export const Post = (path: string) => RouterMethod('post', path);
export const Put = (path: string) => RouterMethod('put', path);
export const Delete = (path: string) => RouterMethod('delete', path);
export const Patch = (path: string) => RouterMethod('patch', path);
export const Options = (path: string) => RouterMethod('options', path);
export const Head = (path: string) => RouterMethod('head', path);
export const All = (path: string) => RouterMethod('all', path);
