// metadatas
import { Context } from 'koishi';
import { Condition, ProvideDefinition, SystemInjectFun } from './interfaces';

export const KoishiServiceInjectSym = 'KoishiServiceInjectSym';
export const KoishiServiceInjectSymKeys = 'KoishiServiceInjectSymKeys';
export const KoishiServiceProvideSym = 'KoishiServiceProvideSym';
export const KoishiSystemInjectSym = 'KoishiSystemInjectSym';
export const KoishiSystemInjectSymKeys = 'KoishiSystemInjectSymKeys';
export const KoishiAddUsingList = 'KoishiAddUsingList';
export const KoishiPartialUsing = 'KoishiPartialUsing';

// metadata map

export interface MetadataArrayMap {
  KoishiServiceProvideSym: ProvideDefinition;
  KoishiServiceInjectSymKeys: string;
  KoishiSystemInjectSymKeys: string;
  KoishiAddUsingList: keyof Context.Services;
  KoishiPartialUsing: keyof Context.Services;
  KoishiIf: Condition<boolean>;
}

export interface MetadataMap {
  KoishiServiceInjectSym: keyof Context.Services;
  KoishiSystemInjectSym: SystemInjectFun;
}
