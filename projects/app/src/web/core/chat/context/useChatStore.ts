import { create } from 'zustand';
import Cookies from 'js-cookie';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { getNanoid } from '@fastgpt/global/common/string/tools';
import { OutLinkChatAuthProps } from '@fastgpt/global/support/permission/chat';
import { ChatSourceEnum, RunPlatformEnum } from '@fastgpt/global/core/chat/constants';
import { agentConfigInfo, WechatUserInfo, StaffInfo } from '@/global/core/user/api';
import { ChatStatusType } from '../../app/constants';

// 定义状态类型，描述store中管理的状态和更新状态的方法
type State = {
  runPlatform: `${RunPlatformEnum}`;
  setRunPlatform: (runPlatform: RunPlatformEnum) => void;

  serverEnableGenImg: boolean; // server是否支持生成图片
  setServerEnableGenImg: (enable: boolean) => void;

  shareToken: string; // 存储token
  setShareToken: (token: string) => void;

  token: string; // 存储token
  setToken: (token: string) => void;

  source?: `${ChatSourceEnum}`; // 聊天来源
  setSource: (e: `${ChatSourceEnum}`) => any; // 设置聊天来源的方法

  appId: string; // 应用ID
  setAppId: (e: string) => any; // 设置应用ID的方法
  lastChatAppId: string; // 上一次聊天的应用ID
  setLastChatAppId: (e: string) => any; // 设置上一次聊天应用ID的方法

  lastChatId: string; // 上一次聊天ID
  chatId: string; // 当前聊天ID
  setChatId: (e?: string) => any; // 设置聊天ID的方法

  outLinkAuthData: OutLinkChatAuthProps; // 外部链接认证数据
  setOutLinkAuthData: (e: OutLinkChatAuthProps) => any; // 设置外部链接认证数据的方法

  chatStauts: string; // 是否可以聊天,
  setChatStauts: (e: string) => any;

  agentConfigInfo: agentConfigInfo; // 存储代理配置
  setAgentConfigInfo: (config: agentConfigInfo) => void; // 更新代理配置的方法

  staffInfo: StaffInfo; // 存储员工信息
  setStaffInfo: (info: any) => void; // 更新员工信息的方法

  openid: string; // 存储openid
  unionid: string; // 存储unionid
  wechatInfoId: string;
  nickname: string;
  sex: number;
  setWechatInfoIds: (info: any) => void; // 更新员工信息的方法
};

// 自定义存储机制，结合sessionStorage和localStorage
const createCustomStorage = () => {
  const sessionKeys = ['source', 'chatId', 'appId']; // 指定存储在sessionStorage中的键

  return {
    // 获取存储项
    getItem: (name: string) => {
      const sessionData = JSON.parse(sessionStorage.getItem(name) || '{}'); // 从sessionStorage获取数据
      const localData = JSON.parse(localStorage.getItem(name) || '{}'); // 从localStorage获取数据
      return JSON.stringify({ ...localData, ...sessionData }); // 合并数据
    },
    // 设置存储项
    setItem: (name: string, value: string) => {
      const data = JSON.parse(value);

      // 分离 session 和 local 数据
      const sessionData = Object.fromEntries(
        Object.entries(data.state).filter(([key]) => sessionKeys.includes(key))
      );
      const localData = Object.fromEntries(
        Object.entries(data.state).filter(([key]) => !sessionKeys.includes(key))
      );

      // 分别存储
      if (Object.keys(sessionData).length > 0) {
        sessionStorage.setItem(name, JSON.stringify({ state: sessionData, version: 0 }));
      }
      if (Object.keys(localData).length > 0) {
        localStorage.setItem(name, JSON.stringify({ state: localData, version: 0 }));
      }
    },
    // 移除存储项
    removeItem: (name: string) => {
      sessionStorage.removeItem(name);
      localStorage.removeItem(name);
    }
  };
};

/* 
  appId chatId source 存在当前 tab 中，刷新浏览器不会丢失。
  lastChatId 和 lastChatAppId 全局存储，切换 tab 或浏览器也不会丢失。用于首次 tab 进入对话时，恢复上一次的 chat。(只恢复相同来源的)
*/
export const useChatStore = create<State>()(
  devtools(
    // 使用devtools中间件进行调试
    persist(
      // 使用persist中间件进行持久化存储
      immer((set, get) => ({
        serverEnableGenImg: false,
        setServerEnableGenImg: (enable: boolean) => {
          set((state) => {
            state.serverEnableGenImg = enable;
          });
        },
        runPlatform: RunPlatformEnum.INIT,
        setRunPlatform(runPlatform: RunPlatformEnum) {
          set((state) => {
            state.runPlatform = runPlatform;
          });
        },
        openid: Cookies.get('openid') || '',
        unionid: Cookies.get('unionid') || '', // 存储unionid
        wechatInfoId: Cookies.get('wechatInfoId') || '',
        nickname: Cookies.get('nickname') || '',
        sex: 0,
        token: '',

        setWechatInfoIds({ openid, unionid, wechatInfoId, nickname, sex }: WechatUserInfo) {
          set((state) => {
            state.openid = openid;
            state.unionid = unionid;
            state.wechatInfoId = wechatInfoId;
            state.nickname = nickname;
            state.sex = sex;
          });
        },
        setToken(token) {
          set((state) => {
            state.token = token;
          });
        },
        shareToken: '',
        setShareToken(shareToken) {
          set((state) => {
            state.shareToken = shareToken;
          });
        },
        // 使用immer中间件以不可变方式更新状态
        source: undefined,
        setSource(e) {
          set((state) => {
            // 首次进入 chat 页面，如果相同的 source，则恢复上一次的 chatId
            if (!state.chatId && state.lastChatId && state.lastChatId.startsWith(e)) {
              state.chatId = state.lastChatId.split('-')[1];
            } else if (e !== get().source) {
              // 来源改变，强制重置 chatId
              state.chatId = getNanoid(24);
            }

            // 如果没有 appId 且有上一次的 appId，则恢复
            if (!state.appId && state.lastChatAppId) {
              state.appId = state.lastChatAppId;
            }

            state.source = e; // 更新 source
          });
        },
        appId: '',
        setAppId(e) {
          if (!e) return; // 如果没有提供 appId，则不更新

          set((state) => {
            state.appId = e; // 更新 appId
            state.lastChatAppId = e; // 更新 lastChatAppId
          });
        },
        lastChatId: '',
        chatId: '',
        setChatId(e) {
          const id = e || getNanoid(24); // 如果没有提供 chatId，则生成一个新的
          set((state) => {
            state.chatId = id; // 更新 chatId
            state.lastChatId = `${state.source}-${id}`; // 更新 lastChatId
          });
        },
        lastChatAppId: '',
        setLastChatAppId(e) {
          set((state) => {
            state.lastChatAppId = e; // 更新 lastChatAppId
          });
        },
        outLinkAuthData: {},
        setOutLinkAuthData(e) {
          set((state) => {
            state.outLinkAuthData = e; // 更新 outLinkAuthData
          });
        },
        chatStauts: ChatStatusType.INIT_CHAT, // INIT
        setChatStauts(status: string) {
          set((state) => {
            console.log('ccc setChatStauts status', status);
            state.chatStauts = status; // 更新 chatStauts
          });
        },
        agentConfigInfo: {
          memberLevelList: [],
          userGuideConfig: '',
          memberPrice: '',
          agentPrice: 0,
          freeCount: 0,
          paid: false,
          memberLevelOk: false,
          agentId: 0,
          appKey: Cookies.get('appKey') || '',
          name: '',
          avatar: '',
          sourceType: '',
          thirdResourceId: '',
          enabled: false,
          permissionType: 'INIT',
          description: '',
          agentConfig: {
            commonConfig: {
              enableGenImg: false,
              styleType: 'default'
            },
            chatItemConfig: {
              paddingTop: 24,
              paddingBottom: 24,
              isFullWidth: false,
              showHumanController: true,
              showAIAvatar: true,
              showAIWorkflowStatus: true,
              showAIControllerPosition: 'top',
              showAIController: true
            },
            list: [],
            weChatShareConfig: {},
            h5: {
              share_switch: true
            },
            miniprogram: {
              dialog_share_config: {},
              friend_share_config: {},
              pay_config: {},
              card_config: {}
            },
            qaGuideConfig: {
              enable: true,
              appId: '',
              appKey: '',
              version: 'v1'
            },
            chatConfig: {
              version: 'v1'
            }
          },
          tenantId: -1,
          status: '',
          url: ''
        },
        setAgentConfigInfo(config) {
          set((state) => {
            const agConfigStr = config.agentConfig;
            delete config.agentConfig;
            // console.log('xxx agentConfigInfo2322 before config, agConfigStr', config, agConfigStr);
            Object.assign(state.agentConfigInfo, config);
            if (typeof agConfigStr === 'string' && agConfigStr.length > 0) {
              try {
                const agConfig = JSON.parse(agConfigStr);
                console.log('xxx agentConfigInfo2322 agConfig', agConfig);
                if (agConfig && agConfig.list) {
                  state.agentConfigInfo.agentConfig.list = agConfig.list || [];
                }
                if (agConfig && agConfig.qaGuideConfig) {
                  Object.assign(
                    state.agentConfigInfo.agentConfig.qaGuideConfig,
                    agConfig.qaGuideConfig
                  );
                }
                if (agConfig && agConfig.chatConfig) {
                  Object.assign(state.agentConfigInfo.agentConfig.chatConfig, agConfig.chatConfig);
                }

                if (agConfig && agConfig.commonConfig) {
                  Object.assign(
                    state.agentConfigInfo.agentConfig.commonConfig,
                    agConfig.commonConfig
                  );
                }

                if (agConfig && agConfig.chatItemConfig) {
                  Object.assign(
                    state.agentConfigInfo.agentConfig.chatItemConfig,
                    agConfig.chatItemConfig
                  );
                }

                if (agConfig && agConfig.h5) {
                  Object.assign(state.agentConfigInfo.agentConfig.h5, agConfig.h5);
                }

                if (agConfig && agConfig.miniprogram && agConfig.miniprogram.dialog_share_config) {
                  state.agentConfigInfo.agentConfig.miniprogram.dialog_share_config =
                    agConfig.miniprogram.dialog_share_config || {};
                }

                if (agConfig && agConfig.miniprogram && agConfig.miniprogram.friend_share_config) {
                  state.agentConfigInfo.agentConfig.miniprogram.friend_share_config =
                    agConfig.miniprogram.friend_share_config || {};
                }

                if (agConfig && agConfig.miniprogram && agConfig.miniprogram.pay_config) {
                  state.agentConfigInfo.agentConfig.miniprogram.pay_config =
                    agConfig.miniprogram.pay_config || {};
                }

                if (agConfig && agConfig.miniprogram && agConfig.miniprogram.card_config) {
                  state.agentConfigInfo.agentConfig.miniprogram.card_config =
                    agConfig.miniprogram.card_config || {};
                }
              } catch (error) {
                console.error('agentConfigInfo.agentConfig error:', error);
              }
            }

            Cookies.remove('nb_fastgpt_token');
            Cookies.remove('fastgpt_token');
            Cookies.set('appKey', state.agentConfigInfo.appKey, {
              expires: 45
            });
            // Cookies.set('nb_fastgpt_token', config.appKey, { expires: 2, path: '/' });
          });
        },
        staffInfo: {
          id: 0,
          name: '',
          nickname: '',
          userId: '',
          orgId: 0,
          parentOrgIdList: []
        },
        setStaffInfo(info) {
          set((state) => {
            state.staffInfo = info;
          });
        }
      })),
      {
        name: 'chatStore', // 存储名称
        storage: createJSONStorage(createCustomStorage), // 使用自定义存储机制
        partialize: (state) => ({
          source: state.source,
          chatId: state.chatId,
          appId: state.appId,
          lastChatId: state.lastChatId,
          lastChatAppId: state.lastChatAppId
        }) // 指定需要持久化的状态
      }
    )
  )
);
