'use strict';
import type { AppProps } from 'next/app';
import Script from 'next/script';
import { useState, useEffect, type ReactElement } from 'react';
import type { NextPage } from 'next';
import { appWithTranslation } from 'next-i18next';
import { useTranslation } from 'next-i18next';

import Layout from '@/components/Layout';
import NextHead from '@/components/common/NextHead';

import QueryClientContext from '@/web/context/QueryClient';
import ChakraUIContext from '@/web/context/ChakraUI';
import I18nContextProvider from '@/web/context/I18n';
import { useInitApp } from '@/web/context/useInitApp';
import '@/web/styles/reset.scss';
import { getWebReqUrl } from '@fastgpt/web/common/system/utils';
import SystemStoreContextProvider from '@fastgpt/web/context/useSystem';
import VConsoleLoader from '@/components/common/Vconsole';

type NextPageWithLayout = NextPage & {
  setLayout?: (page: ReactElement) => JSX.Element;
};
type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

function App({ Component, pageProps }: AppPropsWithLayout) {
  const { feConfigs, scripts, title } = useInitApp();
  const { t } = useTranslation();
  const [enableVConsole, setEnableVConsole] = useState(false);
  // 检查 URL 参数并设置本地存储
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const devValue = params.get('dev');
      const isDebugger = params.get('debugger');

      if (isDebugger === 'true') {
        localStorage.setItem('debugger', 'true');
      }

      if (devValue === '12345678') {
        localStorage.setItem('dev', devValue);
        setEnableVConsole(true);
      }
    }
  }, []);

  // 禁止触摸缩放
  useEffect(() => {
    document.addEventListener(
      'wheel',
      (e) => {
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
      {/* <Script src={getWebReqUrl("/js/utils/vConsole.js")} strategy="beforeInteractive" /> */}
      {scripts?.map((item, i) => <Script key={i} strategy="lazyOnload" {...item} />)}

      {/* VConsole 加载器组件 */}
      <VConsoleLoader enabled={enableVConsole} />

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
