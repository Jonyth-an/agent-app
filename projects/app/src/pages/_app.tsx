import type { AppProps } from 'next/app';
import Script from 'next/script';

import Layout from '@/components/Layout';
import { appWithTranslation } from 'next-i18next';

import QueryClientContext from '@/web/context/QueryClient';
import ChakraUIContext from '@/web/context/ChakraUI';
import I18nContextProvider from '@/web/context/I18n';
import { useInitApp } from '@/web/context/useInitApp';
import { useTranslation } from 'next-i18next';
import '@/web/styles/reset.scss';
import NextHead from '@/components/common/NextHead';
import { ReactElement, useEffect } from 'react';
import { NextPage } from 'next';
import { getWebReqUrl } from '@fastgpt/web/common/system/utils';
import SystemStoreContextProvider from '@fastgpt/web/context/useSystem';

type NextPageWithLayout = NextPage & {
  setLayout?: (page: ReactElement) => JSX.Element;
};
type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

function App({ Component, pageProps }: AppPropsWithLayout) {
  const { feConfigs, scripts, title } = useInitApp();
  const { t } = useTranslation();

  // 添加 setLog 函数
  const setLog = (search: string) => {
    const set = new URLSearchParams(search);
    const devValue = set.get('dev');
    if (devValue && devValue === '123456') {
      // 等待 VConsole 脚本加载完成
      const checkVConsole = () => {
        // @ts-ignore
        if (window.VConsole) {
          // @ts-ignore
          new window.VConsole();
        } else {
          setTimeout(checkVConsole, 100);
        }
      };
      checkVConsole();
    }
  };

  // 在页面加载完成后执行
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const { search } = window.location;
      setLog(search);
    }
  }, []);

  // Forbid touch scale
  useEffect(() => {
    document.addEventListener(
      'wheel',
      function (e) {
        if (e.ctrlKey && Math.abs(e.deltaY) !== 0) {
          e.preventDefault();
        }
      },
      { passive: false }
    );
  }, []);

  const setLayout = Component.setLayout || ((page) => <>{page}</>);

  return (
    <>
      <NextHead
        title={title}
        desc={
          feConfigs?.systemDescription ||
          process.env.SYSTEM_DESCRIPTION ||
          `${title}${t('app:intro')}`
        }
        icon={getWebReqUrl(feConfigs?.favicon || process.env.SYSTEM_FAVICON)}
      />

      <Script src={getWebReqUrl('/js/utils/jsweixin.js')} strategy="beforeInteractive" />
      <Script src={getWebReqUrl('/js/utils/vConsole.js')} strategy="beforeInteractive" />
      {scripts?.map((item, i) => (
        <Script key={i} strategy="lazyOnload" {...item} />
      ))}

      <QueryClientContext>
        <SystemStoreContextProvider device={pageProps.deviceSize}>
          <I18nContextProvider>
            <ChakraUIContext>
              <Layout>{setLayout(<Component {...pageProps} />)}</Layout>
            </ChakraUIContext>
          </I18nContextProvider>
        </SystemStoreContextProvider>
      </QueryClientContext>
    </>
  );
}

export default appWithTranslation(App);
