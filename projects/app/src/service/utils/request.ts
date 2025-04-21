import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import FormData from 'form-data';
import { getLogger } from 'log4js';

export interface Res<T = any> {
  code: number;
  msg: string;
  data?: T;
  success?: boolean;
  timestamp?: number;
}

const logger = getLogger('utils/request.ts');
const baseURL = process.env.NEXT_PUBLIC_BASE_URL || '/share-agent';
console.log('ccc request baseURL', baseURL);
const service = axios.create({
  baseURL: '/',
  maxContentLength: Infinity,
  maxBodyLength: Infinity,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json;charset=UTF-8'
  }
});

// axios.defaults.transformRequest = function (data, headers) {
//   if (data === null || typeof data !== 'object') return data;
//   const conType = headers.post['Content-Type'] || headers['Content-Type'];
//   if (/urlencoded/i.test(conType)) data = qs.stringify(data);
//   return data;
// };

// Request interceptors
service.interceptors.request.use(
  // @ts-ignore
  (config: AxiosRequestConfig) => {
    const { url, method, baseURL, params, data } = config;
    logger.info(
      '>>>> 开始请求 请求信息 请求baseURL',
      baseURL,
      ',请求url',
      url,
      ',请求方式',
      method,
      ',请求baseURL',
      baseURL,
      ',请求params',
      params,
      ',请求data',
      data
    );
    return config;
  },
  (error) => {
    logger.error('>>>> 请求错误', error.message, '>>> url:', error.config.url);
    return Promise.reject(error);
  }
);

// 最大重试次数
const MAX_RETRIES = 5;
// 重试延迟时间（毫秒）
const RETRY_DELAY = 3000;

// Response interceptors
service.interceptors.response.use(
  (response: AxiosResponse<any>) => {
    logger.info('>>>> 响应 response', !!response);
    const resData = response.data;
    // const { code } = resData;
    // if (code !== 0) {

    //   //  return Promise.reject(new Error(resData.errorMsg || 'Error'))
    // }
    const { url } = response.config;
    logger.info('>>>> 响应成功 请求url', url, ',resData', resData);
    return resData;
  },
  async (error) => {
    const { config } = error;
    // 检查请求配置中的数据类型是否为 FormData
    if (error.config?.data && error.config.data instanceof FormData) {
      logger.info('>>>> 释放 FormData 内存', error.config.data);
      error.config.data = null; // 显式释放 FormData 占用的内存
    }
    if (!config) {
      logger.error('>>>> 响应错误 无法重试', error.message);

      return Promise.reject(error);
    }

    // 判断是否是超时错误
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      logger.error('>>>> 请求超时', '>>> url:', config.url);

      config.__retryCount = config.__retryCount || 0;

      if (config.__retryCount >= MAX_RETRIES) {
        logger.error('>>>> 响应错误 重试次数过多', error.message, '>>> url:', config.url);
        return Promise.reject(error);
      }

      config.__retryCount += 1;

      logger.error(
        `>>>> 响应错误 将在 ${RETRY_DELAY / 1000} 秒后重试 第 ${config.__retryCount} 次 >>> url:`,
        config.url
      );

      await new Promise<void>((resolve) => setTimeout(resolve, RETRY_DELAY));

      return service(config);
    }

    if (error.response) {
      logger.error('>>>> 响应错误', error.config.url, ':', error.response.data);
    } else {
      logger.info('>>>> 响应错误 none response:', error);
    }
    return Promise.reject(error);
  }
);

export default service;
