import 'server-only';
import { readFile } from 'fs/promises';
import path from 'path';
import { db } from '@/lib/db';
import { previewMetadataSchema } from '@/lib/validation';
import { imageStorage } from './storage.service';

const MAX_TOTAL_IMAGE_SIZE = 8 * 1024 * 1024;
const DEFAULT_REPLICATE_MODEL = 'google/nano-banana-pro';
const FASHION_PROMPT = `Create a realistic fashion portrait.

Use the face and identity from image 1.

Use the outfit, hairstyle, pose and composition from image 2.

Generate a highly realistic studio quality fashion photo.

Preserve:
- facial identity
- skin tone
- facial features

Match:
- outfit exactly
- pose
- accessories
- body position

Professional fashion photography.
Natural skin texture.
Soft lighting.
Ultra realistic.
High detail.
Luxury fashion magazine style.`;

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

type ReplicateStatus = 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';

interface ReplicatePrediction {
  id: string;
  status: ReplicateStatus;
  output?: unknown;
  error?: string | null;
}

interface PreviewNotes {
  productId: string;
  productCode: string;
  customerName: string | null;
  phone: string | null;
  faceImageUrl: string;
  bodyImageUrl: string | null;
  provider: 'replicate';
  model: string;
  predictionId: string;
  storage: 'cloud';
}

function validateImage(file: File | null, required: boolean) {
  if (!file && required) throw new Error('Vui lòng chọn ảnh khuôn mặt.');
  if (!file) return;
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error('Định dạng ảnh không được hỗ trợ.');
  }
}

function parseProductImages(value?: string | null) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.filter(Boolean).map(String);
  } catch {
    // Legacy records may contain a single URL.
  }
  return [value];
}

function contentTypeForPath(value: string) {
  const extension = path.extname(value).toLowerCase();
  if (extension === '.png') return 'image/png';
  if (extension === '.webp') return 'image/webp';
  if (extension === '.heic') return 'image/heic';
  if (extension === '.heif') return 'image/heif';
  return 'image/jpeg';
}

async function fileToDataUri(file: File) {
  const base64 = Buffer.from(await file.arrayBuffer()).toString('base64');
  return `data:${file.type};base64,${base64}`;
}

async function productImageToDataUri(value: string) {
  if (value.startsWith('/uploads/') && process.env.LOCAL_UPLOAD_ROOT) {
    const root = path.resolve(process.env.LOCAL_UPLOAD_ROOT);
    const requested = path.resolve(root, value.slice('/uploads/'.length));
    if (!requested.startsWith(`${root}${path.sep}`)) {
      throw new Error('Đường dẫn ảnh sản phẩm không hợp lệ.');
    }
    const content = await readFile(requested);
    return `data:${contentTypeForPath(value)};base64,${content.toString('base64')}`;
  }

  if (value.startsWith('/')) {
    const publicRoot = path.resolve(process.cwd(), 'public');
    const requested = path.resolve(publicRoot, value.slice(1));
    if (!requested.startsWith(`${publicRoot}${path.sep}`)) {
      throw new Error('Đường dẫn ảnh sản phẩm không hợp lệ.');
    }
    const content = await readFile(requested);
    return `data:${contentTypeForPath(value)};base64,${content.toString('base64')}`;
  }

  const response = await fetch(value, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Không thể tải ảnh sản phẩm: ${response.status}`);
  }
  const contentType = response.headers.get('content-type') || 'image/jpeg';
  const base64 = Buffer.from(await response.arrayBuffer()).toString('base64');
  return `data:${contentType};base64,${base64}`;
}

function replicateConfig() {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    throw new Error('Chưa cấu hình REPLICATE_API_TOKEN cho tính năng xem thử AI.');
  }
  return {
    token,
    model: process.env.REPLICATE_IMAGE_MODEL || DEFAULT_REPLICATE_MODEL,
  };
}

async function replicateRequest(url: string, init: RequestInit = {}) {
  const { token } = replicateConfig();
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
    cache: 'no-store',
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = payload?.detail || payload?.error || `HTTP ${response.status}`;
    throw new Error(`Replicate không thể xử lý yêu cầu: ${detail}`);
  }
  return payload as ReplicatePrediction;
}

function extractOutputUrl(output: unknown): string | null {
  if (typeof output === 'string') return output;
  if (Array.isArray(output)) {
    return output.find((item): item is string => typeof item === 'string') || null;
  }
  if (output && typeof output === 'object') {
    const record = output as Record<string, unknown>;
    for (const key of ['url', 'image', 'output']) {
      if (typeof record[key] === 'string') return record[key] as string;
    }
  }
  return null;
}

async function createReplicatePrediction(input: {
  identityImage: string;
  fashionReferenceImage: string;
}) {
  const { model } = replicateConfig();
  return replicateRequest(
    `https://api.replicate.com/v1/models/${model}/predictions`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Prefer: 'wait=60',
        'Cancel-After': '5m',
      },
      body: JSON.stringify({
        input: {
          prompt: FASHION_PROMPT,
          image_input: [
            input.identityImage,
            input.fashionReferenceImage,
          ],
          aspect_ratio: '3:4',
          resolution: '2K',
          output_format: 'jpg',
        },
      }),
    },
  );
}

async function persistReplicateOutput(
  outputUrl: string,
  folder: string,
  storage = imageStorage(),
) {
  const { token } = replicateConfig();
  return storage.uploadRemote(outputUrl, `${folder}/result`, {
    Authorization: `Bearer ${token}`,
  });
}

function readNotes(value: string | null): PreviewNotes {
  try {
    return JSON.parse(value || '') as PreviewNotes;
  } catch {
    throw new Error('Dữ liệu yêu cầu xem thử không hợp lệ.');
  }
}

export async function createAIPreview(form: FormData) {
  const faceValue = form.get('faceImage');
  const bodyValue = form.get('bodyImage');
  const faceImage = faceValue instanceof File ? faceValue : null;
  const bodyImage = bodyValue instanceof File ? bodyValue : null;
  validateImage(faceImage, true);
  validateImage(bodyImage, false);
  if ((faceImage?.size || 0) + (bodyImage?.size || 0) > MAX_TOTAL_IMAGE_SIZE) {
    throw new Error('Tổng dung lượng hai ảnh không được lớn hơn 8 MB.');
  }

  const metadata = previewMetadataSchema.parse({
    productId: form.get('productId'),
    customerName: form.get('customerName') || undefined,
    phone: form.get('phone') || undefined,
  });
  const product = await db.product.findFirst({
    where: {
      id: metadata.productId,
      archivedAt: null,
      isActive: true,
      status: { in: ['AVAILABLE', 'RESERVED'] },
    },
  });
  if (!product) throw new Error('Không tìm thấy sản phẩm.');

  const productImage = parseProductImages(product.image)[0];
  if (!productImage) throw new Error('Sản phẩm chưa có ảnh để tạo bản xem thử.');

  const storage = imageStorage();
  const folder =
    `rental-fashion/ai-preview/${new Date().toISOString().slice(0, 10)}/${product.code || product.id}`;
  const [faceImageUrl, bodyImageUrl, identityImage, fashionReferenceImage] = await Promise.all([
    storage.upload(faceImage!, `${folder}/input`),
    bodyImage ? storage.upload(bodyImage, `${folder}/input`) : Promise.resolve(undefined),
    fileToDataUri(faceImage!),
    productImageToDataUri(productImage),
  ]);
  const prediction = await createReplicatePrediction({
    identityImage,
    fashionReferenceImage,
  });
  const outputUrl = extractOutputUrl(prediction.output);
  const previewImageUrl = outputUrl
    ? await persistReplicateOutput(outputUrl, folder, storage)
    : null;

  const customer = metadata.phone
    ? await db.customer.findFirst({
        where: { phone: metadata.phone, archivedAt: null },
        orderBy: { updatedAt: 'desc' },
      })
    : null;
  const completed = Boolean(previewImageUrl);
  const notes: PreviewNotes = {
    productId: product.id,
    productCode: product.code || product.qrCode || product.id,
    customerName: metadata.customerName || null,
    phone: metadata.phone || null,
    faceImageUrl,
    bodyImageUrl: bodyImageUrl || null,
    provider: 'replicate',
    model: replicateConfig().model,
    predictionId: prediction.id,
    storage: 'cloud',
  };
  const message = completed
    ? 'Gemini đã tạo xong ảnh thời trang.'
    : 'Gemini đang xử lý ảnh. Kết quả sẽ tự động cập nhật.';
  const request = await db.previewRequest.create({
    data: {
      customerId: customer?.id || null,
      garmentName: product.name,
      sourceImageUrl: faceImageUrl,
      resultImageUrl: previewImageUrl,
      status: completed ? 'COMPLETED' : 'PROCESSING',
      notes: JSON.stringify(notes),
      resultNotes: message,
    },
  });

  return {
    requestId: request.id,
    status: completed ? 'completed' as const : 'pending' as const,
    previewImageUrl,
    faceImageUrl,
    bodyImageUrl: bodyImageUrl || null,
    message,
  };
}

export async function getAIPreview(requestId: string) {
  const request = await db.previewRequest.findFirst({
    where: { id: requestId, archivedAt: null },
  });
  if (!request) throw new Error('Không tìm thấy yêu cầu xem thử AI.');

  if (request.status === 'COMPLETED' && request.resultImageUrl) {
    return {
      requestId: request.id,
      status: 'completed' as const,
      previewImageUrl: request.resultImageUrl,
      message: request.resultNotes,
    };
  }
  if (request.status === 'REJECTED') {
    return {
      requestId: request.id,
      status: 'failed' as const,
      previewImageUrl: null,
      message: request.resultNotes || 'Gemini không thể tạo ảnh thời trang.',
    };
  }

  const notes = readNotes(request.notes);
  const prediction = await replicateRequest(
    `https://api.replicate.com/v1/predictions/${notes.predictionId}`,
  );
  if (prediction.status === 'failed' || prediction.status === 'canceled') {
    const message = prediction.error || 'Gemini không thể tạo ảnh thời trang.';
    await db.previewRequest.update({
      where: { id: request.id },
      data: { status: 'REJECTED', resultNotes: message },
    });
    return {
      requestId: request.id,
      status: 'failed' as const,
      previewImageUrl: null,
      message,
    };
  }

  const outputUrl = extractOutputUrl(prediction.output);
  if (outputUrl) {
    const folder =
      `rental-fashion/ai-preview/${request.createdAt.toISOString().slice(0, 10)}/${notes.productCode}`;
    const previewImageUrl = await persistReplicateOutput(outputUrl, folder);
    const message = 'Gemini đã tạo xong ảnh thời trang.';
    await db.previewRequest.update({
      where: { id: request.id },
      data: {
        status: 'COMPLETED',
        resultImageUrl: previewImageUrl,
        resultNotes: message,
      },
    });
    return {
      requestId: request.id,
      status: 'completed' as const,
      previewImageUrl,
      message,
    };
  }

  return {
    requestId: request.id,
    status: 'pending' as const,
    previewImageUrl: null,
    message: 'Gemini đang xử lý ảnh. Kết quả sẽ tự động cập nhật.',
  };
}
