import { useRouter } from 'next/router';
import { useUserStore } from '@/web/support/user/useUserStore';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'next-i18next';
import { useToast } from '@fastgpt/web/hooks/useToast';

const unAuthPage: { [key: string]: boolean } = {
  '/': true,
  '/pageError': true,
  '/login': true,
  '/chat': true,
  '/login/provider': true,
  '/login/fastlogin': true,
  '/login/sso': true,
  '/appStore': true,
  '/chat/share': true,
  '/chat/team': true,
  '/tools/price': true,
  '/price': true
};

// 定义一个Auth组件，接收一个children参数，类型为JSX.Element或React.ReactNode
const Auth = ({ children }: { children: JSX.Element | React.ReactNode }) => {
  // 使用useTranslation获取翻译函数t
  const { t } = useTranslation();
  // 使用useRouter获取路由对象router
  const router = useRouter();
  // 使用useToast获取toast对象
  const { toast } = useToast();
  // 使用useUserStore获取用户信息userInfo和初始化用户信息函数initUserInfo
  const { userInfo, initUserInfo } = useUserStore();

  // 使用useQuery进行数据查询
  useQuery(
    [router.pathname],
    () => {
      // 如果当前页面不需要认证或者用户已经登录，则返回null
      if (unAuthPage[router.pathname] === true || userInfo) {
        return null;
      } else {
        // 否则调用初始化用户信息函数
        return initUserInfo();
      }
    },
    {
      // 如果查询出错，则执行以下操作
      onError(error) {
        // 打印错误信息
        console.log('error->', error);
        // 将用户重定向到登录页面，并将当前页面的路径作为参数传递
        router.replace(`/?lastRoute=${encodeURIComponent(location.pathname + location.search)}`);
        // 弹出提示框，提示用户需要登录
        toast({
          status: 'warning',
          title: t('common:support.user.Need to login')
        });
      }
    }
  );

  // 如果用户已经登录或者当前页面不需要认证，则返回children，否则返回null
  return !!userInfo || unAuthPage[router.pathname] === true ? children : null;
};

export default Auth;
