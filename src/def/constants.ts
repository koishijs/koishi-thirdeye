// metadatas
import { Context } from 'koishi';
import {
  CommandDefinitionFun,
  DoRegisterConfig,
  OnContextFunction,
  ProvideDefinition,
  SystemInjectFun,
} from './interfaces';

export const KoishiOnContextScope = 'KoishiOnContextScope';
export const KoishiDoRegister = 'KoishiDoRegister';
export const KoishiDoRegisterKeys = 'KoishiDoRegisterKeys';
export const KoishiCommandDefinition = 'KoishiCommandDefinition';
export const KoishiCommandPutDef = 'KoishiCommandPutDef';

export const KoishiServiceInjectSym = 'KoishiServiceInjectSym';
export const KoishiServiceInjectSymKeys = 'KoishiServiceInjectSymKeys';
export const KoishiServiceProvideSym = 'KoishiServiceProvideSym';
export const KoishiSystemInjectSym = 'KoishiSystemInjectSym';
export const KoishiSystemInjectSymKeys = 'KoishiSystemInjectSymKeys';
export const KoishiAddUsingList = 'KoishiAddUsingList';
export const KoishiPartialUsing = 'KoishiPartialUsing';

// metadata map

export interface MetadataArrayMap {
  KoishiOnContextScope: OnContextFunction;
  KoishiCommandDefinition: CommandDefinitionFun;
  KoishiServiceProvideSym: ProvideDefinition;
  KoishiDoRegisterKeys: string;
  KoishiServiceInjectSymKeys: string;
  KoishiSystemInjectSymKeys: string;
  KoishiAddUsingList: keyof Context.Services;
  KoishiPartialUsing: keyof Context.Services;
}

export interface MetadataMap {
  KoishiDoRegister: DoRegisterConfig;
  KoishiServiceInjectSym: keyof Context.Services;
  KoishiSystemInjectSym: SystemInjectFun;
}
