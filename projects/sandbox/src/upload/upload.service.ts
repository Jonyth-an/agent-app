import service from '@/utils/request';
import { Injectable } from '@nestjs/common';
import * as FormData from 'form-data';
@Injectable()
export class UploadService {
  async uploadFile({ buffer, filename }) {
    const formData = new FormData();
    formData.append('file', buffer, filename);
    formData.append('features.reUpload', 'false');
    formData.append('features.publicRead', 'true');

    const res = await service({
      url: `/marketing/open/api/v1/fs/upload?bizCode=agent&features.publicRead=false&features.reUpload=true`,
      method: 'POST',
      data: formData,
      headers: {
        ...formData.getHeaders(),
        timeout: 100000,
        appKey: 'agent'
      },
      timeout: 100000,
      maxBodyLength: Infinity
    });
    console.log('upload.service uploadFile res', res);
    return res;
  }
}
