// app/api/game-state/route.js
import { getGameState, updateGameState } from '@/app/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const gameState = await getGameState();
    return NextResponse.json(gameState);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch game state' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { revealedGender, isRevealed } = await request.json();
    
    if (isRevealed && !['boy', 'girl'].includes(revealedGender)) {
      return NextResponse.json({ error: 'Invalid revealed gender' }, { status: 400 });
    }
    
    await updateGameState(revealedGender, isRevealed);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update game state' }, { status: 500 });
  }
}