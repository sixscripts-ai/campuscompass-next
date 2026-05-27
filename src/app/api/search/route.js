import { NextResponse } from "next/server";
import { searchCourses } from "../../lib/courseSearch";

export async function POST(request) {
  try {
    const { query, college } = await request.json();
    if (!query?.trim()) {
      return NextResponse.json({ results: [] });
    }
    const results = searchCourses(query, college || null, 10);
    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
