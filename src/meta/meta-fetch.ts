import 'reflect-metadata';
import { Reflector } from 'typed-reflector';
import { MetadataArrayMap, MetadataMap } from '../def';

export const reflector = new Reflector<MetadataMap, MetadataArrayMap>();
