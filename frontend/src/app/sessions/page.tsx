'use client'

import React, { useEffect, useState } from 'react'
import { CalendarIcon, ClockIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import CreateSessionDialog from '@/components/CreateSessionDialog'
import { useRouter } from 'next/navigation'
import { verifyToken } from '@/lib/api-user'

export interface Session {
  id: number
  date: string
  title: string
  participants: string[]
  duration: string
  questions: number | string
  solved: number | string
}

const sessions: Session[] = []

export default function SessionsPage() {

  const [userData, setUserData] = useState({
    username: "",
    email: "",
  });
  const [loading, setLoading] = useState(true)
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }
      try {
        const res = await verifyToken(token)
        setUserData({ username: res.data.username, email: res.data.email })
        setLoading(false)
      } catch (error) {
        console.error('Token verification failed:', error)
        router.push('/login') 
      }
    }

    fetchUserData()
  }, [router])

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">Welcome back, {userData.username}!</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <Card className="bg-primary text-primary-foreground p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">{sessions.length}</h3>
              <p className="text-sm">Coding Sessions Created</p>
            </div>
            <CalendarIcon className="w-10 h-10" />
          </div>
        </Card>
        <Card className="bg-secondary text-secondary-foreground p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">-</h3>
              <p className="text-sm">Hours Practiced</p>
            </div>
            <ClockIcon className="w-10 h-10" />
          </div>
        </Card>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Past Coding Sessions</h2>
        <CreateSessionDialog sessions={sessions} />
      </div>
      <div className="space-y-6">
        {renderYearSessions(2024, sessions)}
      </div>
    </main>
  )
}

function renderYearSessions(year: number, sessions: Session[]) {
  return (
    <div key={year}>
      <h3 className="text-xl font-bold mb-4">{year}</h3>
      <div className="space-y-4">
        {sessions.length === 0 ? (
          <div>
            <p className="text-center mb-4">No sessions yet</p>
          </div>
        ) : (
          sessions.map(session => (
            <Card key={session.id} className="p-4 rounded-lg shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-4 px-4">
                <div className="flex items-center space-x-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{session.date.split(' ')[0]}</div>
                    <div className="text-sm text-muted-foreground">{session.date.split(' ')[1]}</div>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold">{session.title}</h4>
                    <div className="text-sm text-muted-foreground">{session.participants.join(', ')}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span>{session.duration} Hours Practiced</span>
                  <span>{session.questions} Questions Attempted</span>
                  <span>{session.solved} Solved</span>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}