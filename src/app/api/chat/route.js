import { OpenAI } from "openai";
import { Pinecone } from "@pinecone-database/pinecone";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://models.inference.ai.azure.com",
});

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const indexName = process.env.PINECONE_INDEX_NAME || "campus-compass";

function extractJsonFromText(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    // Try extracting from ```json ... ``` fences
    let match = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch (e) {}
    }
    // Try finding the first { ... } block
    match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (e) {}
    }
    return null;
  }
}

export async function POST(request) {
  try {
    const { question } = await request.json();

    if (!question) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }

    // 1. Embed the user's question
    const embedResponse = await openai.embeddings.create({
      input: question,
      model: process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",
    });
    
    const queryVector = embedResponse.data[0].embedding;

    // 2. Search Pinecone for top 5 matches
    const pineconeIndex = pc.index(indexName);
    const searchResults = await pineconeIndex.query({
      vector: queryVector,
      topK: 5,
      includeMetadata: true,
    });

    // 3. Format the context
    const contextChunks = [];
    if (searchResults.matches) {
      for (const match of searchResults.matches) {
        const courseText = match.metadata?.course_text;
        if (courseText) {
          contextChunks.push(courseText);
        }
      }
    }

    const context = contextChunks.join("\n\n");

    if (!context) {
      return NextResponse.json({
        response: "I couldn't find any matching courses in the database. Could you try rephrasing your question?",
        course_cards: [],
        status: "success",
      });
    }

    // 4. Ask OpenAI GPT-4o-mini
    const systemPrompt = `You are Campus Compass, an AI advisor for college courses.
You must analyze the user's question and the provided course catalog information, and respond ONLY with a valid JSON object (no markdown fences, no extra text).

The JSON object must have exactly two keys:
1. "chat_response": A friendly, conversational string answering the user's question.
2. "course_cards": An array of objects representing the relevant courses to display. If no courses are relevant, return an empty array [].

Each object in the "course_cards" array must have:
- "course_code": string (e.g., "MATH 150")
- "title": string (e.g., "Calculus I")
- "units": string (e.g., "4.0")
- "prerequisites": string (e.g., "MATH 101 or equivalent" or "None")
- "college": string (e.g., "MiraCosta College" or "CSU Chico")
- "description": string (a brief description of the course)

IMPORTANT: Output ONLY the JSON object. No markdown, no code fences, no explanation before or after.
Do not make up courses. Only use courses from the provided context.`;

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Course Catalog Information:\n${context}\n\nQuestion: ${question}` },
      ],
      temperature: 0.2,
    });

    const rawContent = completion.choices[0]?.message?.content || "";
    const responseData = extractJsonFromText(rawContent);

    if (responseData && responseData.chat_response) {
      return NextResponse.json({
        response: responseData.chat_response,
        course_cards: responseData.course_cards || [],
        status: "success",
      });
    } else {
      // Fallback
      return NextResponse.json({
        response: rawContent,
        course_cards: [],
        status: "success",
      });
    }
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json({ error: `Server error: ${error.message}` }, { status: 500 });
  }
}
