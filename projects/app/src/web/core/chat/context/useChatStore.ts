import { create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { getNanoid } from '@fastgpt/global/common/string/tools';
import { OutLinkChatAuthProps } from '@fastgpt/global/support/permission/chat';
import { ChatSourceEnum } from '@fastgpt/global/core/chat/constants';
import { agentConfigInfo, StaffInfo } from '@/global/core/user/api';
import { loginUrl } from '@/config';

// 定义状态类型，描述store中管理的状态和更新状态的方法
type State = {
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

  agentConfigInfo: agentConfigInfo; // 存储代理配置
  setAgentConfigInfo: (config: agentConfigInfo) => void; // 更新代理配置的方法

  staffInfo: StaffInfo; // 存储员工信息
  setStaffInfo: (info: any) => void; // 更新员工信息的方法
  redirectAuth: (info?: any) => void; // 重定向认证的方法
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
        token: '',
        setToken(token) {
          set((state) => {
            state.token = token;
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
        agentConfigInfo: {
          agentId: '',
          name: '',
          avatar: '',
          sourceType: '',
          thirdResourceId: '',
          enabled: false,
          permissionType: '',
          description: '',
          agentConfig: '',
          tenantId: 0,
          status: ''
        },
        setAgentConfigInfo(config) {
          set((state) => {
            state.agentConfigInfo = config;
            if (config.agentConfig && typeof config.agentConfig === 'string') {
              state.agentConfigInfo.agentConfig = JSON.parse(config.agentConfig);
            }
            console.log('xxx agentConfigInfo2322', state.agentConfigInfo);
          });
        },
        staffInfo: {
          id: 0,
          name: '',
          userId: '',
          orgId: 0,
          parentOrgIdList: []
        },
        setStaffInfo(info) {
          set((state) => {
            state.staffInfo = info;
          });
        },
        redirectAuth({ isLogin }: { isLogin?: boolean } = {}) {
          // if (isLogin) {
          //   window.location.href = loginUrl;
          // } else {
          //   window.location.href = loginUrl;
          // }
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
