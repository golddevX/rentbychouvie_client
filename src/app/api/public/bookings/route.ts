import { NextRequest, NextResponse } from 'next/server';
import { createPublicBooking } from '@/services/booking.service';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const result = await createPublicBooking(await request.json());
    return NextResponse.json(result.payload, { status: result.status });
  } catch {
    return NextResponse.json({ message: 'Chưa thể tạo đơn đặt thuê.' }, { status: 503 });
  }
}
