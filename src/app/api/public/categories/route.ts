import { NextResponse } from 'next/server';
import { productService } from '@/services/product.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    return NextResponse.json(await productService.categories());
  } catch {
    return NextResponse.json(
      { message: 'Chưa tải được danh mục.' },
      { status: 503 },
    );
  }
}
