interface Window {
  wx: {
    config: (config: {
      debug: boolean;
      appId: string;
      timestamp: string;
      nonceStr: string;
      signature: string;
      jsApiList: string[];
    }) => void;
    ready: (callback: () => void) => void;
    error: (callback: (res: any) => void) => void;
    updateAppMessageShareData: (config: {
      title: string;
      desc: string;
      link: string;
      imgUrl: string;
      success?: () => void;
    }) => void;
    updateTimelineShareData: (config: {
      title: string;
      link: string;
      imgUrl: string;
      success?: () => void;
    }) => void;
    // 添加小程序相关 API
    miniProgram: {
      getEnv: (callback: (res: { miniprogram: boolean }) => void) => void;
      navigateTo: (options: { url: string }) => void;
      postMessage: (data: any) => void;
      redirectTo: (options: { url: string }) => void;
      switchTab: (options: { url: string }) => void;
      reLaunch: (options: { url: string }) => void;
      navigateBack: (options?: { delta?: number }) => void;
    };
  };
  // 添加微信小程序环境检测属性
  __wxjs_environment?: 'miniprogram' | string;
  WeixinJSBridge?: {
    invoke: (method: string, params: any, callback: (res: any) => void) => void;
  };
}

// 声明全局变量
declare var wx: Window['wx'];
declare var WeixinJSBridge: Window['WeixinJSBridge'];
