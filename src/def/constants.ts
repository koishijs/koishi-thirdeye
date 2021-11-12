// metadatas
import { Context } from 'koishi';
import {
  CommandDefinitionFun,
  DoRegisterConfig,
  OnContextFunction,
} from './interfaces';
import { PluginClass } from '../register';

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

// metadata map

export interface MetadataArrayMap {
  KoishiOnContextScope: OnContextFunction;
  KoishiCommandDefinition: CommandDefinitionFun;
  KoishiServiceProvideSym: keyof Context.Services;
  KoishiDoRegisterKeys: string;
  KoishiServiceInjectSymKeys: string;
  KoishiSystemInjectSymKeys: string;
}

export interface MetadataMap {
  KoishiDoRegister: DoRegisterConfig;
  KoishiServiceInjectSym: keyof Context.Services;
  KoishiSystemInjectSym: (obj: PluginClass) => any;
}
