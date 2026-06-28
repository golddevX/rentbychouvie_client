import { NextRequest, NextResponse } from 'next/server';
import { productService } from '@/services/product.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(await productService.list(request.nextUrl.searchParams));
  } catch {
    return NextResponse.json(
      { message: 'Chưa tải được danh sách sản phẩm.' },
      { status: 503 },
    );
  }
}
