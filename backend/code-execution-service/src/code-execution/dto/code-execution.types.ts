export interface TestCaseResult {
    testCaseNumber: number;
    input: string;
    expectedOutput: string;
    actualOutput: string;
    passed: boolean;
    error?: string;
    compilationError?: string | null;
    executionTime?: number | null;
    memoryUsage?: number | null;
  }
  
  export interface CodeExecutionResult {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    testResults: TestCaseResult[];
  }
  