'use client'

import React, { useEffect, useState } from 'react'
import { Card } from "@/components/ui/card"
import { CheckIcon } from 'lucide-react'

interface QuestionStats {
  totalQuestions: number
  // Add more stats as needed
}

interface QuestionStatsProps {
  statsPromise: Promise<QuestionStats>
}

export default function QuestionStats({ statsPromise }: QuestionStatsProps) {
  const [stats, setStats] = useState<QuestionStats | null>(null)

  useEffect(() => {
    statsPromise.then(setStats)
  }, [statsPromise])

  if (!stats) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
      <Card className="bg-accent text-accent-foreground p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold">{stats.totalQuestions}</h3>
            <p className="text-sm">Total Questions</p>
          </div>
          <CheckIcon className="w-10 h-10" />
        </div>
      </Card>
      {/* Add more stat cards as needed */}
    </div>
  )
}