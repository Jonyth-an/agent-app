const isDev = process.env.NODE_ENV === 'development';
export const loginUrl = isDev
  ? 'https://aim-saas-share-dev.newtamp.cn/share/advIndex'
  : 'https://aim-saas-share-dev.newtamp.cn/share/advIndex';

export const fast_data_Url = isDev ? 'http://10.5.9.219:3000' : 'http://10.5.9.219:3000';
