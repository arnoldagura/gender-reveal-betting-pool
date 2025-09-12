import { supabase } from './supabase';

export async function getAllBets() {
  try {
    const { data, error } = await supabase
      .from('bets')
      .select('id, name, gender, amount, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error fetching bets:', error);
      
      // Return empty array if tables don't exist yet
      if (error.code === '42P01') {
        console.log('Bets table not ready yet, returning empty array');
        return [];
      }
      
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching bets:', error);
    return [];
  }
}

export async function addBet(name, gender, amount) {
  try {
    await initializeDatabase();
    
    const { data, error } = await supabase
      .from('bets')
      .insert([
        { 
          name: name.trim(), 
          gender, 
          amount: parseFloat(amount) 
        }
      ])
      .select('id, name, gender, amount, created_at')
      .single();

    if (error) {
      console.error('Supabase error adding bet:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error adding bet:', error);
    throw new Error(`Failed to add bet: ${error.message}`);
  }
}

export async function deleteBet(id) {
  try {
    await initializeDatabase();
    
    const { error } = await supabase
      .from('bets')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error deleting bet:', error);
      throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting bet:', error);
    throw new Error(`Failed to delete bet: ${error.message}`);
  }
}

export async function getGameState() {
  try {
    await initializeDatabase();
    
    const { data, error } = await supabase
      .from('game_state')
      .select('revealed_gender, is_revealed')
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle(); // Use maybeSingle() to handle empty results gracefully

    if (error) {
      console.error('Supabase error fetching game state:', error);
      
      // Return default state if tables don't exist yet
      if (error.code === '42P01') {
        console.log('Game state table not ready yet, returning default state');
        return { revealed_gender: null, is_revealed: false };
      }
      
      throw error;
    }
    
    // Return default state if no data found
    return data || { revealed_gender: null, is_revealed: false };
  } catch (error) {
    console.error('Error fetching game state:', error);
    // Return default state on any error
    return { revealed_gender: null, is_revealed: false };
  }
}

export async function updateGameState(revealedGender, isRevealed) {
  try {
    await initializeDatabase();
    
    // First check if game_state has any rows
    const { data: existingRows, error: fetchError } = await supabase
      .from('game_state')
      .select('id')
      .limit(1);
    
    if (fetchError) {
      console.error('Error checking existing game state:', fetchError);
      throw fetchError;
    }
    
    if (existingRows && existingRows.length === 0) {
      // Insert first row
      const { error: insertError } = await supabase
        .from('game_state')
        .insert([{
          revealed_gender: revealedGender,
          is_revealed: isRevealed
        }]);
      
      if (insertError) {
        console.error('Supabase error inserting game state:', insertError);
        throw insertError;
      }
    } else {
      // Update existing row - get the most recent one
      const { data: latestRow, error: latestError } = await supabase
        .from('game_state')
        .select('id')
        .order('id', { ascending: false })
        .limit(1)
        .single();
      
      if (latestError) {
        console.error('Error getting latest game state:', latestError);
        throw latestError;
      }
      
      const { error: updateError } = await supabase
        .from('game_state')
        .update({
          revealed_gender: revealedGender,
          is_revealed: isRevealed,
          updated_at: new Date().toISOString()
        })
        .eq('id', latestRow.id);
      
      if (updateError) {
        console.error('Supabase error updating game state:', updateError);
        throw updateError;
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating game state:', error);
    throw new Error(`Failed to update game state: ${error.message}`);
  }
}

export async function resetGame() {
  try {
    await initializeDatabase();
    
    // Delete all bets - use gte(0) to delete all rows (Supabase requires a condition)
    const { error: deleteBetsError } = await supabase
      .from('bets')
      .delete()
      .gte('id', 0); // This will match all rows since all IDs are >= 0
    
    if (deleteBetsError) {
      console.error('Error deleting all bets:', deleteBetsError);
      throw deleteBetsError;
    }
    
    // Reset game state - find the most recent game state and update it
    const { data: gameStateRows, error: fetchGameStateError } = await supabase
      .from('game_state')
      .select('id')
      .order('id', { ascending: false })
      .limit(1);
    
    if (fetchGameStateError) {
      console.error('Error fetching game state for reset:', fetchGameStateError);
      throw fetchGameStateError;
    }
    
    if (gameStateRows && gameStateRows.length > 0) {
      // Update existing game state
      const { error: updateError } = await supabase
        .from('game_state')
        .update({
          revealed_gender: null,
          is_revealed: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', gameStateRows[0].id);
      
      if (updateError) {
        console.error('Error updating game state during reset:', updateError);
        throw updateError;
      }
    } else {
      // Create initial game state if none exists
      const { error: insertError } = await supabase
        .from('game_state')
        .insert([{
          revealed_gender: null,
          is_revealed: false
        }]);
      
      if (insertError) {
        console.error('Error creating initial game state during reset:', insertError);
        throw insertError;
      }
    }
    
    console.log('✅ Game reset completed successfully');
    return { success: true };
  } catch (error) {
    console.error('Error resetting game:', error);
    throw new Error(`Failed to reset game: ${error.message}`);
  }
}