import { Suspense } from 'react'
import QuestionList from '@/components/questions/QuestionList'
import { Loader2 } from 'lucide-react'


async function getQuestions() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_QUESTION_API_URL}/questions`, { cache: 'no-store' })
  if (!res.ok || res.status !== 200) {
    throw new Error('Failed to fetch questions')
  }
  return res.json()
}

export default async function QuestionsPage() {
  const questionsPromise = getQuestions()

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Suspense fallback={
        <div className="w-screen h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-6 w-6" />
        </div>}>
        <QuestionList questionsPromise={questionsPromise} />
      </Suspense>
    </main>
  )
}
