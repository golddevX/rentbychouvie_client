import { NextRequest, NextResponse } from 'next/server';
import { productService } from '@/services/product.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest, context: { params: { id: string } }) {
  try {
    const result = await productService.availability(
      context.params.id,
      request.nextUrl.searchParams,
    );
    if (!result) {
      return NextResponse.json({ message: 'Không tìm thấy sản phẩm.' }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : 'Chưa kiểm tra được lịch trống.';
    return NextResponse.json({ message }, { status: 400 });
  }
}
