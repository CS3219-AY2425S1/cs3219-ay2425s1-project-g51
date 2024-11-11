import { NextResponse } from 'next/server';
import { Db, MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI as string;
const dbName = 'test';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = await MongoClient.connect(uri);

  const db = client.db(dbName);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

export async function GET(
    request: Request,
    { params }: { params: { sessionId: string } }
  ) {
    try {
      const { db } = await connectToDatabase();
  
      const session = await db.collection('sessions').findOne({ sessionId: params.sessionId });
  
      if (!session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }
  
      return NextResponse.json(session, { status: 200 });
    } catch (error) {
      console.error('Error fetching session:', error);
      return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
    }
  }

export async function PATCH(
  request: Request,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { db } = await connectToDatabase();
    const { sessionName } = await request.json();

    const result = await db.collection('sessions').updateOne(
      { sessionId: params.sessionId },
      { $set: { sessionName } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Session updated' }, { status: 200 });
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}