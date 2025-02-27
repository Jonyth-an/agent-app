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
  };
}
