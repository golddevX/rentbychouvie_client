import { createHash } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import 'server-only';

export interface ImageStorageProvider {
  upload(file: File, folder: string): Promise<string>;
  uploadRemote(url: string, folder: string, headers?: Record<string, string>): Promise<string>;
}

class CloudinaryStorageProvider implements ImageStorageProvider {
  async upload(file: File, folder: string) {
    const genericConfig = parseUploadProviderKey(process.env.UPLOAD_PROVIDER_KEY);
    const cloudName = genericConfig.cloudName || process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = genericConfig.apiKey || process.env.CLOUDINARY_API_KEY;
    const apiSecret = genericConfig.apiSecret || process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error('Chưa cấu hình UPLOAD_PROVIDER_KEY cho dịch vụ lưu ảnh.');
    }
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createHash('sha1')
      .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
      .digest('hex');
    const form = new FormData();
    form.append('file', file);
    form.append('folder', folder);
    form.append('timestamp', String(timestamp));
    form.append('api_key', apiKey);
    form.append('signature', signature);
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: form,
    });
    if (!response.ok) throw new Error(`Cloudinary upload failed: ${response.status}`);
    const payload = await response.json();
    return String(payload.secure_url);
  }

  async uploadRemote(url: string, folder: string, headers?: Record<string, string>) {
    const response = await fetch(url, { headers, cache: 'no-store' });
    if (!response.ok) throw new Error(`Không thể tải ảnh kết quả AI: ${response.status}`);
    const contentType = response.headers.get('content-type') || 'image/webp';
    const extension = contentType.includes('png')
      ? '.png'
      : contentType.includes('jpeg')
        ? '.jpg'
        : '.webp';
    const file = new File(
      [await response.arrayBuffer()],
      `ai-try-on${extension}`,
      { type: contentType },
    );
    return this.upload(file, folder);
  }
}

class LocalStorageProvider implements ImageStorageProvider {
  constructor(private readonly root: string) {}

  async upload(file: File, folder: string) {
    const safeFolder = folder
      .split('/')
      .map((part) => part.replace(/[^a-zA-Z0-9._-]/g, '-'))
      .filter(Boolean)
      .join('/');
    const extension = path.extname(file.name || '') || '.jpg';
    const fileName = `${Date.now()}-${crypto.randomUUID()}${extension.toLowerCase()}`;
    const absoluteFolder = path.resolve(this.root, safeFolder);
    const absoluteRoot = path.resolve(this.root);
    if (!absoluteFolder.startsWith(`${absoluteRoot}${path.sep}`)) {
      throw new Error('Đường dẫn upload không hợp lệ.');
    }
    await mkdir(absoluteFolder, { recursive: true });
    await writeFile(path.join(absoluteFolder, fileName), Buffer.from(await file.arrayBuffer()));
    return `/uploads/${safeFolder}/${fileName}`;
  }

  async uploadRemote(url: string, folder: string, headers?: Record<string, string>) {
    const response = await fetch(url, { headers, cache: 'no-store' });
    if (!response.ok) throw new Error(`Không thể tải ảnh kết quả AI: ${response.status}`);
    const contentType = response.headers.get('content-type') || 'image/webp';
    const extension = contentType.includes('png')
      ? '.png'
      : contentType.includes('jpeg')
        ? '.jpg'
        : '.webp';
    const file = new File(
      [await response.arrayBuffer()],
      `ai-try-on${extension}`,
      { type: contentType },
    );
    return this.upload(file, folder);
  }
}

function parseUploadProviderKey(value?: string) {
  if (!value) return { cloudName: '', apiKey: '', apiSecret: '' };
  try {
    const parsed = JSON.parse(value);
    return {
      cloudName: String(parsed.cloudName || ''),
      apiKey: String(parsed.apiKey || ''),
      apiSecret: String(parsed.apiSecret || ''),
    };
  } catch {
    const [cloudName = '', apiKey = '', apiSecret = ''] = value.split(':');
    return { cloudName, apiKey, apiSecret };
  }
}

export function imageStorage(): ImageStorageProvider {
  if (process.env.LOCAL_UPLOAD_ROOT) {
    return new LocalStorageProvider(process.env.LOCAL_UPLOAD_ROOT);
  }
  return new CloudinaryStorageProvider();
}
