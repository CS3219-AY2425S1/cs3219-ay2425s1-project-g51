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
import { Trash2, Plus, X } from 'lucide-react'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { questionSchema, QuestionFormData } from '../../types/forms/questionSchema'
import { Card } from "@/components/ui/card"

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
      testCases: [{ input: '', expectedOutput: '' }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "testCases",
  });

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

  const addTestCase = () => {
    append({ input: '', expectedOutput: '' });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>{question?._id ? 'Edit Question' : 'Add Question'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            {/* Existing fields remain the same */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">Title</Label>
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
              <Label htmlFor="categories" className="text-right">Categories</Label>
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
              <Label htmlFor="complexity" className="text-right">Complexity</Label>
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
              <Label htmlFor="description" className="text-right">Description</Label>
              <div className="col-span-3">
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => <Textarea {...field} className="min-h-[10em]" />}
                />
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
              </div>
            </div>

            {/* New Test Cases Section */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right mt-2">Test Cases</Label>
              <div className="col-span-3 space-y-4">
                {fields.map((field, index) => (
                  <Card key={field.id} className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-sm font-medium">Test Case {index + 1}</span>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label>Input</Label>
                        <Controller
                          name={`testCases.${index}.input`}
                          control={control}
                          render={({ field }) => <Textarea {...field} className="mt-1" />}
                        />
                        {errors.testCases?.[index]?.input && (
                          <p className="text-red-500 text-sm mt-1">{errors.testCases[index]?.input?.message}</p>
                        )}
                      </div>
                      <div>
                        <Label>Expected Output</Label>
                        <Controller
                          name={`testCases.${index}.expectedOutput`}
                          control={control}
                          render={({ field }) => <Textarea {...field} className="mt-1" />}
                        />
                        {errors.testCases?.[index]?.expectedOutput && (
                          <p className="text-red-500 text-sm mt-1">{errors.testCases[index]?.expectedOutput?.message}</p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTestCase}
                  className="w-full"
                  disabled={fields.length >= 10}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Test Case
                </Button>
                {errors.testCases && typeof errors.testCases === 'object' && 'message' in errors.testCases && (
                  <p className="text-red-500 text-sm mt-1">{errors.testCases.message as string}</p>
                )}
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