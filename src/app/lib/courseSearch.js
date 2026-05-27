/**
 * Campus Compass - Course Search Engine (JavaScript port)
 * Pure JS implementation of the Python CampusCompassSearch class.
 * Loads the full 1,764-course catalog JSON and performs deterministic
 * relevance-scored search, subject browsing, prerequisite resolution,
 * and interest-based recommendations — all in-memory, serverless-ready.
 */

import coursesRaw from "../data/pinecone_ready_courses.json";

// Pre-process on cold start — extract metadata array once
const ALL_COURSES = coursesRaw.map((r) => r.metadata);

/**
 * Calculate a relevance score for a course against a query string.
 * Returns { score, reasons[] }.
 */
function calculateRelevance(course, query) {
  const qLower = query.toLowerCase();
  const qWords = qLower.split(/\s+/).filter((w) => w.length > 2);

  let score = 0;
  const reasons = [];

  // --- Course code match (highest priority) ---
  const code = (course.course_code || "").toLowerCase();
  if (qLower.includes(code) || code.includes(qLower)) {
    score += 10;
    reasons.push("course code");
  }

  // --- Title match ---
  const title = (course.title || "").toLowerCase();
  const titleWords = new Set(title.match(/\w+/g) || []);

  if (title.includes(qLower)) {
    score += 8;
    reasons.push("title phrase");
  }

  let titleWordHits = 0;
  for (const w of qWords) {
    if (titleWords.has(w)) {
      titleWordHits++;
      score += 3;
    }
  }
  if (titleWordHits > 0) reasons.push(`title words (${titleWordHits})`);

  // --- Subject match ---
  const subject = (course.subject || "").toLowerCase();
  if (qLower.includes(subject) || subject.includes(qLower)) {
    score += 6;
    reasons.push("subject");
  }

  // --- Description match ---
  const desc = (course.description || "").toLowerCase();
  const descWords = new Set(desc.match(/\w+/g) || []);

  if (desc.includes(qLower)) {
    score += 4;
    reasons.push("description phrase");
  }

  let descWordHits = 0;
  for (const w of qWords) {
    if (descWords.has(w)) {
      descWordHits++;
      score += 1;
    }
  }
  if (descWordHits > 0) reasons.push(`description words (${descWordHits})`);

  // --- Prerequisites match ---
  const prereqs = (course.prerequisites || "").toLowerCase();
  if (prereqs !== "not specified" && prereqs.includes(qLower)) {
    score += 2;
    reasons.push("prerequisites");
  }

  // --- College match ---
  const college = (course.college || "").toLowerCase();
  for (const kw of ["miracosta", "chico", "state", "california"]) {
    if (qLower.includes(kw) && college.includes(kw)) {
      score += 3;
      reasons.push("college");
      break;
    }
  }

  // Bonus for multi-signal matches
  if (reasons.length > 2) {
    score += 2;
    reasons.push("multiple matches");
  }

  return { score, reasons };
}

// ─── Public API ────────────────────────────────────────────────

export function searchCourses(query, collegeFilter = null, maxResults = 10) {
  const results = [];

  for (const course of ALL_COURSES) {
    if (collegeFilter) {
      const cc = (course.college || "").toLowerCase();
      if (!cc.includes(collegeFilter.toLowerCase())) continue;
    }

    const { score, reasons } = calculateRelevance(course, query);
    if (score > 0) {
      results.push({
        ...course,
        relevance_score: score,
        match_reason: reasons.join(", "),
      });
    }
  }

  results.sort((a, b) => b.relevance_score - a.relevance_score);
  return results.slice(0, maxResults);
}

export function getCourseByCode(code, college = null) {
  const results = searchCourses(code, college, 1);
  return results.length ? results[0] : null;
}

export function getCoursesBySubject(subject, college = null, max = 20) {
  return searchCourses(subject, college, max);
}

export function getPrerequisiteCourses(courseCode, college = null) {
  const target = getCourseByCode(courseCode, college);
  if (!target || !target.prerequisites || target.prerequisites === "Not specified") {
    return { target, prerequisites: [] };
  }

  const codePattern = /[A-Z]{2,4}\s*\d{2,3}[A-Z]?/g;
  const codes = target.prerequisites.toUpperCase().match(codePattern) || [];

  const prereqs = [];
  for (const c of codes) {
    const found = getCourseByCode(c.trim(), college);
    if (found) prereqs.push(found);
  }

  return { target, prerequisites: prereqs };
}

export function getRecommendations(interests, college = null) {
  const recs = {};
  for (const interest of interests) {
    const courses = searchCourses(interest, college, 5);
    if (courses.length) recs[interest] = courses;
  }
  return recs;
}

export function getSubjectStats(subject, college = null) {
  const courses = searchCourses(subject, college, 100);
  const miracosta = courses.filter((c) =>
    (c.college || "").toLowerCase().includes("miracosta")
  ).length;
  return {
    total: courses.length,
    miracosta,
    chico: courses.length - miracosta,
    courses,
  };
}
