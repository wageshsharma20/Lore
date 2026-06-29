'use server';

import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { Redis } from '@upstash/redis';
import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';
import { getDecision, memifyDecision } from '@/lib/api';
import { revalidatePath } from 'next/cache';

// Initialize Redis only if env vars are present
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? Redis.fromEnv()
  : null;

export async function generateAdrDraft(decisionId: string) {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is missing');
  }

  // 1. Fetch the original decision context from FastAPI
  const decision = await getDecision(decisionId);
  if (!decision) {
    throw new Error('Decision not found');
  }

  // 2. Prompt Gemini to generate a professional MADR v3.0 document
  const { text } = await generateText({
    model: google('gemini-1.5-pro'),
    prompt: `You are an expert Software Architect. 
    Write a Markdown Architecture Decision Record (MADR v3.0 format) for the following decision:
    Title: ${decision.title}
    Author: ${decision.author}
    Date: ${decision.date}
    Context/Reason: ${decision.reason}
    Decision Details: ${decision.what}
    Affected Systems: ${decision.affected_systems.join(', ')}

    Output ONLY the raw markdown content without any wrapper blocks or introductory text. Use the standard MADR sections: Title, Status, Context, Decision, Consequences.`,
  });

  const draftId = `adr_draft_${decisionId}`;
  const draftAdr = {
    id: draftId,
    title: decision.title,
    status: 'Draft' as const,
    author: decision.author,
    date: new Date().toISOString().split('T')[0],
    content: text,
    decisionId: decisionId,
  };

  // 3. Save the draft to Upstash Redis
  if (redis) {
    await redis.set(`adr:draft:${draftId}`, draftAdr);
  } else {
    console.warn("Redis not configured. Draft not persisted.");
  }

  revalidatePath('/adrs');
  return draftId;
}

export async function approveAndCommitAdr(draftId: string) {
  if (!process.env.GITHUB_APP_ID || !process.env.GITHUB_APP_PRIVATE_KEY || !process.env.GITHUB_INSTALLATION_ID) {
    throw new Error('GitHub App credentials are missing. Cannot commit to repo.');
  }

  if (!redis) {
    throw new Error('Redis is not configured. Cannot retrieve draft.');
  }

  // 1. Retrieve the draft from Redis
  const draft = await redis.get(`adr:draft:${draftId}`) as any;
  if (!draft) {
    throw new Error('Draft not found');
  }

  // 2. Authenticate with Octokit
  const appAuth = createAppAuth({
    appId: process.env.GITHUB_APP_ID,
    privateKey: process.env.GITHUB_APP_PRIVATE_KEY.replace(/\\n/g, '\n'),
    installationId: process.env.GITHUB_INSTALLATION_ID,
  });
  
  const { token } = await appAuth({ type: 'installation' });
  const octokit = new Octokit({ auth: token });
  
  // Note: For a hackathon, we assume the repo is 'tarot-club-hackathons/lore'
  const owner = 'tarot-club-hackathons';
  const repo = 'lore';
  const branchName = `adr/add-${draftId}`;
  
  try {
    // 3. Get the latest commit SHA of the main branch
    const { data: refData } = await octokit.rest.git.getRef({
      owner,
      repo,
      ref: 'heads/main',
    });
    const baseSha = refData.object.sha;

    // 4. Create a new branch
    await octokit.rest.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: baseSha,
    });

    // 5. Commit the Markdown file
    const filePath = `docs/adrs/${draftId}.md`;
    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: filePath,
      message: `docs: Add ADR ${draft.title}`,
      content: Buffer.from(draft.content).toString('base64'),
      branch: branchName,
    });

    // 6. Open a Pull Request
    const { data: pr } = await octokit.rest.pulls.create({
      owner,
      repo,
      title: `docs(adr): ${draft.title}`,
      body: `Auto-generated ADR for decision championed by ${draft.author}.\n\nPlease review and merge.`,
      head: branchName,
      base: 'main',
    });

    // 7. Call memify to enrich the original decision node with the ratified status and ADR link
    try {
      await memifyDecision(draft.decisionId, pr.html_url);
    } catch (memifyError) {
      console.error("Warning: PR created successfully, but memifyDecision failed. The decision graph may be stale.", memifyError);
    }

    // 8. Clean up the draft from Redis
    await redis.del(`adr:draft:${draftId}`);
    
    revalidatePath('/adrs');
    return pr.html_url;

  } catch (error: any) {
    console.error("GitHub API Error:", error);
    throw new Error(`Failed to commit to GitHub: ${error.message}`);
  }
}

export async function rejectAdrDraft(draftId: string) {
  if (!redis) {
    throw new Error('Redis is not configured. Cannot retrieve draft.');
  }
  
  await redis.del(`adr:draft:${draftId}`);
  revalidatePath('/adrs');
}

export async function getAdrDrafts() {
  if (!redis) return [];
  const keys = await redis.keys('adr:draft:*');
  if (keys.length === 0) return [];
  const drafts = await redis.mget(...keys);
  return drafts.filter(Boolean);
}

export async function getAdrDraft(draftId: string) {
  if (!redis) return null;
  return await redis.get(`adr:draft:${draftId}`);
}
