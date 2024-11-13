export enum QuestionCategory {
  STRINGS = 'Strings',
  ALGORITHMS = 'Algorithms',
  DATA_STRUCTURES = 'Data Structures',
  BIT_MANIPULATION = 'Bit Manipulation',
  RECURSION = 'Recursion',
  DATABASES = 'Databases',
  ARRAYS = 'Arrays',
  BRAINTEASER = 'Brainteaser',
  OTHER = 'Other',
}

export enum QuestionComplexity {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

export interface Question {
  _id?: string
  title: string
  description?: string
  categories: QuestionCategory[]
  complexity: QuestionComplexity
}