import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { createAIPreview } from '@/services/ai-preview.service';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    return NextResponse.json(
      await createAIPreview(await request.formData()),
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: 'Thông tin xem thử chưa hợp lệ.' },
        { status: 400 },
      );
    }
    const message = error instanceof Error
      ? error.message
      : 'Chưa thể tạo yêu cầu xem thử.';
    return NextResponse.json(
      { message },
      {
        status: message.includes('UPLOAD_PROVIDER_KEY')
          || message.includes('REPLICATE_API_TOKEN')
          ? 503
          : 400,
      },
    );
  }
}
