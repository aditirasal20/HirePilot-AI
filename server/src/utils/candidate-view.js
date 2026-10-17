// Hiring-team assessments are private. Candidate responses retain scheduling details.
export function candidateInterviewView(interview) {
  if (!interview) return interview;
  const result = { ...interview };
  delete result.feedback;
  delete result.score;
  return result;
}
export function candidateApplicationView(application) {
  if (!application) return application;
  const result = { ...application, interview: candidateInterviewView(application.interview) };
  delete result.recruiterNotes;
  return result;
}
