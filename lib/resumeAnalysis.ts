export function buildOptimizedPrompt(text: string): string {
  const maxTokens = 3000;
  const truncatedText =
    text.length > maxTokens ? text.substring(0, maxTokens) + "..." : text;

  return `ATS Resume Analyzer. Return ONLY JSON:
{
  "summary": "2-3 sentence professional summary",
  "skills": ["skill1", "skill2"],
  "atsScore": 0-100,
  "suggestions": ["tip1", "tip2", "tip3"]
}

Rules: No markdown, no explanation, valid JSON only.

Resume:
${truncatedText}`;
}

export function buildJDMatchPrompt(resumeText: string, jdText: string): string {
  const maxCharacters = 3000;
  const truncatedResume =
    resumeText.length > maxCharacters
      ? resumeText.substring(0, maxCharacters) + "..."
      : resumeText;
  const truncatedJD =
    jdText.length > maxCharacters
      ? jdText.substring(0, maxCharacters) + "..."
      : jdText;

  return `Resume and Job Description Matcher. Return ONLY JSON:
{
  "matchScore": 0-100,
  "missingSkills": ["skill1", "skill2"],
  "resumeSkills": ["skill1", "skill2"],
  "jdSkills": ["skill1", "skill2"]
}

Rules: No markdown, no explanation, valid JSON only. Compare the resume against the job description and score how closely the resume matches the JD.

Resume:
${truncatedResume}

Job Description:
${truncatedJD}`;
}

async function exponentialBackoffWithJitter<T>(
  fn: () => Promise<T>,
  maxRetries: number = 4,
  baseDelay: number = 1000,
): Promise<T> {
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (error: any) {
      attempt++;

      const isRateLimitError =
        error?.message?.includes("429") ||
        error?.message?.includes("quota") ||
        error?.message?.includes("rate limit") ||
        error?.status === 429;

      if (!isRateLimitError || attempt >= maxRetries) {
        throw error;
      }

      const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
      const jitter = Math.random() * 500;
      const totalDelay = exponentialDelay + jitter;

      console.log(
        `Rate limit hit. Retrying in ${(totalDelay / 1000).toFixed(2)}s (attempt ${attempt}/${maxRetries})...`,
      );

      await new Promise((resolve) => setTimeout(resolve, totalDelay));
    }
  }

  throw new Error("Max retries exceeded");
}

export async function callGeminiWithFallback(
  prompt: string,
  primaryModel: any,
  fallbackModel?: any,
): Promise<string> {
  try {
    const result = await exponentialBackoffWithJitter(
      async () => await primaryModel.generateContent(prompt),
    );

    return result.response?.text?.() || "";
  } catch (primaryError: any) {
    console.error("Primary model failed:", primaryError?.message);

    if (!fallbackModel) {
      throw primaryError;
    }

    console.log("Falling back to Flash-Lite model...");

    try {
      const fallbackResult = await exponentialBackoffWithJitter(
        async () => await fallbackModel.generateContent(prompt),
      );

      return fallbackResult.response?.text?.() || "";
    } catch (fallbackError: any) {
      console.error("Fallback model also failed:", fallbackError?.message);
      throw fallbackError;
    }
  }
}
