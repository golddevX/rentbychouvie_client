import { readFile } from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CONTENT_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.heic': 'image/heic',
  '.heif': 'image/heif',
};

export async function GET(_request: Request, context: { params: { path: string[] } }) {
  const root = process.env.LOCAL_UPLOAD_ROOT;
  if (!root) {
    return NextResponse.json({ message: 'Local media is disabled.' }, { status: 404 });
  }
  const absoluteRoot = path.resolve(root);
  const requested = path.resolve(absoluteRoot, ...context.params.path);
  if (!requested.startsWith(`${absoluteRoot}${path.sep}`)) {
    return NextResponse.json({ message: 'Invalid media path.' }, { status: 400 });
  }
  try {
    const content = await readFile(requested);
    return new NextResponse(content, {
      headers: {
        'content-type': CONTENT_TYPES[path.extname(requested).toLowerCase()] || 'application/octet-stream',
        'cache-control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return NextResponse.json({ message: 'Media not found.' }, { status: 404 });
  }
}
