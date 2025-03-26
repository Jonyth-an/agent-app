'use client';

import { getWebReqUrl } from '@fastgpt/web/common/system/utils';
import type React from 'react';

import { useEffect, useRef } from 'react';

interface VConsoleLoaderProps {
  enabled?: boolean;
}

const VConsoleLoader: React.FC<VConsoleLoaderProps> = ({ enabled = false }) => {
  // 使用 ref 来跟踪 VConsole 实例，避免重复初始化
  const vConsoleInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    // 清理函数，确保组件卸载时清理 VConsole
    return () => {
      if (vConsoleInstanceRef.current) {
        try {
          // 尝试销毁 VConsole 实例（如果支持）
          if (typeof vConsoleInstanceRef.current.destroy === 'function') {
            vConsoleInstanceRef.current.destroy();
          }
          vConsoleInstanceRef.current = null;
        } catch (err) {
          console.error('清理 VConsole 失败:', err);
        }
      }
    };
  }, [enabled]);

  // 使用单独的 useEffect 来处理 VConsole 的初始化
  // 这样可以避免在严格模式下的重复挂载/卸载周期中出现问题
  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || vConsoleInstanceRef.current) return;

    // 动态导入 VConsole，而不是依赖全局变量
    const script = document.createElement('script');
    script.src = getWebReqUrl('/js/utils/vconsole.js');

    script.async = true;

    script.onload = () => {
      try {
        if (window.VConsole && !vConsoleInstanceRef.current) {
          console.log('正在初始化 VConsole...');
          // 使用最新版本的 VConsole
          vConsoleInstanceRef.current = new window.VConsole({
            theme: 'dark', // 使用深色主题
            disableLogScrolling: false, // 允许日志滚动
            maxLogNumber: 1000 // 最大日志数量
          });
          console.log('VConsole 初始化成功');
        }
      } catch (err) {
        console.error('VConsole 初始化失败:', err);
      }
    };

    script.onerror = (err) => {
      console.error('加载 VConsole 脚本失败:', err);
    };

    document.body.appendChild(script);

    return () => {
      // 如果组件卸载但脚本还没加载完，移除脚本
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [enabled]);

  return null;
};

export default VConsoleLoader;
