import * as fs from 'fs';
import * as path from 'path';
import dayjs from 'dayjs';
const logPath = '../../logs';
class Logger {
  private filenamePrefix: string;
  private currentLogFile: string = '';
  private currentErrorFile: string = '';
  constructor(filenamePrefix: string = '') {
    this.filenamePrefix = filenamePrefix;
    if (process.env.NEXT_RUNTIME === 'nodejs') {
      this.setupLogFiles();
      this.scheduleMidnightReconfiguration();
    }
  }

  private setupLogFiles() {
    const dateStr = dayjs().format('YYYY-MM-DD');
    const logDir = path.join(this.filenamePrefix, dateStr);

    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const filename = process.env.PROGRESS_NAME === 'QUEUE_WORKER' ? 'server-worker' : 'server';
    this.currentLogFile = path.join(logDir, `nbagent-${filename}.log`);
    this.currentErrorFile = path.join(logDir, `nbagent-${filename}-error.log`);
  }

  private writeToFile(message: string, isError = false) {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
      const logTime = dayjs().format('YYYY-MM-DD HH:mm:ss');
      const formattedMessage = `[${logTime}] ${message}\n`;

      fs.appendFileSync(this.currentLogFile, formattedMessage);
      if (isError) {
        fs.appendFileSync(this.currentErrorFile, formattedMessage);
      }
    }
  }

  private scheduleMidnightReconfiguration() {
    const midnight = dayjs().endOf('day').add(1, 'second');
    const timeUntilMidnight = midnight.diff(dayjs());
    setTimeout(() => {
      this.setupLogFiles();
      setInterval(() => this.setupLogFiles(), 24 * 60 * 60 * 1000);
    }, timeUntilMidnight);
  }

  info = (...args: any[]) => {
    const message = args
      .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : arg))
      .join(' ');
    console.log(message);
    this.writeToFile(`[INFO] ${message}`);
  };

  debug = (...args: any[]) => {
    const message = args
      .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : arg))
      .join(' ');
    console.debug(message);
    this.writeToFile(`[DEBUG] ${message}`);
  };

  warn = (...args: any[]) => {
    const message = args
      .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : arg))
      .join(' ');
    console.warn(message);
    this.writeToFile(`[WARN] ${message}`);
  };

  error = (...args: any[]) => {
    const message = args
      .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : arg))
      .join(' ');
    console.error(message);
    this.writeToFile(`[ERROR] ${message}`, true);
  };
}

const logger = new Logger(logPath);
export default logger;

// 清理日志文件的功能保持不变
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
          // remove(filepath);
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
  const midnight = dayjs().endOf('day').add(1, 'second'); // 使用 dayjs
  const timeUntilMidnight = midnight.diff(dayjs()); // 使用 dayjs
  cleanFile();
  setInterval(cleanFile, 60 * 60 * 1000);
}
