// app/api/debug-db/route.js
import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check environment variables
    const envCheck = {
      POSTGRES_URL: !!process.env.POSTGRES_URL,
      POSTGRES_URL_length: process.env.POSTGRES_URL?.length || 0,
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
    };

    console.log('Environment check:', envCheck);

    // Try to connect to database
    console.log('Attempting database connection...');
    const result = await sql`SELECT 1 as test`;
    
    console.log('Database connection successful');
    
    return NextResponse.json({
      status: 'success',
      message: 'Database connection working',
      envCheck,
      testQuery: result.rows[0]
    });
    
  } catch (error) {
    console.error('Database connection error:', error);
    
    return NextResponse.json({
      status: 'error',
      message: error.message,
      envCheck: {
        POSTGRES_URL: !!process.env.POSTGRES_URL,
        POSTGRES_URL_length: process.env.POSTGRES_URL?.length || 0,
        NODE_ENV: process.env.NODE_ENV,
      },
      errorDetails: {
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 3) // First 3 lines only
      }
    }, { status: 500 });
  }
}