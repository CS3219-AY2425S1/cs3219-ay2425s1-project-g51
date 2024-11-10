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

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const sessions = await db.collection('sessions').find({}).toArray();
    return NextResponse.json(sessions, { status: 200 });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

  export async function POST(request: Request) {
    try {
      const { db } = await connectToDatabase();
      const body = await request.json();
      const result = await db.collection('sessions').insertOne(body);
      return NextResponse.json({ message: 'Session created', id: result.insertedId }, { status: 201 });
    } catch (error) {
      console.error('Error creating session:', error);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }
}