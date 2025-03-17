import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authFileToken } from '@fastgpt/service/support/permission/controller';
import { getDownloadStream, getFileById } from '@fastgpt/service/common/file/gridfs/controller';
import { CommonErrEnum } from '@fastgpt/global/common/error/code/common';
import { stream2Encoding } from '@fastgpt/service/common/file/gridfs/utils';
import { getCustomLogger } from '@fastgpt/service/common/system/logger';
import { addLog } from '@fastgpt/service/common/system/log';

const previewableExtensions = [
  'jpg',
  'jpeg',
  'png',
  'gif',
  'bmp',
  'webp',
  'txt',
  'log',
  'csv',
  'md',
  'json'
];
const logger = getCustomLogger('file-read');

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    addLog.debug('file/read -> start', { query: req.query });
    logger.debug('Start reading file', { query: req.query });
    
    await connectToDatabase();

    const { token, filename } = req.query as { token: string; filename: string };

    const { fileId, bucketName } = await authFileToken(token);
    addLog.debug('file/read -> auth token result', { fileId, bucketName });
    logger.debug('Auth token result', { fileId, bucketName });

    if (!fileId) {
      logger.warn('FileId is empty');
      throw new Error('fileId is empty');
    }

    const [file, fileStream] = await Promise.all([
      getFileById({ bucketName, fileId }),
      getDownloadStream({ bucketName, fileId })
    ]).catch(err => {
      addLog.error('file/read -> get file error', { err, fileId, bucketName });
      logger.error('Get file error', { err, fileId, bucketName });
      throw err;
    });

    if (!file) {
      addLog.warn('file/read -> file not found', { fileId, bucketName });
      logger.warn('File not found', { fileId, bucketName });
      return Promise.reject(CommonErrEnum.fileNotFound);
    }

    addLog.debug('file/read -> file info', { 
      filename: file.filename,
      contentType: file.contentType,
      length: file.length,
      metadata: file.metadata 
    });

    const { stream, encoding } = await (async () => {
      if (file.metadata?.encoding) {
        return {
          stream: fileStream,
          encoding: file.metadata.encoding
        };
      }
      return stream2Encoding(fileStream);
    })().catch(err => {
      addLog.error('file/read -> stream encoding error', err);
      logger.error('Stream encoding error', err);
      throw err;
    });

    const extension = file.filename.split('.').pop() || '';
    const disposition = previewableExtensions.includes(extension) ? 'inline' : 'attachment';

    res.setHeader('Content-Type', `${file.contentType}; charset=${encoding}`);
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.setHeader(
      'Content-Disposition',
      `${disposition}; filename="${encodeURIComponent(filename)}"`
    );
    res.setHeader('Content-Length', file.length);

    stream.pipe(res);

    stream.on('error', (err) => {
      addLog.error('file/read -> stream pipe error', err);
      logger.error('Stream pipe error', err);
      res.status(500).end();
    });

  } catch (error) {
    addLog.error('file/read -> handler error', { 
      error,
      query: req.query,
      stack: error instanceof Error ? error.stack : undefined
    });
    logger.error('Handler error', { 
      error,
      query: req.query,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    jsonRes(res, {
      code: 500,
      error: error instanceof Error ? error.message : error
    });
  }
}
export const config = {
  api: {
    responseLimit: '100mb'
  }
};
