import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const categories = searchParams.get('categories')?.split(',')
  const complexity = searchParams.get('complexity')

  const url = new URL('/questions', process.env.NEXT_PUBLIC_QUESTION_API_URL)
  if (categories) url.searchParams.append('categories', categories.join(','))
  if (complexity) url.searchParams.append('complexity', complexity)

  const res = await fetch(url.toString(), {
    headers: {
      'Content-Type': 'application/json',
    },
  })

  const data = await res.json()

  return NextResponse.json(data, { status: res.status })
}

export async function POST(request: Request) {
  const body = await request.json()

  const res = await fetch(`${process.env.NEXT_PUBLIC_QUESTION_API_URL}/questions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data = await res.json()

  return NextResponse.json(data, { status: res.status })
}