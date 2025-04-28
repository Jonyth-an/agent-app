export function share_h5_url_front() {
  let url = '';
  if (process.env.NODE_ENV === 'development') {
    url = 'https://aim-saas-share-dev.newtamp.cn';
  } else {
    url = window.location.origin;
  }
  console.log('ccc share_h5_url_front', url);
  return url;
}

export function basePath() {
  let url = '';
  if (process.env.NODE_ENV === 'development') {
    url = '';
  } else {
    url = '/share-agent';
  }
  return url;
}
