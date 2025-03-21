interface Window {
  wx: any;
  VConsole: any;
  WeixinJSBridge: {
    invoke: (method: string, params: any, callback: (res: any) => void) => void;
  };
}
declare const wx: any;
declare const VConsole: any;
declare const WeixinJSBridge: {
  invoke: (method: string, params: any, callback: (res: any) => void) => void;
};
