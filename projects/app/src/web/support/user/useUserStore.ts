import type { UserUpdateParams } from '@/types/user';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import { getTokenLogin, putUserInfo } from '@/web/support/user/api';
import type { MemberGroupListType } from '@fastgpt/global/support/permission/memberGroup/type';
import type { OrgType } from '@fastgpt/global/support/user/team/org/type';
import type { UserType } from '@fastgpt/global/support/user/type.d';
import type { FeTeamPlanStatusType } from '@fastgpt/global/support/wallet/sub/type';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { getTeamPlanStatus } from './team/api';
import { getGroupList } from './team/group/api';
import { getOrgList } from './team/org/api';

// 定义状态类型
type State = {
  // 系统消息已读ID
  systemMsgReadId: string;
  setSysMsgReadId: (id: string) => void;

  // 是否有更新通知
  isUpdateNotification: boolean;
  setIsUpdateNotification: (val: boolean) => void;

  // 用户信息相关
  userInfo: UserType | null;
  isTeamAdmin: boolean;
  // initUserInfo: () => Promise<UserType>;
  initUserInfo: () => Promise<{}>;
  setUserInfo: (user: UserType | null) => void;
  updateUserInfo: (user: UserUpdateParams) => Promise<void>;

  // 团队计划状态
  teamPlanStatus: FeTeamPlanStatusType | null;
  initTeamPlanStatus: () => Promise<any>;

  // 团队成员组相关
  teamMemberGroups: MemberGroupListType;
  myGroups: MemberGroupListType;
  loadAndGetGroups: (init?: boolean) => Promise<MemberGroupListType>;

  // 组织相关
  teamOrgs: OrgType[];
  myOrgs: OrgType[];
  loadAndGetOrgs: (init?: boolean) => Promise<OrgType[]>;
};

// 创建用户状态存储
export const useUserStore = create<State>()(
  devtools(
    // 启用开发者工具
    persist(
      // 启用持久化存储
      immer((set, get) => ({
        // 系统消息已读ID相关
        systemMsgReadId: '',
        setSysMsgReadId(id: string) {
          set((state) => {
            state.systemMsgReadId = id;
          });
        },

        // 更新通知状态
        isUpdateNotification: true,
        setIsUpdateNotification(val: boolean) {
          set((state) => {
            state.isUpdateNotification = val;
          });
        },

        // 用户信息相关操作
        userInfo: null,
        isTeamAdmin: false,
        // 初始化用户信息
        async initUserInfo() {
          // get().initTeamPlanStatus();
          // const res = await getTokenLogin();
          // get().setUserInfo(res);
          return {};
        },
        // 设置用户信息
        setUserInfo(user: UserType | null) {
          set((state) => {
            state.userInfo = user ? user : null;
            state.isTeamAdmin = !!user?.team?.permission?.hasManagePer;
          });
        },
        // 更新用户信息
        async updateUserInfo(user: UserUpdateParams) {
          // 保存旧数据用于回滚
          const oldInfo = (get().userInfo ? { ...get().userInfo } : null) as UserType | null;
          // 乐观更新
          set((state) => {
            if (!state.userInfo) return;
            state.userInfo = {
              ...state.userInfo,
              ...user
            };
          });
          try {
            await putUserInfo(user);
          } catch (error) {
            // 发生错误时回滚
            set((state) => {
              state.userInfo = oldInfo;
            });
            return Promise.reject(error);
          }
        },

        // 团队计划状态相关
        teamPlanStatus: null,
        async initTeamPlanStatus() {
          return getTeamPlanStatus().then((res) => {
            set((state) => {
              state.teamPlanStatus = res;
            });
            return res;
          });
        },

        // 团队成员组相关
        teamMemberGroups: [],
        teamOrgs: [],
        myGroups: [],
        // 加载并获取组信息，带缓存策略
        loadAndGetGroups: async (init = false) => {
          if (!useSystemStore.getState()?.feConfigs?.isPlus) return [];

          // 70%概率使用缓存数据
          const randomRefresh = Math.random() > 0.7;
          if (!randomRefresh && !init && get().teamMemberGroups.length)
            return Promise.resolve(get().teamMemberGroups);

          const res = await getGroupList();
          set((state) => {
            state.teamMemberGroups = res;
            // 过滤出当前用户所在的组
            state.myGroups = res.filter((item) =>
              item.members.map((i) => String(i.tmbId)).includes(String(state.userInfo?.team?.tmbId))
            );
          });

          return res;
        },

        // 组织相关
        myOrgs: [],
        // 加载并获取组织信息，带缓存策略
        loadAndGetOrgs: async (init = false) => {
          if (!useSystemStore.getState()?.feConfigs?.isPlus) return [];

          // 70%概率使用缓存数据
          const randomRefresh = Math.random() > 0.7;
          if (!randomRefresh && !init && get().myOrgs.length) return Promise.resolve(get().myOrgs);

          const res = await getOrgList();
          set((state) => {
            state.teamOrgs = res;
            // 过滤出当前用户所在的组织
            state.myOrgs = res.filter((item) =>
              item.members.map((i) => String(i.tmbId)).includes(String(state.userInfo?.team?.tmbId))
            );
          });

          return res;
        }
      })),
      {
        // 持久化配置
        name: 'userStore',
        // 只持久化部分状态
        partialize: (state) => ({
          systemMsgReadId: state.systemMsgReadId,
          isUpdateNotification: state.isUpdateNotification
        })
      }
    )
  )
);
