import { NextResponse } from 'next/server';

const CODE_EXECUTION_SERVICE_URL = process.env.NEXT_PUBLIC_CODE_EXECUTION_SERVICE_URL || 'http://localhost:9001';

export interface CodeExecutionResponse {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  testResults: Array<{
    testCaseNumber: number;
    input: string;
    expectedOutput: string;
    actualOutput: string;
    passed: boolean;
    error?: string;
    compilationError?: string | null;
  }>;
}

export interface ExecuteCodeParams {
  sessionId?: string;
  questionId: string;
  language: string;
  code: string;
  stdin?: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as ExecuteCodeParams;
    const { sessionId, questionId, language, code, stdin } = body;

    if (!questionId || !language || !sessionId) {
      return NextResponse.json(
        { error: 'Question ID or Language or sessionId is required' },
        { status: 400 }
      );
    }

    console.log('Executing code:', { questionId, language, code, stdin, sessionId });

    await fetch(CODE_EXECUTION_SERVICE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId,
        questionId,
        language,
        code,
        stdin,
      })
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Code execution failed:', error);
    return NextResponse.json(
      { error: 'Failed to execute code' },
      { status: 500 }
    );
  }
}
