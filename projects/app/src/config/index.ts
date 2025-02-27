const isDev = process.env.NODE_ENV === 'development';
export const share_h5_url = isDev
  ? 'https://aim-saas-share-dev.newtamp.cn'
  : 'https://aim-saas-share-dev.newtamp.cn';

export const fast_data_Url = isDev ? 'http://10.5.9.219:3000' : 'http://10.5.9.219:3000';
