import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";
import coursesRaw from "../../data/pinecone_ready_courses.json";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pc.Index("campus-compass");

// Mapping ID to course details
const COURSE_MAP = {};
for (const raw of coursesRaw) {
  COURSE_MAP[raw.id] = raw.metadata;
}

export async function POST(request) {
  try {
    const { query, college } = await request.json();
    if (!query?.trim()) {
      return NextResponse.json({ results: [] });
    }

    // 1. Embed the query
    const embedRes = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
    });
    const queryVector = embedRes.data[0].embedding;

    // 2. Query Pinecone
    // Add college filter if specified
    let filter = undefined;
    if (college) {
      // The original script might not have stored 'college' exactly in Pinecone metadata,
      // but we can filter the results post-query if Pinecone doesn't support it perfectly.
      // Let's filter post-query to be safe, retrieving top 30 then filtering.
    }

    const searchRes = await index.query({
      vector: queryVector,
      topK: 30,
      includeMetadata: false,
    });

    const results = [];
    for (const match of searchRes.matches) {
      const course = COURSE_MAP[match.id];
      if (!course) continue;

      if (college) {
        const cc = (course.college || "").toLowerCase();
        if (!cc.includes(college.toLowerCase())) continue;
      }

      results.push({
        ...course,
        relevance_score: match.score * 100, // Scale score for display
        match_reason: "Semantic AI Match",
      });

      if (results.length >= 10) break; // Limit to top 10
    }

    return NextResponse.json({ results });
  } catch (err) {
    console.error("Semantic search error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
