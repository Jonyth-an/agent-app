import axios, {
  Method,
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosProgressEvent
} from 'axios';
import { clearToken } from '@/web/support/user/auth';
import { TOKEN_ERROR_CODE } from '@fastgpt/global/common/error/errorCode';
import { TeamErrEnum } from '@fastgpt/global/common/error/code/team';
import { useSystemStore } from '../system/useSystemStore';
import { getWebReqUrl } from '@fastgpt/web/common/system/utils';
import { i18nT } from '@fastgpt/web/i18n/utils';
import { getNanoid } from '@fastgpt/global/common/string/tools';
import Cookies from 'js-cookie';

interface ConfigType {
  baseURL?: string;
  headers?: { [key: number | string]: any };
  timeout?: number;
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void;
  cancelToken?: AbortController;
  maxQuantity?: number; // The maximum number of simultaneous requests, usually used to cancel old requests
  withCredentials?: boolean;
}
interface ResponseDataType {
  code: number;
  message: string;
  data: any;
  param: any;
}

const maxQuantityMap: Record<
  string,
  | undefined
  | {
      id: string;
      sign: AbortController;
    }[]
> = {};

/* 
  Every request generates a unique sign
  If the number of requests exceeds maxQuantity, cancel the earliest request and initiate a new request
*/
function checkMaxQuantity({ url, maxQuantity }: { url: string; maxQuantity?: number }) {
  if (!maxQuantity) return {};
  const item = maxQuantityMap[url];
  const id = getNanoid();
  const sign = new AbortController();

  if (item && item.length > 0) {
    if (item.length >= maxQuantity) {
      const firstSign = item.shift();
      firstSign?.sign.abort();
    }
    item.push({ id, sign });
  } else {
    maxQuantityMap[url] = [{ id, sign }];
  }
  return {
    id,
    abortSignal: sign?.signal
  };
}

function requestFinish({ signId, url }: { signId?: string; url: string }) {
  const item = maxQuantityMap[url];
  if (item) {
    if (signId) {
      const index = item.findIndex((item) => item.id === signId);
      if (index !== -1) {
        item.splice(index, 1);
      }
    }
    if (item.length <= 0) {
      delete maxQuantityMap[url];
    }
  }
}

/**
 * 请求开始
 */
function startInterceptors(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  if (config.headers && config.headers.Authorization === undefined) {
    config.headers.Authorization = `Bearer ${Cookies.get('appKey')}`;
  }

  return config;
}

/**
 * 请求成功,检查请求头
 */
function responseSuccess(response: AxiosResponse<ResponseDataType>) {
  return response;
}
/**
 * 响应数据检查
 */
function checkRes(data: ResponseDataType) {
  // console.log('xxx checkRes->data', data);
  if (data === undefined) {
    console.log('error->', data, 'data is empty');
    return Promise.reject('服务器异常');
  } else if ((data.code !== 0 && data.code < 200) || (data.code !== 0 && data.code >= 400)) {
    return Promise.reject(data);
  }
  return data.data || data.param || data;
}

/**
 * 响应错误
 */
function responseError(err: any) {
  // console.log('error->', '请求错误', err);
  const data = err?.response?.data || err;

  if (!err) {
    return Promise.reject({ message: '未知错误' });
  }
  if (typeof err === 'string') {
    return Promise.reject({ message: err });
  }
  if (typeof data === 'string') {
    return Promise.reject(data);
  }

  // 有报错响应
  // if (data?.code in TOKEN_ERROR_CODE) {
  //   if (!['/chat/share', '/chat/team', '/login'].includes(window.location.pathname)) {
  //     clearToken();
  //     window.location.replace(
  //       getWebReqUrl(`/login?lastRoute=${encodeURIComponent(location.pathname + location.search)}`)
  //     );
  //   }

  //   return Promise.reject({ message: i18nT('common:unauth_token') });
  // }
  // if (
  //   data?.statusText === TeamErrEnum.aiPointsNotEnough ||
  //   data?.statusText === TeamErrEnum.datasetSizeNotEnough ||
  //   data?.statusText === TeamErrEnum.datasetAmountNotEnough ||
  //   data?.statusText === TeamErrEnum.appAmountNotEnough ||
  //   data?.statusText === TeamErrEnum.pluginAmountNotEnough ||
  //   data?.statusText === TeamErrEnum.websiteSyncNotEnough ||
  //   data?.statusText === TeamErrEnum.reRankNotEnough
  // ) {
  //   useSystemStore.getState().setNotSufficientModalType(data.statusText);
  //   return Promise.reject(data);
  // }
  return Promise.reject(data);
}
/* 创建请求实例 */
const instance = axios.create({
  timeout: 60000, // 超时时间
  headers: {
    'content-type': 'application/json'
    // Authorization: `Bearer ${Cookies.get('appKey')}`
    // Authorization: `Bearer fastgpt-ab1UGyTMpY9V8iDDWU7LUl8ldFUGC6Ji028gzYmlpjeMxwFxXadFn`
    // Authorization: `Bearer ${CHAT_API_KEY}`
    // Authorization: `Bearer ${process.env.CHAT_API_KEY}`
    // Authorization: 'Bearer fastgpt-crNagOolOA9OFRIBJAZ1a8u1qC3iJzgjljppGigs0dHXN0qTz9KMfeXJG'
  }
});

/* 请求拦截 */
instance.interceptors.request.use(startInterceptors, (err) => Promise.reject(err));
/* 响应拦截 */
instance.interceptors.response.use(responseSuccess, (err) => Promise.reject(err));

function request(
  url: string,
  data: any,
  { cancelToken, maxQuantity, withCredentials, ...config }: ConfigType,
  method: Method
): any {
  /* 去空 */
  for (const key in data) {
    if (data[key] === undefined) {
      delete data[key];
    }
  }

  const { id: signId, abortSignal } = checkMaxQuantity({ url, maxQuantity });

  return (
    instance
      .request({
        baseURL: getWebReqUrl('/api'),
        url,
        method,
        data: ['POST', 'PUT'].includes(method) ? data : undefined,
        params: !['POST', 'PUT'].includes(method) ? data : undefined,
        signal: cancelToken?.signal ?? abortSignal,
        withCredentials,
        ...config // 用户自定义配置，可以覆盖前面的配置
      })
      // @ts-ignore
      .then((res) => checkRes(res.data || res.param))
      .catch((err) => responseError(err))
      .finally(() => requestFinish({ signId, url }))
  );
}

/**
 * api请求方式
 * @param {String} url
 * @param {Any} params
 * @param {Object} config
 * @returns
 */
export function GET<T = undefined>(url: string, params = {}, config: ConfigType = {}): Promise<T> {
  return request(url, params, config, 'GET');
}

export function POST<T = undefined>(url: string, data = {}, config: ConfigType = {}): Promise<T> {
  return request(url, data, config, 'POST');
}

export function PUT<T = undefined>(url: string, data = {}, config: ConfigType = {}): Promise<T> {
  return request(url, data, config, 'PUT');
}

export function DELETE<T = undefined>(url: string, data = {}, config: ConfigType = {}): Promise<T> {
  return request(url, data, config, 'DELETE');
}

// curl --location --request POST 'http://localhost:3000/api/v1/chat/completions' \
// --header 'Authorization: Bearer fastgpt-mWM5YTWRJwaeQiywkTdw4mniZNxCob7fNcfQX7REKkRr0H5Lgu5rLtuKJSk24Up1K' \
// --header 'Content-Type: application/json' \
// --data-raw '{
//     "stream": false,
//     "detail": false,
//     appId: "6850d93d38169417d3e8a822",
//     chatId: "kFmmc5SCGz92YlkD7f624Bs",
//     "responseChatItemId": "jglsRJrVEbXKT09Bi1ojRi7q",

//     "messages": [
//         {
//             "role": "user",
//             "content": "资料包"
//         }
//     ]
// }'

// curl --location --request POST 'http://10.5.9.219:3000/api/v2/chat/completions' \
// --header 'Authorization: Bearer fastgpt-mWM5YTWRJwaeQiywkTdw4mniZNxCob7fNcfQX7REKkRr0H5Lgu5rLtuKJSk24Up1K' \
// --header 'Content-Type: application/json' \
// --data-raw '{
//     "chatId": "my_chatId",
//     "stream": false,
//     "detail": false,
//     "responseChatItemId": "my_responseChatItemId",
//     "variables": {
//         "uid": "asdfadsfasfd2323",
//         "name": "张三"
//     },
//     "messages": [
//         {
//             "role": "user",
//             "content": "资料包"
//         }
//     ]
// }'

// curl 'http://10.5.9.219:3000/api/v2/chat/completions' \
//   -H 'Referer: http://10.5.9.219:3000/chat?appId=6850d93d38169417d3e8a822' \
//   -H 'Authorization: Bearer fastgpt-mWM5YTWRJwaeQiywkTdw4mniZNxCob7fNcfQX7REKkRr0H5Lgu5rLtuKJSk24Up1K' \
//   -H 'User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1' \
//   -H 'accept: text/event-stream' \
//   -H 'Content-Type: application/json' \
//   --data-raw '{"messages":[{"dataId":"rEQ6ly7qle7b2d6woLXhCjuF","hideInUI":false,"role":"user","content":"资料包"}],"variables":{"cTime":"2025-06-18 16:25:01 Wednesday"},"responseChatItemId":"jglsRJrVEbXKT09Bi1ojRi7q","appId":"6850d93d38169417d3e8a822","chatId":"kFmmc5SCGz92YlkD7f624Bsm","detail":false,"stream":false}'

// curl 'http://10.5.9.219:3000/api/v2/chat/completions' \
//   -H 'Referer: http://10.5.9.219:3000/chat?appId=6850d93d38169417d3e8a822' \
//   -H 'Authorization: Bearer fastgpt-mWM5YTWRJwaeQiywkTdw4mniZNxCob7fNcfQX7REKkRr0H5Lgu5rLtuKJSk24Up1K' \
//   -H 'User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1' \
//   -H 'accept: text/event-stream' \
//   -H 'Content-Type: application/json' \
//   --data-raw '{"messages":[{"dataId":"rEQ6ly7qle7b2d6woLXhCjuF","hideInUI":false,"role":"user","content":"资料包"}],"variables":{"cTime":"2025-06-18 16:25:01 Wednesday"},"appId":"6850d93d38169417d3e8a822","detail":false,"stream":false}'
