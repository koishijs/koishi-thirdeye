// metadatas
import { Context, Schema } from 'koishi';
import {
  Condition,
  ControlType,
  ControlTypeMap,
  ProvideDefinition,
  SystemInjectFun,
} from './interfaces';
import { ClassType } from 'schemastery-gen';

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
  KoishiControl: ControlType;
}

export interface MetadataMap {
  KoishiServiceInjectSym: keyof Context.Services;
  KoishiSystemInjectSym: SystemInjectFun;
  KoishiPredefineSchema: Schema | ClassType<any>;
  KoishiPredefineName: string;
}

export const ThirdEyeSym = Symbol('ThirdEyeSym');
