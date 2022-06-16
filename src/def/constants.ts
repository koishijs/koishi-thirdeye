// metadatas
import { Schema } from 'koishi';
import {
  ControlType,
  PluginClass,
  ProvideDefinition,
  ServiceName,
  SystemInjectFun,
} from './interfaces';
import { ClassType } from 'schemastery-gen';

export const KoishiServiceInjectSym = 'KoishiServiceInjectSym';
export const KoishiServiceInjectSymKeys = 'KoishiServiceInjectSymKeys';
export const KoishiServiceProvideSym = 'KoishiServiceProvideSym';
export const KoishiSystemInjectSym = 'KoishiSystemInjectSym';
export const KoishiSystemInjectSymKeys = 'KoishiSystemInjectSymKeys';
export const KoishiAddUsingList = 'KoishiAddUsingList';

// metadata map

export interface MetadataArrayMap {
  KoishiServiceProvideSym: ProvideDefinition;
  KoishiServiceInjectSymKeys: string;
  KoishiSystemInjectSymKeys: string;
  KoishiAddUsingList: ServiceName;
  KoishiControl: ControlType;
}

export interface MetadataMap {
  KoishiServiceInjectSym: ServiceName;
  KoishiSystemInjectSym: SystemInjectFun;
  KoishiPredefineSchema: Schema | ClassType<any>;
  KoishiPredefineName: string;
  KoishiFork: PluginClass;
}

export const ThirdEyeSym = Symbol('ThirdEyeSym');
