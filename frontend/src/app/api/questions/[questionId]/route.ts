import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { questionId: string } }
) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_QUESTION_API_URL}/questions/${params.questionId}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  })

  const data = await res.json()

  return NextResponse.json(data, { status: res.status })
}

export async function PATCH(
  request: Request,
  { params }: { params: { questionId: string } }
) {
  const body = await request.json()

  const res = await fetch(`${process.env.NEXT_PUBLIC_QUESTION_API_URL}/questions/${params.questionId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data = await res.json()

  return NextResponse.json(data, { status: res.status })
}

export async function DELETE(
  request: Request,
  { params }: { params: { questionId: string } }
) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_QUESTION_API_URL}/questions/${params.questionId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  const data = await res.json()

  return NextResponse.json(data, { status: res.status })
}