import { getSignatureInfo } from '@/web/core/chat/user';
import { useEffect, useRef } from 'react';

interface ShareConfig {
  title: string;
  desc: string;
  link: string;
  imgUrl: string;
}

export default function useWechatShare(config: ShareConfig) {
  const lastUrlRef = useRef('');

  useEffect(() => {
    if (typeof window === 'undefined' || !window.wx) return;

    const curUrl = window.location.href;
    // 只在 URL 变化时重新获取签名
    if (lastUrlRef.current === curUrl) {
      // URL 未变化，只更新分享内容
      window.wx.ready(() => {
        window.wx.updateAppMessageShareData({ ...config });
        window.wx.updateTimelineShareData({ ...config });
      });
      return;
    }

    lastUrlRef.current = curUrl;
    const initShare = async () => {
      try {
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
