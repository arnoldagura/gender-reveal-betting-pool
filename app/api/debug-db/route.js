// app/api/debug-env/route.js
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const envCheck = {
      // Check for all possible Postgres environment variables
      POSTGRES_URL: process.env.POSTGRES_URL,
      POSTGRES_URL_length: process.env.POSTGRES_URL?.length || 0,
      POSTGRES_URL_NON_POOLING: process.env.POSTGRES_URL_NON_POOLING,
      POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL,
      POSTGRES_USER: process.env.POSTGRES_USER,
      POSTGRES_HOST: process.env.POSTGRES_HOST,
      POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD,
      POSTGRES_DATABASE: process.env.POSTGRES_DATABASE,
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      
      // List all environment variables that contain 'POSTGRES'
      allPostgresVars: Object.keys(process.env).filter(key => 
        key.includes('POSTGRES')
      ),
      
      // Check if we're in Vercel environment
      isVercel: !!process.env.VERCEL,
    };

    console.log('Environment check:', envCheck);
    
    return NextResponse.json({
      status: 'success',
      message: 'Environment variables check',
      envCheck
    });
    
  } catch (error) {
    console.error('Environment check error:', error);
    
    return NextResponse.json({
      status: 'error',
      message: error.message,
      errorDetails: {
        name: error.name,
        message: error.message,
      }
    }, { status: 500 });
  }
}