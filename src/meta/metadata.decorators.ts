import 'reflect-metadata';
import { MetadataSetter } from 'typed-reflector';
import { MetadataArrayMap, MetadataMap } from '../def';

export const Metadata = new MetadataSetter<MetadataMap, MetadataArrayMap>();
