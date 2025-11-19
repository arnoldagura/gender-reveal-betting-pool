// app/api/reset/route.js
import { resetGame } from '@/app/lib/db';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    await resetGame();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to reset game' }, { status: 500 });
  }
}