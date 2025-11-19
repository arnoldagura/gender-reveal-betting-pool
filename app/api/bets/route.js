import { getAllBets, addBet, deleteBet } from '@/app/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    console.log('here')
  try {
    const bets = await getAllBets();
    return NextResponse.json(bets);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch bets' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { name, gender, amount } = await request.json();
    
    // Validation
    if (!name || !gender || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    if (!['boy', 'girl'].includes(gender)) {
      return NextResponse.json({ error: 'Invalid gender' }, { status: 400 });
    }
    
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }
    
    const bet = await addBet(name.trim(), gender, parseFloat(amount));
    return NextResponse.json(bet, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add bet' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Missing bet ID' }, { status: 400 });
    }
    
    await deleteBet(parseInt(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete bet' }, { status: 500 });
  }
}