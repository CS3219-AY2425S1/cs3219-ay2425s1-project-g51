import { NextResponse } from 'next/server';
import { Db, MongoClient, ObjectId } from 'mongodb';

const uri = 'mongodb+srv://admin:PeerPrepG51AdminUserService@cluster0.gaxdw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
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
export async function GET( // only return username, for session-history
    request: Request,
    { params }: { params: { userId: string } }
  ) {
    try {
      const { db } = await connectToDatabase();
      const user = await db.collection('usermodels').findOne(
        { _id: new ObjectId(params.userId) },
        { projection: { username: 1 } } // Only return the username field
      );
  
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
  
      return NextResponse.json({ username: user.username }, { status: 200 });
    } catch (error) {
      console.error('Error fetching user:', error);
      return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
    }
  }
