import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { fast_data_Url } from '../../../../projects/app/src/config/index';

export const getUserFingerprint = async () => {
  const fp = await FingerprintJS.load();
  const result = await fp.get();
  console.log(result.visitorId);
};

export const hasHttps = () => {
  return window.location.protocol === 'https:';
};

export const subRoute = process.env.NEXT_PUBLIC_BASE_URL;

export const getWebReqUrl = (url: string = '') => {
  if (!url) return '/';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) return url;

  if (!url.startsWith('/') || url.startsWith(baseUrl)) return url;
  return `${baseUrl}${url}`;
};

// export const getWebReqUrl = (url: string = '') => {
//   const reqPath = queryWebReqUrl(url);
//   const hostUrl = fast_data_Url;
//   console.log('xxxx hostUrl, reqPath', hostUrl, reqPath);
//   return `${hostUrl}${reqPath}`;
// };
