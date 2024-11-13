'use client'

import React, { useEffect, useState } from 'react'
import { Question } from '@/types/question.types'
import QuestionRow from './QuestionRow'
import EditQuestionDialog from './EditQuestionDialog'
import DeleteConfirmDialog from './DeleteQuestionDialog'
import AddQuestionButton from './AddQuestionButton'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CategoryBadge, ComplexityBadge } from './Badges'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { verifyToken } from '@/lib/api-user'
import { useRouter } from 'next/navigation'

interface QuestionListProps {
  questionsPromise: Promise<Question[]>
}

export default function QuestionList({ questionsPromise}: QuestionListProps) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [viewingQuestion, setViewingQuestion] = useState<Question | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()

  React.useEffect(() => {
    questionsPromise.then(setQuestions)
  }, [questionsPromise])

  React.useEffect(() => {
      const fetchUserData = async () => {
        const token = localStorage.getItem('token')
        if (!token) {
          router.push('/login')
          return
        }
        try {
          const res: any = await verifyToken(token)
          setIsAdmin(res.data.isAdmin)
        } catch (error: any) {
          toast.error(error.message || 'User verification failed, please login again!')
          router.push('/login')
        }
      }
      fetchUserData()
    }, [])

  const handleEditQuestion = async (question: Question) => {
    try {
      const response = await fetch(`/api/questions/${question._id}`)
      if (!response.ok || response.status !== 200) {
        toast.error('Failed to fetch full question details')
        return
      }
      if (response.ok) {
        const fullQuestion = await response.json()
        setEditingQuestion(fullQuestion)
        setIsEditDialogOpen(true)
      } else {
        console.error('Failed to fetch full question details')
      }
    } catch (error) {
      toast.error('Error fetching question details:')
    }
  }

  const handleDeleteQuestion = async () => {
    if (editingQuestion) {
      try {
        const response = await fetch(`/api/questions/${editingQuestion._id}`, { method: 'DELETE' })
        if (!response.ok || response.status !== 200) {
          toast.error('Failed to delete question')
          setIsDeleteConfirmOpen(false)
          setIsEditDialogOpen(false)
          setEditingQuestion(null)
          return
        }
        if (response.ok) {
          setQuestions(questions.filter(q => q._id !== editingQuestion._id))
        } else {
          console.error('Failed to delete question')
        }
      } catch (error) {
        console.error('Error deleting question:', error)
      }
    }
    setIsDeleteConfirmOpen(false)
    setIsEditDialogOpen(false)
    setEditingQuestion(null)
  }

  const handleViewQuestion = async (question: Question) => {
    try {
      const response = await fetch(`/api/questions/${question._id}`)
      if (!response.ok || response.status !== 200) {
        toast.error('Failed to fetch full question details')
        return
      }
      if (response.ok) {
        const fullQuestion = await response.json()
        setViewingQuestion(fullQuestion)
        setIsViewDialogOpen(true)
      } else {
        console.error('Failed to fetch full question details')
      }
    } catch (error) {
      console.error('Error fetching question details:', error)
    }
  }

  const handleSaveQuestion = async (updatedQuestion: Question) => {
    try {
      const response = await fetch(`/api/questions/${updatedQuestion._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedQuestion),
      })
      if (!response.ok || response.status !== 200) {
        toast.error('Failed to save question')
        setIsEditDialogOpen(false)
        setEditingQuestion(null)
        return
      }
      if (response.ok) {
        const savedQuestion = await response.json()
        setQuestions(questions.map(q => q._id === savedQuestion._id ? savedQuestion : q))
      } else {
        console.error('Failed to save question')
      }
    } catch (error) {
      console.error('Error saving question:', error)
    }
    setIsEditDialogOpen(false)
    setEditingQuestion(null)
  }

  const handleQuestionAdded = (newQuestion: Question) => {
    setQuestions([...questions, newQuestion])
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Interview Questions</h2>
        {isAdmin && <AddQuestionButton onQuestionAdded={handleQuestionAdded} />}
      </div>

      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {questions.length === 0 && (
          <div className="p-40 text-center text-lg">
            No Questions Created
          </div>
        )}
        {questions.length > 0 && (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Question Number</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question Title</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categories</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Complexity</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {questions.map((question, index) => (
                <QuestionRow
                  key={question._id}
                  question={question}
                  index={index}
                  onEdit={isAdmin ? handleEditQuestion : undefined}
                  onView={handleViewQuestion}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      <EditQuestionDialog
        question={editingQuestion}
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSave={handleSaveQuestion}
        onDelete={() => setIsDeleteConfirmOpen(true)}
      />

      <DeleteConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDeleteQuestion}
      />

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          {viewingQuestion && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">{viewingQuestion.title}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <p className="text-sm text-gray-500"><span className="font-semibold">Categories: </span>
                  {viewingQuestion.categories.map((category) => (
                    <CategoryBadge key={category} category={category} />
                  ))}
                </p>
                <p className="text-sm text-gray-500"><span className="font-semibold">Complexity:</span> <ComplexityBadge complexity={viewingQuestion.complexity} /></p>
                <p className="text-sm text-gray-500"><span className="font-semibold">Description:</span> {viewingQuestion.description}</p>
              </div>
            </>
          )}
          {!viewingQuestion && (
            <div className='flex justify-center'>
              <Loader2 className="animate-spin h-6 w-6 text-blue-500" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
