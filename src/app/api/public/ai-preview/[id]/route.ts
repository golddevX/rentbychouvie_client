import { NextRequest, NextResponse } from 'next/server';
import { getAIPreview } from '@/services/ai-preview.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  context: { params: { id: string } },
) {
  try {
    return NextResponse.json(await getAIPreview(context.params.id));
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : 'Chưa thể kiểm tra kết quả xem thử AI.';
    return NextResponse.json({ message }, { status: 400 });
  }
}
