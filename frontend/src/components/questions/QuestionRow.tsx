'use client'

import React from 'react'
import { Question } from '@/types/question.types'
import { Pencil } from 'lucide-react'
import { CategoryBadge, ComplexityBadge } from './Badges'

interface QuestionRowProps {
  question: Question
  index: number
  onEdit?: (question: Question) => void
  onView: (question: Question) => void
}

export default function QuestionRow({ question, index, onEdit, onView }: QuestionRowProps) {
  return (
    <tr key={question._id} className="hover:bg-gray-50 cursor-pointer">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center" onClick={() => onView(question)}>{index + 1}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" onClick={() => onView(question)}>
        <span 
          className="cursor-pointer block"
        >
          {question.title}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" onClick={() => onView(question)}>
        {question.categories.map((category) => (
          <CategoryBadge key={category} category={category} />
        ))}
      </td>
      <td className="px-6 py-4 whitespace-nowrap" onClick={() => onView(question)}>
        <ComplexityBadge complexity={question.complexity} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {onEdit && (
          <button
            onClick={() => onEdit(question)}
            aria-label="Edit Question"
          >
            <Pencil className="h-5 w-5" />
          </button>
        )}
      </td>
    </tr>
  )
}
