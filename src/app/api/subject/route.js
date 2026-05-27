import { NextResponse } from "next/server";
import { getSubjectStats } from "../../lib/courseSearch";

export async function POST(request) {
  try {
    const { subject, college } = await request.json();
    if (!subject?.trim()) {
      return NextResponse.json({ courses: [], total: 0, miracosta: 0, chico: 0 });
    }
    const stats = getSubjectStats(subject, college || null);
    return NextResponse.json(stats);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
