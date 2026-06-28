import { NextRequest, NextResponse } from 'next/server';
import { validateVoucher } from '@/services/voucher.service';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    return NextResponse.json(await validateVoucher(await request.json()));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Voucher không hợp lệ.';
    return NextResponse.json({ message }, { status: 400 });
  }
}
