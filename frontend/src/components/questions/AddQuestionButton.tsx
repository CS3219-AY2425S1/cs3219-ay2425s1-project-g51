'use client'

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { PlusIcon } from 'lucide-react'
import EditQuestionDialog from './EditQuestionDialog'
import { Question, QuestionComplexity } from '@/types/question.types'
import { toast } from "react-hot-toast"

interface AddQuestionButtonProps {
  onQuestionAdded: (newQuestion: Question) => void
}

export default function AddQuestionButton({ onQuestionAdded }: AddQuestionButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleAddQuestion = () => {
    setIsDialogOpen(true)
  }

  const handleSaveQuestion = async (newQuestion: Question) => {
    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newQuestion),
      })
      if (!response.ok || response.status !== 201) {
        toast.error('Failed to add question')
        setIsDialogOpen(false)
        return
      }
      if (response.ok) {
        const addedQuestion = await response.json()
        onQuestionAdded(addedQuestion)
        setIsDialogOpen(false)
      } else {
        console.error('Failed to add question')
      }
    } catch (error) {
      console.error('Error adding question:', error)
    }
  }

  const newQuestion: Question = {
    title: '',
    description: '',
    categories: [],
    complexity: QuestionComplexity.EASY,
  }

  return (
    <>
      <Button onClick={handleAddQuestion}>
        <PlusIcon className="w-4 h-4 mr-2" />
        Add Question
      </Button>
      <EditQuestionDialog
        question={newQuestion}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSaveQuestion}
        onDelete={() => {}} // Not applicable for new questions
      />
    </>
  )
}