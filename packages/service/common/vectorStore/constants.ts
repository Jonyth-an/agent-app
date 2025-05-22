import { getConfigValue } from '../crypto/decrypt';

export const DatasetVectorDbName = 'fastgpt';
export const DatasetVectorTableName = 'modeldata';
export const PG_ADDRESS = getConfigValue('PG_URL');
export const MILVUS_ADDRESS = process.env.MILVUS_ADDRESS;
export const MILVUS_TOKEN = process.env.MILVUS_TOKEN;
