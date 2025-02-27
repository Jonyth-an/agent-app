import { useEffect } from 'react';

interface ShareConfig {
  title: string;
  desc: string;
  link: string;
  imgUrl: string;
}

export default function useWechatShare(config: ShareConfig) {
  useEffect(() => {
    if (typeof window === 'undefined' || !window.wx) return;

    const initShare = async () => {
      try {
        const signatureRes = await fetch(`/api/wechat/signature?url=${window.location.href}`);
        const signatureData = await signatureRes.json();

        window.wx.config({
          debug: false,
          appId: signatureData.appId,
          timestamp: signatureData.timestamp,
          nonceStr: signatureData.noncestr,
          signature: signatureData.signature,
          jsApiList: ['updateAppMessageShareData', 'updateTimelineShareData', 'onMenuShareWeibo']
        });

        window.wx.ready(() => {
          // 朋友/群分享
          window.wx.updateAppMessageShareData({
            title: config.title,
            desc: config.desc,
            link: config.link,
            imgUrl: config.imgUrl,
            success: () => console.log('分享配置成功')
          });

          // 朋友圈分享
          window.wx.updateTimelineShareData({
            title: config.title,
            link: config.link,
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

    initShare();
  }, [config]);
}
