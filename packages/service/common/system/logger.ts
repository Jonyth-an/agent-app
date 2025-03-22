import * as fs from 'fs';
import * as path from 'path';
import { remove } from 'fs-extra';
import { configure, getLogger } from 'log4js';
import dayjs from 'dayjs';
const logPath = path.join(process.cwd(), 'logs');

class Logger {
  public logger: any;
  public layout: any;
  private filenamePrefix;

  constructor(filenamePrefix: string = '') {
    this.filenamePrefix = filenamePrefix;
    this.configureLogger();
    this.scheduleMidnightReconfiguration();
    // 清理超过15天的日志文件
    // this.cleanupOldFiles(logDir, 20);
  }

  getLogDir() {
    const dateStr = dayjs().format('YYYY-MM-DD');
    const logDir = path.join(this.filenamePrefix, dateStr);
    // 确保日志目录存在
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    return logDir;
  }

  configureLogger() {
    const filename = process.env.PROGRESS_NAME === 'QUEUE_WORKER' ? 'server-worker' : 'server';
    const layout = {
      type: 'pattern',
      pattern: '%[%d{yyyy-MM-dd hh:mm:ss} %c [%p]%] - %m - %h %n'
    };
    const config = {
      type: 'dateFile',
      mode: 0o666,
      pattern: '-yyyy-MM-dd.log',
      alwaysIncludePattern: true,
      keepFileExt: true,
      maxLogSize: 10485760,
      compress: true,
      layout
    };
    const logDir = this.getLogDir();
    configure({
      appenders: {
        console: {
          type: 'stdout',
          layout
        },
        dateRollingFile: {
          ...config,
          filename: path.join(logDir, `tmagic-editor-${filename}`)
        },
        errorsFile: {
          ...config,
          filename: path.join(logDir, `tmagic-editor-${filename}-error`)
        },
        errors: {
          type: 'logLevelFilter',
          pattern: 'yyyy-MM-dd.log',
          level: 'ERROR',
          appender: 'errorsFile',
          keepFileExt: true,
          layout
        },
        xxlHealthy: {
          // xxl-job健康检查
          ...config,
          filename: path.join(logDir, `tmagic-editor-server-xxlHealthy`)
        },
        healthy: {
          // 外部 健康检查
          ...config,
          filename: path.join(logDir, `tmagic-editor-server-healthy`)
        },
        innerHealthy: {
          // node服务内部 健康检查
          ...config,
          filename: path.join(logDir, `tmagic-editor-server-innerHealthy`)
        },
        fileUpload: {
          ...config,
          filename: path.join(logDir, `tmagic-editor-server-file-upload`)
        }
      },
      categories: {
        default: {
          appenders: ['console', 'dateRollingFile', 'errors'],
          level: 'debug'
        },
        xxlHealthy: {
          appenders: ['xxlHealthy'],
          level: 'info'
        },
        healthy: {
          appenders: ['healthy'],
          level: 'info'
        },
        innerHealthy: {
          appenders: ['innerHealthy'],
          level: 'info'
        },
        'file-upload': {
          appenders: ['console', 'fileUpload', 'errors'],
          level: 'debug'
        }
      }
    });
    this.logger = getLogger();
  }

  scheduleMidnightReconfiguration() {
    const midnight = dayjs().endOf('day').add(1, 'second'); // 下一个凌晨
    const timeUntilMidnight = midnight.diff(dayjs());
    setTimeout(() => {
      this.configureLogger(); // 重新配置日志
      // 每24小时调用一次
      setInterval(this.configureLogger.bind(this), 24 * 60 * 60 * 1000);
    }, timeUntilMidnight);
  }

  info = <T>(...args: T[]) => {
    this.logger.info(...args);
  };

  debug = <T>(...args: T[]) => {
    this.logger.debug(...args);
  };

  warn = <T>(...args: T[]) => {
    this.logger.warn(...args);
  };

  error = <T>(...args: T[]) => {
    this.logger.error(...args);
  };
}

export default new Logger(logPath);

const cleanupOldFiles = (dir: string, days: number) => {
  const now = Date.now();
  const maxAge = days * 24 * 60 * 60 * 1000;

  fs.readdir(dir, (err, files) => {
    if (err) throw err;
    files.forEach((file) => {
      const filepath = path.join(dir, file);
      fs.stat(filepath, (err, stats) => {
        if (err) throw err;
        const fileAge = now - stats.mtimeMs;
        if (fileAge > maxAge) {
          remove(filepath);
        }
      });
    });
  });
};

function cleanFile() {
  cleanupOldFiles(logPath, 15);
  // cleanupOldFiles(StaticPath.TEMPLATE, 15) test2生产不清除StaticPath.TEMPLATE
}
// 设置定时任务每天午夜重新配置日志
export function scheduleCleanFile() {
  const midnight = dayjs().endOf('day').add(1, 'second'); // 下一个凌晨
  const timeUntilMidnight = midnight.diff(dayjs());
  cleanFile();
  setInterval(cleanFile, 60 * 60 * 1000);
}

export const getCustomLogger = (category: string) => {
  const logDir = path.join(process.cwd(), 'projects/app/logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  configure({
    appenders: {
      console: {
        type: 'stdout',
        layout: {
          type: 'pattern',
          pattern: '%[%d{yyyy-MM-dd hh:mm:ss} %c [%p]%] - %m'
        }
      },
      file: {
        type: 'dateFile',
        filename: path.join(logDir, category),
        pattern: '-yyyy-MM-dd.log',
        alwaysIncludePattern: true,
        layout: {
          type: 'pattern',
          pattern: '%d{yyyy-MM-dd hh:mm:ss} [%p] %m'
        }
      }
    },
    categories: {
      default: {
        appenders: ['console', 'file'],
        level: 'debug'
      }
    }
  });

  return getLogger(category);
};
