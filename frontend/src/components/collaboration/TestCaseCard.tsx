import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface TestCase {
  input: string;
  expectedOutput: string;
}

interface TestResult {
  testCaseNumber: number;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  error?: string;
  compilationError?: string | null;
}

interface TestCaseProps {
  questionId?: string;
  testResults: TestResult[];
}

const DynamicTestCases = ({ questionId, testResults }: TestCaseProps) => {
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTestCases = async () => {
      try {
        const response = await fetch(`/api/questions/${questionId}`);
        if (!response.ok) throw new Error('Failed to fetch test cases');
        const data = await response.json();
        setTestCases(data.testCases || []);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    if (questionId) {
      fetchTestCases();
    } else {
      setLoading(false);
    }
  }, [questionId]);

  if (loading) {
    return (
      <Card className="h-1/2 max-h-[50vh] overflow-auto pb-4 mb-1">
        <CardHeader className="pb-1 pt-4">
          <div className="h-6 w-32 bg-gray-200 animate-pulse rounded" />
        </CardHeader>
        <CardContent className="flex-1 overflow-auto py-0">
          <div className="space-y-4">
            <div className="h-8 w-full bg-gray-200 animate-pulse rounded" />
            <div className="h-32 w-full bg-gray-200 animate-pulse rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-[600px] max-h-[50vh] overflow-auto pb-4 mb-1">
        <CardHeader className="pb-1 pt-4 text-red-500">Error Loading Test Cases</CardHeader>
        <CardContent>{error}</CardContent>
      </Card>
    );
  }

  const hasRunResults = testResults.length > 0;
  
  if (!testCases.length) {
    return (
      <Card className="h-[600px] max-h-[50vh] overflow-auto pb-4 mb-1">
        <CardHeader className="pb-1 pt-4 font-bold text-xl">Test Cases</CardHeader>
        <CardContent className="flex-1 overflow-auto py-0">
          {!hasRunResults && (
            <div className="text-gray-500 text-center py-4">
              No test cases available
            </div>
          )}
          {hasRunResults && (
            <Card>
              <CardContent className="flex flex-col gap-4 p-4">
                <div>
                  <CardDescription className="font-medium text-sm mb-1">Latest Run Output</CardDescription>
                  <pre className="bg-muted p-2 rounded-md overflow-auto">{testResults[0].actualOutput}</pre>
                </div>
                {testResults[0].error && (
                  <div>
                    <CardDescription className="font-medium text-sm mb-1 text-red-500">Error</CardDescription>
                    <pre className="bg-red-50 text-red-500 p-2 rounded-md overflow-auto">{testResults[0].error}</pre>
                  </div>
                )}
                {testResults[0].compilationError && (
                  <div>
                    <CardDescription className="font-medium text-sm mb-1 text-red-500">Compilation Error</CardDescription>
                    <pre className="bg-red-50 text-red-500 p-2 rounded-md overflow-auto">{testResults[0].compilationError}</pre>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[600px] max-h-[50vh] overflow-auto pb-4 mb-1">
      <CardHeader className="pb-1 pt-4 font-bold text-xl">Test Cases</CardHeader>
      <CardContent className="flex-1 overflow-auto py-0">
        <Tabs defaultValue={`test-case-0`}>
          <TabsList className="flex gap-2 justify-start w-fit">
            {testCases.map((_, index) => (
              <TabsTrigger key={index} value={`test-case-${index}`}>
                <div className="flex items-center gap-2">
                  <div 
                    className={`h-2 w-2 rounded-full ${
                      testResults[index]?.error || testResults[index]?.compilationError ? 'bg-red-500' :
                      testResults[index]?.passed ? 'bg-green-500' : 'bg-gray-500'
                    }`} 
                  />
                  Case {index + 1}
                </div>
              </TabsTrigger>
            ))}
          </TabsList>
          
          {testCases.map((testCase, index) => (
            <TabsContent key={index} value={`test-case-${index}`}>
              <Card>
                <CardContent className="flex flex-col gap-4 p-4">
                  <div>
                    <CardDescription className="font-medium text-sm mb-1">Input</CardDescription>
                    <pre className="bg-muted p-2 rounded-md overflow-auto">{testCase.input}</pre>
                  </div>
                  
                  {testResults[index] && (
                    <div>
                      <CardDescription className="font-medium text-sm mb-1">Output</CardDescription>
                      <pre className="bg-muted p-2 rounded-md overflow-auto">{testResults[index].actualOutput}</pre>
                    </div>
                  )}
                  
                  <div>
                    <CardDescription className="font-medium text-sm mb-1">Expected Output</CardDescription>
                    <pre className="bg-muted p-2 rounded-md overflow-auto">{testCase.expectedOutput}</pre>
                  </div>
                  
                  {testResults[index]?.error && (
                    <div className="col-span-2">
                      <CardDescription className="font-medium text-sm mb-1 text-red-500">Error</CardDescription>
                      <pre className="bg-red-50 text-red-500 p-2 rounded-md overflow-auto">{testResults[index].error}</pre>
                    </div>
                  )}
                  
                  {testResults[index]?.compilationError && (
                    <div className="col-span-2">
                      <CardDescription className="font-medium text-sm mb-1 text-red-500">Compilation Error</CardDescription>
                      <pre className="bg-red-50 text-red-500 p-2 rounded-md overflow-auto">{testResults[index].compilationError}</pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DynamicTestCases;