import React, { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import MonacoEditor from '@monaco-editor/react';
import { debounce } from 'lodash';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PlayIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast"

interface CodeEditorProps {
  sessionId?: string;
  questionId?: string;
  initialLanguage?: string;
}

const CodeEditorContainer = ({ sessionId, questionId, initialLanguage = 'javascript' }: CodeEditorProps) => {
  const socket = useRef<Socket | null>(null);
  const [code, setCode] = useState<string>('');
  const [language, setLanguage] = useState(initialLanguage);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  // Initialize socket connection
  useEffect(() => {
    if (!sessionId || !questionId) {
      return;
    }
    if (socket.current && socket.current.connected) {
      socket.current.disconnect();
    }

    const socketInstance = io(process.env.NEXT_PUBLIC_CODE_ARENA_API_URL, {
      query: {
        sessionId,
        questionId,
      },
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      toast({
        title: "Connected",
        description: "Successfully connected to the coding session",
      });
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      toast({
        variant: "destructive",
        title: "Disconnected",
        description: "Lost connection to the server",
      });
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

    socketInstance.on('submissionMade', ({ timestamp }) => {
      toast({
        title: "Code Submitted",
        description: `Submission recorded at ${new Date(timestamp).toLocaleTimeString()}`,
      });
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
              <SelectItem value="java">Java</SelectItem>
              <SelectItem value="cpp">C++</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <Button 
          variant="outline" 
          size="default" 
          className="bg-black text-white"
          onClick={handleSubmit}
          disabled={!isConnected}
        >
          <PlayIcon className="h-4 w-4 mr-2" />
          Run Code
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
    </>
  );
};

export default CodeEditorContainer;