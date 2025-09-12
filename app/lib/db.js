import { sql } from '@vercel/postgres';

let isInitialized = false;

async function initializeDatabase() {
  if (isInitialized) return;
  
  try {
    console.log('🔧 Initializing database...');
    
    // Debug: Check if POSTGRES_URL is available
    console.log('POSTGRES_URL exists:', !!process.env.POSTGRES_URL);
    if (process.env.POSTGRES_URL) {
      console.log('POSTGRES_URL length:', process.env.POSTGRES_URL.length);
    } else {
      console.log('Available POSTGRES env vars:', Object.keys(process.env).filter(key => key.includes('POSTGRES')));
    }
    
    // Create bets table
    await sql`
      CREATE TABLE IF NOT EXISTS bets (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        gender VARCHAR(10) NOT NULL CHECK (gender IN ('boy', 'girl')),
        amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Bets table ready');

    // Create game_state table
    await sql`
      CREATE TABLE IF NOT EXISTS game_state (
        id SERIAL PRIMARY KEY,
        revealed_gender VARCHAR(10) CHECK (revealed_gender IN ('boy', 'girl')),
        is_revealed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Game state table ready');

    // Insert initial game state if doesn't exist
    const { rowCount } = await sql`
      INSERT INTO game_state (is_revealed) 
      SELECT FALSE
      WHERE NOT EXISTS (SELECT 1 FROM game_state)
      RETURNING id
    `;
    
    if (rowCount > 0) {
      console.log('✅ Initial game state created');
    } else {
      console.log('ℹ️ Game state already exists');
    }

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_bets_gender ON bets(gender)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_bets_created_at ON bets(created_at)`;
    console.log('✅ Indexes ready');

    isInitialized = true;
    console.log('🎉 Database initialization completed');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    isInitialized = false;
    
    // Provide helpful error messages
    if (error.message.includes('fetch failed')) {
      throw new Error(`Database connection failed: POSTGRES_URL might be invalid or database server unreachable. Check your Vercel project settings.`);
    }
    
    if (error.message.includes('missing_connection_string')) {
      throw new Error(`Database connection failed: POSTGRES_URL environment variable is missing. Run 'vercel env pull .env.development.local' to get your environment variables.`);
    }
    
    throw error;
  }
}

export async function getAllBets() {
  try {
    await initializeDatabase();
    const { rows } = await sql`
      SELECT id, name, gender, amount, created_at 
      FROM bets 
      ORDER BY created_at DESC
    `;
    return rows;
  } catch (error) {
    console.error('Error fetching bets:', error);
    
    // Return empty array if tables don't exist yet
    if (error.message.includes('does not exist')) {
      console.log('Tables not initialized yet, returning empty array');
      return [];
    }
    
    throw new Error(`Failed to fetch bets: ${error.message}`);
  }
}

export async function addBet(name, gender, amount) {
  try {
    await initializeDatabase();
    const { rows } = await sql`
      INSERT INTO bets (name, gender, amount) 
      VALUES (${name}, ${gender}, ${amount})
      RETURNING id, name, gender, amount, created_at
    `;
    return rows[0];
  } catch (error) {
    console.error('Error adding bet:', error);
    throw new Error(`Failed to add bet: ${error.message}`);
  }
}

export async function deleteBet(id) {
  try {
    await initializeDatabase();
    await sql`DELETE FROM bets WHERE id = ${id}`;
    return { success: true };
  } catch (error) {
    console.error('Error deleting bet:', error);
    throw new Error(`Failed to delete bet: ${error.message}`);
  }
}

export async function getGameState() {
  try {
    await initializeDatabase();
    const { rows } = await sql`
      SELECT revealed_gender, is_revealed 
      FROM game_state 
      ORDER BY id DESC 
      LIMIT 1
    `;
    
    // Return default state if no rows found
    return rows[0] || { revealed_gender: null, is_revealed: false };
  } catch (error) {
    console.error('Error fetching game state:', error);
    
    // Return default state if tables don't exist yet
    if (error.message.includes('does not exist')) {
      console.log('Game state table not ready yet, returning default state');
      return { revealed_gender: null, is_revealed: false };
    }
    
    throw new Error(`Failed to fetch game state: ${error.message}`);
  }
}

export async function updateGameState(revealedGender, isRevealed) {
  try {
    await initializeDatabase();
    
    // First check if game_state has any rows
    const { rows: existingRows } = await sql`SELECT id FROM game_state LIMIT 1`;
    
    if (existingRows.length === 0) {
      // Insert first row
      await sql`
        INSERT INTO game_state (revealed_gender, is_revealed)
        VALUES (${revealedGender}, ${isRevealed})
      `;
    } else {
      // Update existing row
      await sql`
        UPDATE game_state 
        SET revealed_gender = ${revealedGender}, 
            is_revealed = ${isRevealed},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = (SELECT id FROM game_state ORDER BY id DESC LIMIT 1)
      `;
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
    
    // Delete all bets
    await sql`DELETE FROM bets`;
    
    // Reset game state
    await sql`
      UPDATE game_state 
      SET revealed_gender = NULL, 
          is_revealed = FALSE,
          updated_at = CURRENT_TIMESTAMP
    `;
    
    return { success: true };
  } catch (error) {
    console.error('Error resetting game:', error);
    throw new Error(`Failed to reset game: ${error.message}`);
  }
}