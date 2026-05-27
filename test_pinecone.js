import { Pinecone } from '@pinecone-database/pinecone';
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
async function run() {
  const indexes = await pc.listIndexes();
  console.log("Indexes:", indexes);
}
run();
