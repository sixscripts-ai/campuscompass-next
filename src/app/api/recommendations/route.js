import { NextResponse } from "next/server";
import { getRecommendations } from "../../lib/courseSearch";

export async function POST(request) {
  try {
    const { interests, college } = await request.json();
    if (!interests?.trim()) {
      return NextResponse.json({ recommendations: {} });
    }
    const list = interests
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const recommendations = getRecommendations(list, college || null);
    return NextResponse.json({ recommendations });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
