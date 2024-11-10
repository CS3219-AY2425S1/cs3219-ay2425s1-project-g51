
import { NextResponse } from 'next/server';
 
export async function POST(
  request: Request,
  { params }: { params: { sessionId: string; questionId: string } }
) {
  try {
    console.log('Fetching submission data:', params);
    // Validate parameters
    const { sessionId, questionId } = params;
    
    if (!sessionId || !questionId) {
      return NextResponse.json(
        { error: 'Session ID and Question ID are required' },
        { status: 400 }
      );
    }

    // Fetch submission data
    const response = await fetch(
      `http://localhost:3006/submissions/${sessionId}/${questionId}`
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch submission data' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Return successful response
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching submission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}