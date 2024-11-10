"use client";
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import MonacoEditor from '@monaco-editor/react';
import { debounce } from 'lodash';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PlayIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast"
import DynamicTestCases from '../TestCaseCard';
import { CodeExecutionResponse } from '@/app/api/code-execution/route';
import { executeCode } from '@/lib/api-user';
import { useRouter } from 'next/navigation';


interface CodeEditorProps {
  sessionId?: string;
  questionId?: string;
  userData?: { username: string; email: string; };
  initialLanguage?: string;
}

const CodeEditorContainer = ({ sessionId, questionId, userData, initialLanguage = 'javascript' }: CodeEditorProps) => {
  const socket = useRef<Socket | null>(null);
  const [code, setCode] = useState<string>('');
  const [language, setLanguage] = useState(initialLanguage);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  const [executing, setExecuting] = useState<boolean>(false);
  // const [result, setResult] = useState<CodeExecutionResponse | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  interface TestResult {
    testCaseNumber: number;
    input: string;
    expectedOutput: string;
    actualOutput: string;
    passed: boolean;
    error?: string;
    compilationError?: string | null;
  }

  
  const handleExecuteCode = async (questionId?: string) => {
    if (!isConnected) {
      toast({
        variant: "destructive",
        title: "Cannot Submit",
        description: "Please wait until you're connected to the server",
      });
      return;
    }

    if (socket.current?.connected) {
      socket.current.emit('submitCode', {
        sessionId,
        questionId,
        code,
        language,
      });
    }
    try {
      if (!questionId) {
        throw new Error('Question ID is required');
      }
      const result: CodeExecutionResponse = await executeCode({
        sessionId,
        questionId,
        language: language,
        code: code
      });
      
    } catch (error: any) {
      setError((error).message);
    } finally {
    }
  };

  useEffect(() => {
    if (!sessionId || !questionId || !userData || !userData.username) {
      return;
    }
    if (socket.current && socket.current.connected) {
      socket.current.disconnect();
    }

    const socketInstance = io(process.env.NEXT_PUBLIC_CODE_ARENA_API_URL, {
      query: {
        sessionId,
        questionId,
        username: userData.username,
      },
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      toast({
        title: "Connected",
        description: "Successfully connected to the coding session",
      });
      setCode('');
      setLanguage(initialLanguage);
      setTestResults([]);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    socketInstance.on('error', (errorMessage: string) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    });

    socketInstance.on('codeChange', ({ code: newCode, language: newLanguage }) => {
      setCode(newCode);
      setLanguage(newLanguage);
    });

    socketInstance.on('submissionMade', async ({ timestamp }) => {
      toast({
        title: "Code Submitted",
        description: `Submission recorded at ${new Date(timestamp).toLocaleTimeString()}`,
      });
      setExecuting(true);
    });

    socketInstance.on('submissionResults', ({status, executionResults }) => {
      console.log("executionResults: ", executionResults, status);
      if (executionResults?.testResults) {
        setTestResults(executionResults.testResults);
      }

      // Show appropriate toast based on status
      if (status === 'accepted') {
        toast(
          {
            title: "Accepted",
            description: `All ${executionResults.totalTests} tests passed successfully!`
          }
        );
      } else if (status === 'rejected') {
        toast(
          {
            variant: "destructive",
            title: "Rejected",
            description:
          `${executionResults.failedTests} of ${executionResults.totalTests} tests failed`
          }
        );
      }
      setExecuting(false);
    });

    socket.current = socketInstance;

    return () => {
      socketInstance.disconnect();
    };
  }, [sessionId, questionId, toast]);

  // Debounced code change handler
  const debouncedCodeChange = useCallback(
    debounce((newCode: string, newLanguage: string) => {
      if (socket.current?.connected) {
        socket.current.emit('codeChange', {
          sessionId,
          questionId,
          code: newCode,
          language: newLanguage,
        });
      }
    }, 400),
    [socket, sessionId, questionId]
  );

  // Handle code changes
  const handleCodeChange = (newCode: string | undefined) => {
    if (newCode !== undefined) {
      setCode(newCode);
      debouncedCodeChange(newCode, language);
    }
  };

  // Handle language changes
  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    debouncedCodeChange(code, newLanguage);
  };

  // Handle code submission
  const handleSubmit = () => {
    if (!isConnected) {
      toast({
        variant: "destructive",
        title: "Cannot Submit",
        description: "Please wait until you're connected to the server",
      });
      return;
    }

    if (socket.current?.connected) {
      socket.current.emit('submitCode', {
        sessionId,
        questionId,
        code,
        language,
      });
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <Select value={language} onValueChange={handleLanguageChange}>
          <SelectTrigger className="w-[180px] focus:ring-0 focus:ring-transparent focus:ring-offset-0">
            <SelectValue placeholder="Select Language" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="javascript">JavaScript</SelectItem>
              <SelectItem value="python">Python</SelectItem>
              <SelectItem value="cpp">C++</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <Button 
          variant="outline" 
          size="default" 
          className="bg-black text-white"
          // onClick={handleSubmit}
          onClick={() => handleExecuteCode(questionId)} 
          disabled={!isConnected || executing}
        >
          <PlayIcon className="h-4 w-4 mr-2" />
          {executing ? 'Running...' : 'Run Code'}
        </Button>
      </div>

      <Card className="h-1/2 max-h-[60vh] overflow-hidden my-3">
        <MonacoEditor
          height="100%"
          language={language}
          value={code}
          onChange={handleCodeChange}
          theme="vs-light"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
      </Card>
      <DynamicTestCases
            questionId={questionId} 
            testResults={testResults}
      />
    </>
  );
};

export default CodeEditorContainer;