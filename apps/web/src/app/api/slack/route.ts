import { NextResponse } from 'next/server';
import { ask_team_for_context, fetch_slack_thread_messages } from '@/lib/slack-helpers';
import { getDecisions } from '@/lib/api';

export async function POST(req: Request) {
  const body = await req.json();

  // 1. Slack Verification (Required to turn the bot on)
  if (body.type === 'url_verification') {
    return NextResponse.json({ challenge: body.challenge });
  }

  // 2. Handle @Lore mentions
  if (body.event && body.event.type === 'app_mention') {
    const { text, channel, ts, thread_ts } = body.event;
    
    console.log(`Lore was mentioned! Message: ${text}`);

    // Design the @Lore query handler to support natural-language questions
    if (text.toLowerCase().includes("why did we") || text.toLowerCase().includes("who decided")) {
      
      const decisions = await getDecisions();
      
      // Real check against graph results rather than hardcoded false
      const aiFoundAnswer = decisions && decisions.length > 0;
      
      if (!aiFoundAnswer) {
         // Ask the team for context!
         await ask_team_for_context(channel, thread_ts || ts, "Why did we make this specific decision? I couldn't find it in my memory graph.");
      }
    } else if (thread_ts) {
      // If it's a regular thread, fetch the messages to capture authors
      const threadMessages = await fetch_slack_thread_messages(channel, thread_ts);
      console.log(`Captured ${threadMessages.length} thread messages for attribution.`);
    }
  }

  return NextResponse.json({ ok: true });
}