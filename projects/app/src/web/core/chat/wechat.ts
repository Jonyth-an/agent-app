import { getSignatureInfo } from './user';

interface ShareConfig {
  title: string;
  desc: string;
  link: string;
  imgUrl: string;
}

// 添加缓存机制
let signatureCache: {
  url: string;
  timestamp: number;
  data: any;
} | null = null;

export const initWechatShare = async (config: ShareConfig) => {
  try {
    if (typeof window === 'undefined' || !window.wx) {
      console.error('微信环境未加载');
      return;
    }

    // 获取完整的当前URL（包含查询参数）
    const curUrl = window.location.href.split('#')[0];
    console.log('当前URL:', curUrl); // 调试用

    // 检查缓存
    const now = Date.now();
    if (signatureCache && signatureCache.url === curUrl && now - signatureCache.timestamp < 60000) {
      console.log('使用缓存的签名数据:', signatureCache.data);
      await initWxConfig(signatureCache.data, config, curUrl);
      return;
    }

    // 获取新签名时进行 URL 编码
    const signatureData = await getSignatureInfo({
      url: encodeURIComponent(curUrl) // 确保 URL 正确编码
    });
    console.log('获取新的签名数据:', signatureData);

    if (!signatureData?.signature) {
      console.error('签名数据无效:', signatureData);
      return;
    }

    // 更新缓存
    signatureCache = {
      url: curUrl,
      timestamp: now,
      data: signatureData
    };

    await initWxConfig(signatureData, config, curUrl);
  } catch (err) {
    console.error('初始化微信分享失败:', err);
  }
};

// 分离配置逻辑
const initWxConfig = async (signatureData: any, config: ShareConfig, curUrl: string) => {
  try {
    // 打印完整的配置信息用于调试
    const wxConfig = {
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
    };
    console.log('微信配置参数:', wxConfig);

    window.wx.config(wxConfig);

    window.wx.ready(() => {
      const shareConfig = {
        title: config.title,
        desc: config.desc,
        link: config.link || curUrl,
        imgUrl: config.imgUrl,
        success: () => console.log('分享配置成功')
      };

      // 同时使用新旧接口
      window.wx.updateAppMessageShareData(shareConfig);
      window.wx.updateTimelineShareData(shareConfig);
    });

    window.wx.error((res: any) => {
      console.error('微信配置失败:', res);
      // 配置失败时清除缓存
      signatureCache = null;
    });
  } catch (err) {
    console.error('微信配置执行失败:', err);
    signatureCache = null;
  }
};
