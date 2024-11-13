'use client'

import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { CalendarIcon, FileQuestionIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import CreateSessionDialog from '@/components/CreateSessionDialog'
import { useRouter } from 'next/navigation'
import { verifyToken } from '@/lib/api-user'

// export interface Session {
//   _id: string
//   sessionId: string
//   activeUsers: string[]
//   allUsers: string[]
//   questionAttempts: {
//     questionId: string
//     submissions: {
//       code: string
//       language: string
//       submittedAt: string
//       status: string
//     }[]
//     startedAt: string
//     currentCode: string
//     currentLanguage: string
//   }[]
//   isCompleted: boolean
//   sessionName: string
// }
export interface QuestionSubmission {
  code: string;
  language: string;
  submittedAt?: Date;
  status: 'pending' | 'accepted' | 'rejected';
  executionResults?: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    testResults: {
      testCaseNumber: number;
      input: string;
      expectedOutput: string;
      actualOutput?: string;
      passed: boolean;
      error?: string;
      compilationError?: string | null;
    }[];
  };
}

export interface QuestionAttempt {
  questionId: string;
  submissions: QuestionSubmission[];
  startedAt?: Date;
  currentCode?: string;
  currentLanguage?: string;
}

export interface Session {
  _id: string;
  sessionId: string;
  activeUsers: string[];
  allUsers: string[];
  questionAttempts: QuestionAttempt[];
  isCompleted: boolean;
  sessionName: string;
}
export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [userData, setUserData] = useState({
    username: "",
    email: "",
  });
  const [loading, setLoading] = useState(true)
  const [sessionLoading, setSessionLoading] = useState(false)
  const [userNames, setUserNames] = useState<{ [key: string]: string }>({});
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        console.error("no token")
        router.push('/login')
        return
      }
      try {
        setSessionLoading(true)
        const res = await fetch('/api/sessions', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        const data = await res.json();
        setSessions(data);
      } catch (error) {
        console.error('Error fetching sessions or user data:', error)
        router.push('/login')
      } finally {
        setSessionLoading(false)
      }
    }
    fetchUserData()
  }, [router])
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
    const fetchUserNames = async () => {
      const userIds = sessions.flatMap(session => session.activeUsers);
      const obj = userIds.reduce((acc, item) => {
        const [key, value] = item.split(":");
          if (key && value) {
              acc[key] = value;
          }
          return acc;
      }, {} as { [key: string]: string });
      
      setUserNames(obj);
      console.log(obj);
    };

    if (sessions.length > 0) {
      fetchUserNames();
    }
  }, [sessions]);
  if (loading) {
    return <div className="text-center mb-4">Loading...</div>
  }

  const filteredSessions = sessions.filter(session =>
    session.allUsers.includes(userData.username)
  ).reverse();


  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">Welcome back, {userData.username}!</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <Card className="bg-primary text-primary-foreground p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">{filteredSessions.length}</h3>
              <p className="text-sm">Coding Sessions Created</p>
            </div>
            <CalendarIcon className="w-10 h-10" />
          </div>
        </Card>
        <Card className="bg-secondary text-secondary-foreground p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">{new Set(filteredSessions.map(session => session.questionAttempts.filter(attempt => attempt.submissions.some(submission => submission.status === 'accepted')).map(attempt => attempt.questionId)).reduce((a, b) => a.concat(b), [])).size.toString()}</h3>
              <p className="text-sm">Unique Problems Solved</p>
            </div>
            <FileQuestionIcon className="w-10 h-10" />
          </div>
        </Card>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Past Coding Sessions</h2>
        <CreateSessionDialog sessions={sessions} />
      </div>
      <div className="space-y-6">
        {renderYearSessions(2024, filteredSessions, userNames, sessionLoading)}
      </div>

    </main>
  )
}
function renderYearSessions(year: number, sessions: Session[], userNames: { [key: string]: string }, sessionLoading: boolean) {
  return (
    <div key={year}>
      <h3 className="text-xl font-bold mb-4">{year}</h3>
      <div className="flex flex-col gap-2">
        {sessions.length === 0 ? (
          sessionLoading ? (
            <div className="text-center mb-4">Loading...</div>
          ) : (
            // No sessions yet
            <div>
              <p className="text-center mb-4">No sessions yet</p>
            </div>
          )
        ) : (
          sessions.map(session => {
            const uniqueQuestions = new Set(session.questionAttempts.map(attempt => attempt.questionId));
            const solvedQuestions = new Set(
              session.questionAttempts
                .filter(attempt => attempt.submissions.some(submission => submission.status === 'accepted'))
                .map(attempt => attempt.questionId)
            );
            return (
              <Link href={`/session-history/${session.sessionId}`} key={session._id}>
                <Card className="p-4 rounded-lg shadow-md cursor-pointer hover:bg-gray-50">
                  <div className="flex flex-wrap items-center justify-between gap-4 px-4">
                    <div className="flex items-center space-x-4 gap-6">
                      <div className="text-center">
                      <div className="text-2xl font-bold">{session.questionAttempts.length > 0 && session.questionAttempts[0].startedAt ? new Date(session.questionAttempts[0].startedAt).getDate() : 'N/A'}</div>
                      <div className="text-sm text-muted-foreground">{session.questionAttempts.length > 0 && session.questionAttempts[0].startedAt ? new Date(session.questionAttempts[0].startedAt).toLocaleString('default', { month: 'short' }) : 'N/A'}</div>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold">{session.sessionName}</h4>
                        <div className="text-sm text-muted-foreground">
                          {session.allUsers.join(', ')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span>{uniqueQuestions.size} Questions Attempted</span>
                      <span>{solvedQuestions.size} Solved</span>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
