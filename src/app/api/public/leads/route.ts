import { NextRequest, NextResponse } from 'next/server';
import { createLead } from '@/services/lead.service';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const result = await createLead(await request.json());
    return NextResponse.json(result.payload, { status: result.status });
  } catch {
    return NextResponse.json({ message: 'Chưa thể gửi yêu cầu thuê.' }, { status: 503 });
  }
}
