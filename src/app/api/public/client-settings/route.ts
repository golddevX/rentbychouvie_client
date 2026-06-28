import { NextResponse } from 'next/server';
import { getClientSettings } from '@/services/client-settings.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json(await getClientSettings());
}
