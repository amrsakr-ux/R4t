import Anthropic from "@anthropic-ai/sdk";
import type { ParsedCVData } from "@/types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function parseCV(cvText: string): Promise<ParsedCVData> {
  const prompt = `You are an expert CV/resume parser. Extract structured information from the following CV text and return it as valid JSON.

CV Text:
---
${cvText}
---

Extract and return a JSON object with exactly this structure:
{
  "skills": ["skill1", "skill2", ...],
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "duration": "Jan 2022 - Present",
      "years": 2.5,
      "description": "Brief description of responsibilities"
    }
  ],
  "education": [
    {
      "degree": "Bachelor of Science",
      "institution": "University Name",
      "year": "2020",
      "field": "Computer Science"
    }
  ],
  "certifications": ["cert1", "cert2"],
  "projects": [
    {
      "name": "Project Name",
      "description": "Brief description",
      "technologies": ["tech1", "tech2"]
    }
  ],
  "totalYearsExperience": 3.5,
  "summary": "Brief professional summary extracted or inferred from the CV",
  "languages": ["English", "Arabic"]
}

Rules:
- Extract ALL skills mentioned (technical and soft skills)
- Calculate totalYearsExperience from work experience entries
- If information is missing, use empty arrays or 0 for numbers
- Be thorough and accurate
- Return ONLY the JSON object, no other text`;

  const response = await anthropic.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  try {
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    return JSON.parse(jsonMatch[0]) as ParsedCVData;
  } catch {
    throw new Error(`Failed to parse CV response: ${content.text.slice(0, 200)}`);
  }
}

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const pdfParse = await import("pdf-parse");
  const data = await pdfParse.default(buffer);
  return data.text;
}

export async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  const text = buffer.toString("utf-8").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return text;
}
