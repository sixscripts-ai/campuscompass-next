import { NextResponse } from "next/server";
import { getPrerequisiteCourses } from "../../lib/courseSearch";

export async function POST(request) {
  try {
    const { course_code, college } = await request.json();
    if (!course_code?.trim()) {
      return NextResponse.json({ target_course: null, prerequisites: [] });
    }
    const { target, prerequisites } = getPrerequisiteCourses(
      course_code,
      college || null
    );
    return NextResponse.json({ target_course: target, prerequisites });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
