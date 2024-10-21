import React from 'react'
import { QuestionCategory, QuestionComplexity } from '@/types/question.types'

export const CategoryBadge: React.FC<{ category: QuestionCategory }> = ({ category }) => {
  return (
    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mr-1">
      {category}
    </span>
  )
}

export const ComplexityBadge: React.FC<{ complexity: QuestionComplexity }> = ({ complexity }) => {
  const colorClass = {
    [QuestionComplexity.EASY]: 'bg-green-100 text-green-800',
    [QuestionComplexity.MEDIUM]: 'bg-yellow-100 text-yellow-800',
    [QuestionComplexity.HARD]: 'bg-red-100 text-red-800'
  }[complexity]

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
      {complexity}
    </span>
  )
}