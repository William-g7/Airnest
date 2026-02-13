
import { NextResponse } from 'next/server';
import { getServerRates } from '@currency/server/rates';

export const revalidate = 60 * 60 * 12;

export async function GET() {
  const rates = await getServerRates();
  return NextResponse.json({ rates });
}
