const isDev = process.env.NODE_ENV === 'development';
export const loginUrl = isDev
  ? 'https://aim-saas-share-dev.newtamp.cn/share/advIndex'
  : 'https://aim-saas-share-dev.newtamp.cn/share/advIndex';
