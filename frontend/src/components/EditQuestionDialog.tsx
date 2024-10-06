'use client'

import React from 'react'
import { Question, QuestionCategory, QuestionComplexity } from '@/types/question.types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { MultiSelect } from "@/components/ui/multi-select"
import { Trash2 } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { questionSchema, QuestionFormData } from '../types/forms/questionSchema'

interface EditQuestionDialogProps {
  question: Question | null
  isOpen: boolean
  onClose: () => void
  onSave: (question: Question) => void
  onDelete: () => void
}

export default function EditQuestionDialog({ question, isOpen, onClose, onSave, onDelete }: EditQuestionDialogProps) {
  const { control, handleSubmit, formState: { errors }, reset } = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: question || {
      title: '',
      description: '',
      categories: [],
      complexity: QuestionComplexity.EASY,
    },
  })

  React.useEffect(() => {
    if (question) {
      reset(question)
    }
  }, [question, reset])

  const onSubmit = (data: QuestionFormData) => {
    onSave({ _id: question?._id, ...data } as Question)
  }

  const categoryOptions = Object.values(QuestionCategory).map(category => ({
    label: category,
    value: category,
  }))

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{question?._id ? 'Edit Question' : 'Add Question'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <div className="col-span-3">
                <Controller
                  name="title"
                  control={control}
                  render={({ field }) => <Input {...field} />}
                />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="categories" className="text-right">
                Categories
              </Label>
              <div className="col-span-3">
                <Controller
                  name="categories"
                  control={control}
                  render={({ field }) => (
                    <MultiSelect
                      options={categoryOptions}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    />
                  )}
                />
                {errors.categories && <p className="text-red-500 text-sm mt-1">{errors.categories.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="complexity" className="text-right">
                Complexity
              </Label>
              <div className="col-span-3">
                <Controller
                  name="complexity"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select complexity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={QuestionComplexity.EASY}>Easy</SelectItem>
                        <SelectItem value={QuestionComplexity.MEDIUM}>Medium</SelectItem>
                        <SelectItem value={QuestionComplexity.HARD}>Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.complexity && <p className="text-red-500 text-sm mt-1">{errors.complexity.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <div className="col-span-3">
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => <Textarea {...field} className="min-h-[10em]" />}
                />
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <div className="w-full justify-between flex">
              <div>
                {question?._id && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={onDelete}
                    className="bg-red-500 hover:bg-red-600 text-white"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </div>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}