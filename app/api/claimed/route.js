import { NextResponse } from 'next/server';
import { updateClaimedStatus } from '@/app/lib/db';

export async function PATCH(request) {
  try {
    const { id, claimed } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Bet ID is required' },
        { status: 400 }
      );
    }

    if (typeof claimed !== 'boolean') {
      return NextResponse.json(
        { error: 'Claimed status must be a boolean' },
        { status: 400 }
      );
    }

    const updatedBet = await updateClaimedStatus(id, claimed);
    return NextResponse.json(updatedBet);
  } catch (error) {
    console.error('Error updating claimed status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update claimed status' },
      { status: 500 }
    );
  }
}
