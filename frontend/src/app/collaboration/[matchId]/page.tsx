'use client';

import { FC, JSX, SVGProps, useEffect, useState } from 'react';
import { Question } from "@/types/question.types";
import { io, Socket } from "socket.io-client";
import { useForm, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectItem } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from 'next/navigation';
import { executeCode, verifyToken } from '@/lib/api-user'
import CodeEditorContainer from '@/components/collaboration/code-editor-container';
import { CodeExecutionResponse } from '@/app/api/code-execution/route';


interface CollaborationPageProps {
  params: {
    matchId: string;
  };
}

interface QuestionData {
  question: Question,
  topic: string,
  difficulty: string,
}

interface MessageData {
  sender: string,
  content: string,
  timestamp: number,
}

interface OnloadData {
  question: Question,
  topic: string,
  difficulty: string,
  messages: MessageData[],
  sessionName: string,
  joinedUsers: string[],
}

interface QuestionFormData {
  topic: string;
  difficulty: string;
}

const CollaborationPage: FC<CollaborationPageProps> = ({ params }) => {
  const { matchId } = params;
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState({
    username: "",
    email: "",
  });

  const [socket, setSocket] = useState<Socket | null>(null);
  const [formError, setFormError] = useState<string | null>(null)
  const [topic, setTopic] = useState<string>("");
  const [difficulty, setDifficulty] = useState<string>("");
  const [question, setQuestion] = useState<Question | null>(null);

  const [messages, setMessages] = useState<MessageData[]>([]);
  const [messageInput, setMessageInput] = useState("");

  const [sessionName, setSessionName] = useState<string>("")
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedName, setEditedName] = useState<string>(sessionName);

  const [joinedUsers, setJoinedUsers] = useState<string[]>([]);

  const { control, handleSubmit, reset } = useForm<QuestionFormData>();
  const router = useRouter();

  const [code, setCode] = useState<string>('');
  const [language, setLanguage] = useState<string>('python');
  const [executing, setExecuting] = useState<boolean>(false);
  const [result, setResult] = useState<CodeExecutionResponse | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  interface TestResult {
    testCaseNumber: number;
    input: string;
    expectedOutput: string;
    actualOutput: string;
    passed: boolean;
    error?: string;
    compilationError?: string | null;
  }

  
  const handleExecuteCode = async (questionId: string) => {
    setExecuting(true);
    try {
      const result: CodeExecutionResponse = await executeCode({
        questionId,
        language: "python",
        code: code
      });
      setResult(result);
      setTestResults(result.testResults);
      if (result.testResults.some(test => test.error)) {
        setError(result.testResults.find(test => test.error)?.error || 'Execution failed');
      }
    } catch (error) {
      setError((error as any).message);
    } finally {
      setExecuting(false);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }
      try {
        const res = await verifyToken(token) as { data: { username: string, email: string } }
        setUserData({ username: res.data.username, email: res.data.email })
      } catch (error) {
        console.error('Token verification failed:', error)
        router.push('/login')
      }
    }

    fetchUserData()
  }, [router])

  useEffect(() => {
    if (!userData.username || !matchId) {
      return;
    }

    const newSocket = io(process.env.NEXT_PUBLIC_COLLAB_API_URL);
    setSocket(newSocket);

    newSocket.emit('joinCollabSession', { matchId: matchId, username: userData.username });

    newSocket.on("question", (data: QuestionData) => {
      if (data.question) {
        setQuestion(data.question);
        setDifficulty(data.difficulty);
        setTopic(data.topic);
        setFormError(null);
      }
    });

    newSocket.on("newQuestionError", (data: { message: string; timestamp: string }) => {
      setFormError(data.message);
    });

    newSocket.on("collabError", (data: { message: string; timestamp: string }) => {
      setError(data.message);
    });

    newSocket.on('invalidMatchId', (data: {message: string;}) => {
      // toast.error(data.message);
      alert(`${data.message}`);
      router.push('/sessions');
    })

    newSocket.on('message', (data: MessageData) => {
      setMessages((prev) => [
        ...prev, data
      ])
      if (data.sender !== userData.username) {
        console.log('new message')
        // toast(`${data.sender}: ${data.content}`, {
        //   duration: 3000,
        //   position: 'bottom-left',
        //   style: {
        //     background: '#333',
        //     color: '#fff',
        //   },
        //   icon: '💬',
        // });
      }
    })

    newSocket.on('newSessionName', (newName: string) => {
      setSessionName(newName);
      setEditedName(newName);
    });

    newSocket.on('onloadData', (data: OnloadData) => {
      if (!data.question) {
        // toast.error('No question for the selected paramters');
        alert('No question for the selected paramters');
        router.push('/sessions')
      }
      setQuestion(data.question);
      setDifficulty(data.difficulty);
      setTopic(data.topic);
      setMessages(data.messages);
      setSessionName(data.sessionName);
      setEditedName(data.sessionName);
      const uniqueUsers = Array.from(new Set(data.joinedUsers));
      setJoinedUsers(uniqueUsers);
    })

    newSocket.on('userList', (data: string[]) => {
      const uniqueUsers = Array.from(new Set(data));
      console.log(uniqueUsers);
      setJoinedUsers(uniqueUsers);
    })


    return () => {
      newSocket.disconnect();
    };
  }, [matchId, userData.username]);

  const handleSendMessage = async () => {
    if (socket) {
      const messageData = {
        sender: userData.username,
        content: messageInput,
        timestamp: Date.now(),
        matchId: matchId,
      }
      socket.emit('sendMessage', messageData)
      setMessageInput('')
    }
  }

  const onSubmit = (data: QuestionFormData) => {
    requestNewQuestion(data);
  };

  const requestNewQuestion = (data: { topic: string; difficulty: string }) => {
    if (socket) {
      socket.emit('generateNewQuestion', {
        matchId: matchId,
        topic: data.topic,
        difficulty: data.difficulty
      });
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleNameSubmit = async ()  => {
    setIsEditing(false);
    setSessionName(editedName);

    socket?.emit('updateSessionName', { newSessionName: editedName, matchId: matchId });
    try {
        const sessionId = matchId;
        const response = await fetch(`/api/sessions/${sessionId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionName: editedName }),
        });
    
        if (!response.ok) {
          const errorData = await response.json();
        }
    
      } catch (error) {
        console.error('Error updating session:', error);
    }
  };

  const handleExitSession = () => {
    const confirmExit = window.confirm('Are you sure you want to leave?');

    if (confirmExit) {
      router.push("/sessions")
    }
  }

  function PencilIcon(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
        <path d="m15 5 4 4" />
      </svg>
    )
  }

  function UsersIcon(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    )
  }

  function PlayIcon(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="6 3 20 12 6 21 6 3" />
      </svg>
    )
  }


  return (
    <div className="flex flex-col h-screen overflow-hidden relative">
      <header className="bg-background border-b flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            {isEditing ? (
              <input
                className="text-2xl font-bold border-b border-gray-500 focus:outline-none"
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onBlur={handleNameSubmit}
                autoFocus
              />
            ) : (
              <>
                <div className="text-2xl font-bold">{sessionName}</div>
                <PencilIcon
                  className="h-4 w-4 ml-1 cursor-pointer"
                  onClick={handleEditClick}
                />
              </>
            )}
            <span className="sr-only">Edit session name</span>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <Badge variant="secondary" className="text-xs">
              {topic}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                New Question
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[250px] p-4 space-y-3 text-xs">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="grid gap-2 text-xs">
                  <Label htmlFor="topic" className="text-xs">Topic</Label>
                  <Controller
                    name="topic"
                    control={control}
                    defaultValue=""
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="w-full text-xs">
                          <SelectValue placeholder="Select Topic" />
                        </SelectTrigger>
                        <SelectContent className="text-xs">
                          <SelectGroup>
                            <SelectItem value="Strings">Strings</SelectItem>
                            <SelectItem value="Algorithms">Algorithms</SelectItem>
                            <SelectItem value="Data Structures">Data Structures</SelectItem>
                            <SelectItem value="Bit Manipulation">Bit Manipulation</SelectItem>
                            <SelectItem value="Recursion">Recursion</SelectItem>
                            <SelectItem value="Databases">Databases</SelectItem>
                            <SelectItem value="Arrays">Arrays</SelectItem>
                            <SelectItem value="Brainteaser">Brainteaser</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="grid gap-2 text-xs">
                  <Label htmlFor="difficulty" className="text-xs mt-2">Difficulty</Label>
                  <Controller
                    name="difficulty"
                    control={control}
                    defaultValue=""
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="w-full text-xs">
                          <SelectValue placeholder="Select Difficulty" />
                        </SelectTrigger>
                        <SelectContent className="text-xs">
                          <SelectGroup>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="hard">Hard</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {formError && <p className="text-red-500 text-xs mt-2">{formError}</p>}
                </div>
                <div className="w-full flex justify-end mt-2">
                  <Button type="submit" className="w-fit px-4 text-sm">Search</Button>
                </div>
              </form>
            </PopoverContent>
          </Popover>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <UsersIcon className="h-4 w-4" />
                <span className="sr-only">View Members</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Session Members</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {joinedUsers.map((user, index) => (
                <DropdownMenuItem key={index}>
                  <Avatar className="mr-2">
                    <AvatarFallback>{user.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span>{user}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="destructive" size="sm" onClick={handleExitSession}>
            Exit Session
          </Button>
        </div>
      </header>
      <div className="flex-1 grid grid-cols-2 gap-4 p-6 pt-4 overflow-hidden h-full">
        <Tabs defaultValue="question" className="flex flex-col pb-1 overflow-hidden">
          <TabsList className="w-fit">
            <TabsTrigger value="question">Question</TabsTrigger>
            {/* <TabsTrigger value="attempts">Attempts</TabsTrigger> */}
            <TabsTrigger value="feedback">Chat</TabsTrigger>
          </TabsList>
          <TabsContent value="question" className="flex-1 h-full overflow-hidden pb-1">
            <Card className="flex flex-col mt-1 mb-4 h-full overflow-hidden">
              <div className="space-y-4 p-2 overflow-auto">
                <CardHeader className="p-4">
                  <CardTitle className="text-2xl font-bold mb-2">{question?.title}</CardTitle>
                  <div className="text-base space-y-4">
                    {question?.description}
                  </div>
                </CardHeader>
              </div>
            </Card>
          </TabsContent>
          <TabsContent value="feedback" className="flex-1 pb-1 h-full overflow-hidden">
            <Card className="p-2 mt-1 h-full overflow-hidden">
              <div className="space-y-4 p-4 flex flex-col h-full overflow-hidden">
                <div className="flex-1 overflow-y-auto">
                  {messages.map((msg, index) => (
                    <div key={index} className="flex items-start gap-4 mb-2">
                      <Avatar className="w-10 h-10 border">
                        <AvatarFallback>{msg.sender.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="grid gap-1">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold">{msg.sender}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        <div className="text-sm">{msg.content}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-neutral-200 border rounded-md p-2 w-full h-[150px] flex flex-col">
                  <Textarea
                    placeholder="Type your message here..."
                    className="w-full rounded-md border border-muted px-4 py-2 text-sm flex-grow"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                  />
                  <div className="flex justify-end mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-black text-white"
                      onClick={handleSendMessage}
                    >
                      Send
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
        <div className="flex flex-col h-full overflow-hidden">
          <CodeEditorContainer sessionId={matchId} questionId={question?._id} userData={userData} />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 z-50">
      </div>
    </div>
  )
}

export default CollaborationPage;
