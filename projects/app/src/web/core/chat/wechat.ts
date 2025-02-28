import { getSignatureInfo } from './user';

interface ShareConfig {
  title: string;
  desc: string;
  link: string;
  imgUrl: string;
}

export const initWechatShare = async (config: ShareConfig) => {
  try {
    if (typeof window === 'undefined' || !window.wx) {
      console.error('微信环境未加载');
      return;
    }

    const curUrl = window.location.href.split('#')[0];
    const signatureData = await getSignatureInfo({ url: curUrl });
    console.log('xxx getSignatureInfo signatureRes', signatureData);

    window.wx.config({
      debug: false,
      appId: signatureData.appId,
      timestamp: signatureData.timestamp,
      nonceStr: signatureData.nonce,
      signature: signatureData.signature,
      jsApiList: [
        'updateAppMessageShareData',
        'updateTimelineShareData',
        'onMenuShareAppMessage',
        'onMenuShareTimeline',
        'onMenuShareQQ'
      ]
    });

    window.wx.ready(() => {
      // 朋友/群分享
      window.wx.updateAppMessageShareData({
        title: config.title,
        desc: config.desc,
        link: config.link || curUrl,
        imgUrl: config.imgUrl,
        success: () => console.log('分享配置成功')
      });

      // 朋友圈分享
      window.wx.updateTimelineShareData({
        title: config.title,
        link: config.link || curUrl,
        imgUrl: config.imgUrl,
        success: () => console.log('朋友圈分享配置成功')
      });
    });

    window.wx.error((res: any) => {
      console.error('微信配置失败:', res);
    });
  } catch (err) {
    console.error('初始化微信分享失败:', err);
  }
};
