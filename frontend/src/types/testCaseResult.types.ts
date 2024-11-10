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