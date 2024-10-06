import { Suspense } from 'react'
import { QuestionCategory, QuestionComplexity } from '@/types/question.types'
import AddQuestionButton from '@/components/AddQuestionButton'
import QuestionList from '@/components/QuestionList'
import QuestionStats from '@/components/QuestionStats'
import { Loader2 } from 'lucide-react'

async function getQuestions() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/questions`, { cache: 'no-store' })
  if (!res.ok || res.status !== 200) {
    throw new Error('Failed to fetch questions')
  }
  return res.json()
}

// async function getQuestionStats() {
//   return { totalQuestions: 100 }
// }

export default async function QuestionsPage() {
  const questionsPromise = getQuestions()
  // const statsPromise = getQuestionStats()

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* TODO: Add the below component for user side */}
      {/* <Suspense fallback={<Loader2 className="animate-spin h-6 w-6" />}>
        <QuestionStats statsPromise={statsPromise} />
      </Suspense> */}
      
      <Suspense fallback={<Loader2 className="animate-spin h-6 w-6" />}>
        <QuestionList questionsPromise={questionsPromise} />
      </Suspense>
    </main>
  )
}