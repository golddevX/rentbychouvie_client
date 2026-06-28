import { NextResponse } from 'next/server';
import { productService } from '@/services/product.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(_request: Request, context: { params: { id: string } }) {
  try {
    const product = await productService.detail(context.params.id);
    if (!product) {
      return NextResponse.json({ message: 'Không tìm thấy sản phẩm.' }, { status: 404 });
    }
    return NextResponse.json(product);
  } catch {
    return NextResponse.json({ message: 'Chưa tải được sản phẩm.' }, { status: 503 });
  }
}
