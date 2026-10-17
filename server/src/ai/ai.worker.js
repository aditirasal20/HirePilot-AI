import prisma from "../lib/prisma.js";

/**
 * Central AI Worker Pipeline.
 * Consumes queued AI jobs, delegates to the owning module's worker for execution,
 * and guarantees a terminal DB status (COMPLETED / FAILED) on every queue.
 *
 * Each module owns the persistence + notification logic for its own job type.
 */
export async function processAIWorkerJob(jobRecord) {
  const { id, queueName, jobName, payload } = jobRecord;

  console.log(`[AI Worker Started] Processing ${jobName} on queue ${queueName} (${id})`);

  try {
    switch (queueName) {
      case "resume-analysis": {
        const { processResumeAnalysis } = await import("../modules/resume-ai/resume-ai.processor.js");
        await processResumeAnalysis({ data: payload });
        break;
      }
      case "job-matching": {
        const { processJobMatching } = await import("../modules/job-matching/job-matching.worker.js");
        await processJobMatching({ data: payload });
        break;
      }
      case "cover-letter":
        await handleCoverLetterJob(payload);
        break;
      case "resume-rewrite":
        await handleResumeRewriteJob(payload);
        break;
      case "interview-generation":
        await handleInterviewGenerationJob(payload);
        break;
      default:
        console.warn(`[AI Worker Warning] No worker handler registered for queue '${queueName}'`);
    }

    console.log(`[AI Worker Completed] Successfully processed ${id}`);
    return { success: true, id };
  } catch (error) {
    console.error(`[AI Worker Error] Processing failed for ${id}:`, error.message);
    throw error;
  }
}

/**
 * Handler for Cover Letter Queue Jobs
 */
async function handleCoverLetterJob(payload) {
  const { coverLetterId, candidateName, jobTitle, companyName, resumeText, userId } = payload;

  if (!coverLetterId || !jobTitle || !resumeText) {
    throw new Error("Missing required payload fields for Cover Letter Generation.");
  }

  try {
    const [{ default: promptManager }, { default: geminiService }] = await Promise.all([
      import("./prompt.manager.js"),
      import("./gemini.service.js"),
    ]);

    await prisma.coverLetter.update({
      where: { id: coverLetterId },
      data: { status: "PROCESSING" },
    });

    const rendered = promptManager.renderPrompt("COVER_LETTER", {
      candidateName: candidateName || "Candidate",
      jobTitle,
      companyName: companyName || "Hiring Manager",
      resumeText,
    });

    const aiResult = await geminiService.generateStructuredJSON({
      prompt: rendered.userPrompt,
      systemPrompt: rendered.systemPrompt,
      moduleName: "COVER_LETTER",
      promptName: rendered.name,
    });

    await prisma.coverLetter.update({
      where: { id: coverLetterId },
      data: {
        status: "COMPLETED",
        content: aiResult.data.coverLetter || aiResult.data.content || "",
        generatedAt: new Date(),
      },
    });

    if (userId) {
      const { emitToUser } = await import("../modules/notification/notification.socket.js");
      emitToUser(userId, "COVER_LETTER_READY", { coverLetterId });
    }

    return aiResult.data;
  } catch (error) {
    await prisma.coverLetter.update({
      where: { id: coverLetterId },
      data: { status: "FAILED" },
    }).catch(() => {});
    throw error;
  }
}

/**
 * Handler for Resume Rewrite Queue Jobs
 */
async function handleResumeRewriteJob(payload) {
  const { resumeId, resumeText, targetRole } = payload;

  if (!resumeId || !resumeText) {
    throw new Error("Missing required payload fields for Resume Rewrite.");
  }

  try {
    const [{ default: promptManager }, { default: geminiService }] = await Promise.all([
      import("./prompt.manager.js"),
      import("./gemini.service.js"),
    ]);

    const rendered = promptManager.renderPrompt("RESUME_REWRITE", {
      targetRole: targetRole || "Target Role",
      resumeText,
    });

    const aiResult = await geminiService.generateStructuredJSON({
      prompt: rendered.userPrompt,
      systemPrompt: rendered.systemPrompt,
      moduleName: "RESUME_REWRITE",
      promptName: rendered.name,
    });

    const data = aiResult.data;

    if (data.rewrittenSummary) {
      await prisma.resume.update({
        where: { id: resumeId },
        data: {
          summary: data.rewrittenSummary,
          recommendedSkills: data.targetKeywordsAdded || [],
        },
      });
    }

    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * Handler for Interview Question Generation Queue Jobs.
 * The Interview model has no question persistence column; results are returned
 * to the caller without a DB write.
 */
async function handleInterviewGenerationJob(payload) {
  const { interviewId, jobTitle, yearsOfExperience, requiredSkills, resumeSummary } = payload;

  if (!interviewId || !jobTitle) {
    throw new Error("Missing required payload fields for Interview Generation.");
  }

  const [{ default: promptManager }, { default: geminiService }] = await Promise.all([
    import("./prompt.manager.js"),
    import("./gemini.service.js"),
  ]);

  const rendered = promptManager.renderPrompt("INTERVIEW_QUESTIONS", {
    jobTitle,
    yearsOfExperience: yearsOfExperience || 0,
    requiredSkills: Array.isArray(requiredSkills) ? requiredSkills.join(", ") : requiredSkills,
    resumeSummary: resumeSummary || "No summary provided.",
    questionCount: 5,
  });

  const aiResult = await geminiService.generateStructuredJSON({
    prompt: rendered.userPrompt,
    systemPrompt: rendered.systemPrompt,
    moduleName: "INTERVIEW_GENERATION",
    promptName: rendered.name,
  });

  return aiResult.data;
}
