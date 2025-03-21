import * as fs from 'fs';
import * as path from 'path';
import { remove } from 'fs-extra';
import { configure, getLogger } from 'log4js';
import * as moment from 'moment';
import { logPath } from '../config';

class Logger {
  public logger;
  public layout;
  private filenamePrefix;

  constructor(filenamePrefix: string = '') {
    this.filenamePrefix = filenamePrefix;
    this.configureLogger();
    this.scheduleMidnightReconfiguration();
    // 清理超过15天的日志文件
    // this.cleanupOldFiles(logDir, 20);
  }

  getLogDir() {
    const dateStr = moment().format('YYYY-MM-DD');
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

        healthy: {
          // 外部 健康检查
          ...config,
          filename: path.join(logDir, `tmagic-editor-server-healthy`)
        },

        agentRequest: {
          ...config,
          filename: path.join(logDir, `tmagic-editor-server-agent-request`)
        },
        agentError: {
          ...config,
          filename: path.join(logDir, `tmagic-editor-server--agent-error`)
        },
        agentErrorFilter: {
          type: 'logLevelFilter',
          pattern: 'yyyy-MM-dd.log',
          level: 'ERROR',
          appender: 'agentError',
          keepFileExt: true,
          layout
        }
      },
      categories: {
        default: {
          appenders: ['console', 'dateRollingFile', 'errors'],
          level: 'debug'
        },
        healthy: {
          appenders: ['healthy'],
          level: 'info'
        },

        agentRequest: {
          appenders: ['console', 'agentRequest', 'agentErrorFilter'],
          level: 'info'
        }
      }
    });
    this.logger = getLogger();
  }

  scheduleMidnightReconfiguration() {
    const midnight = moment().endOf('day').add(1, 'second'); // 下一个凌晨
    const timeUntilMidnight = midnight.diff(moment());
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
  const midnight = moment().endOf('day').add(1, 'second'); // 下一个凌晨
  const timeUntilMidnight = midnight.diff(moment());
  cleanFile();
  setInterval(cleanFile, 60 * 60 * 1000);
}
