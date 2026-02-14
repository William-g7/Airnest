
import { NextResponse } from 'next/server';
import { getServerRates } from '@currency/server/rates';

export const revalidate = 43200; // 12 hours

export async function GET() {
  const rates = await getServerRates();
  return NextResponse.json({ rates });
}
