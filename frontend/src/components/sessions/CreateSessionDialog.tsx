'use client'

import React, { useEffect, useState } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { CheckCircle2, PlusIcon, Timer, XCircle } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Socket, io } from "socket.io-client";
import { verifyToken } from "@/lib/api-user";
import { Session } from "@/app/sessions/page";

interface FormData {
  difficulty: string;
  topic: string;
}

interface MatchRequest {
  userId: string;
  topic: string;
  difficulty: string;
  timestamp: number;
}

interface MatchResult {
  success: boolean;
  message: string;
  peerUserId?: string;
  difficulty?: string;
  matchId?: string;
}

interface CreateSessionDialogProps {
  sessions: Session[]
}


type Status = 'idle' | 'loading' | 'error' | 'success';

export default function CreateSessionDialog({ sessions }: CreateSessionDialogProps): JSX.Element {
  const router = useRouter();
  const { control, handleSubmit, watch, reset } = useForm<FormData>({
    defaultValues: {
      difficulty: '',
      topic: ''
    }
  });

  const difficulty = watch('difficulty');
  const topic = watch('topic');
  const isFormValid = !!difficulty && !!topic;
  const [status, setStatus] = useState<Status>('idle');
  const [timer, setTimer] = useState<number | null>(null);
  const [redirectTimer, setRedirectTimer] = useState<number | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [matchedUser, setMatchedUser] = useState<string>('');
  const [matchId, setMatchId] = useState<string>('');
  const [difficultyMatched, setDifficultyMatched] = useState<string>('');
  const [userData, setUserData] = useState({
    username: "",
    email: "",
  });
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }
      try {
        const res: any = await verifyToken(token)
        setUserData({ username: res.data.username, email: res.data.email })
        setLoading(false)
      } catch (error) {
        console.error('Token verification failed:', error)
        router.push('/login') 
      }
    }

    fetchUserData()
  }, [router])

  useEffect(() => {
    const newSocket = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL);

    setSocket(newSocket);

    newSocket.on('cancelAcknowledged', (data: { message: string; timestamp: string }) => {
      resetState();
    });

    newSocket.on('matchError', (data: { message: string; timestamp: string }) => {
      setTimer(null);
      setErrorMessage(data.message);
      setStatus('error');
    });

    newSocket.on('matchResult', (data: MatchResult) => {
      if (data.success && data.peerUserId && data.difficulty) {
        setStatus('success');
        setRedirectTimer(5);
        setMatchedUser(data.peerUserId);
        setDifficultyMatched(data.difficulty)
        if (data.matchId) {
          setMatchId(data.matchId);
        }

        const date = new Date();
        const formattedDate = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        // sessions.push({
        //   id: sessions.length + 1,
        //   date: formattedDate,
        //   title: 'Coding Session',
        //   participants: [userData.username, data.peerUserId],
        //   duration: '-',
        //   questions: 0,
        //   solved: 0
        // })
        sessions.push({
          _id: (sessions.length + 1).toString(),
          sessionId: (sessions.length + 1).toString(),
          activeUsers: [userData.username, data.peerUserId],
          allUsers: [userData.username, data.peerUserId],
          questionAttempts: [],
          isCompleted: false,
          sessionName: 'Coding Session'
        })
      } else if (!data.success) {
        setTimer(null);
        setErrorMessage(data.message);
        setStatus('error');
      } else {
        setStatus('idle');
        setTimer(null);
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [userData]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer !== null && timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => (prevTimer !== null ? prevTimer - 1 : null));
      }, 975);
    } else if (timer === 0) {
      setStatus('error');
    }
    return () => clearInterval(interval);
  }, [timer]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (redirectTimer !== null && redirectTimer >= 0) {
      interval = setInterval(() => {
        setRedirectTimer((prevTimer) => {
          if (prevTimer === null) return null;
          if (prevTimer <= 0) {
            setShouldRedirect(true);
            return null;
          }
          return prevTimer - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [redirectTimer]);

  useEffect(() => {
    if (shouldRedirect) {
      router.push(
        `/collaboration/${matchId}`
      );
    }
  }, [shouldRedirect, router, matchId]);

  const resetState = () => {
    setStatus('idle');
    setTimer(null);
    setRedirectTimer(null);
    setShouldRedirect(false);
    reset({
      difficulty: '',
      topic: ''
    });
  };

  const handleCreateSession = (data: FormData) => {
    setStatus('loading');
    setTimer(30);
    const matchRequest: MatchRequest = {
      userId: userData.username,
      topic: data.topic,
      difficulty: data.difficulty,
      timestamp: Date.now()
    };
    socket?.emit('requestMatch', matchRequest);
  };

  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const handleCancel = () => {
    if (status === 'loading') {
      socket?.emit('cancelMatch', { userId: userData.username });
    }
    resetState();
  };

  return (
    <>
      <Dialog onOpenChange={resetState}>
        <DialogTrigger asChild>
          <Button>
            <PlusIcon className="w-4 h-4 mr-2" />
            Create Session
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Coding Interview Prep</DialogTitle>
            <DialogDescription>Find a partner to practice coding interviews with.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleCreateSession)}>
            <div className="grid gap-4 p-4 pb-2">
              <div className="grid gap-2">
                <Label htmlFor="difficulty">Question Difficulty</Label>
                <Controller
                  name="difficulty"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="topic">Question Topic</Label>
                <Controller
                  name="topic"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select topic" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="strings">Strings</SelectItem>
                        <SelectItem value="algorithms">Algorithms</SelectItem>
                        <SelectItem value="data-structures">Data Structures</SelectItem>
                        <SelectItem value="bit-manipulation">Bit Manipulation</SelectItem>
                        <SelectItem value="recursion">Recursion</SelectItem>
                        <SelectItem value="databases">Databases</SelectItem>
                        <SelectItem value="arrays">Arrays</SelectItem>
                        <SelectItem value="brainteaser">Brainteaser</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          </form>
          <DialogFooter className="flex justify-center gap-2 p-4">
            {status === 'loading' ? (
              <Button variant="outline" className="flex-1" onClick={handleCancel}>
                <XCircle className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            ) : (
              <DialogClose asChild>
                <Button variant="outline" className="flex-1" disabled={status === 'success'}>Close</Button>
              </DialogClose>
            )}
            <Button 
              type="submit" 
              className="flex-1 px-4 py-2" 
              onClick={handleSubmit(handleCreateSession)} 
              disabled={status === 'loading' || !isFormValid || status === 'success'}
            >
              {status === 'loading' ? (
                <>
                  Finding Match ({timer}s)
                  <div className="ml-2 animate-spin" />
                </>
              ) : status === 'error' ? (
                'Try Again'
              ) : (
                'Create Session'
              )}
            </Button>
          </DialogFooter>
          {status === 'error' && (
            <div className="p-2 text-center text-red-500">
              {errorMessage || "Failed to find a match. Please try again."}
            </div>
          )}
          {status === 'success' && (
            <div className="mt-2 p-4 rounded-lg border border-black">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle2 className="w-4 h-4 mr-1" />
                <span className="font-medium">Match Found!</span>
              </div>
              <div className="text-center space-y-1">
                <p className="">
                  Matched with: <span className="font-semibold">{matchedUser}</span>
                </p>
                <p className="">
                  Difficulty: <span className="font-semibold">{capitalizeFirstLetter(difficultyMatched)}</span>
                </p>
                <p className="">
                  Topic: <span className="font-semibold">{capitalizeFirstLetter(topic.replace('-', ' '))}</span>
                </p>
                <div className="flex items-center justify-center mt-2">
                  <Timer className="w-4 h-4 mr-1" />
                  <span>Starting session in {redirectTimer} seconds...</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}