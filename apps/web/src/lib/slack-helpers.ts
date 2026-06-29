import { WebClient } from '@slack/web-api';

// This connects us to the bot you just created!
const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

export async function fetch_slack_thread_messages(channelId: string, threadTs: string) {
  try {
    const response = await slack.conversations.replies({
      channel: channelId,
      ts: threadTs,
    });
    
    // Capture message senders for contributor attribution (from the schedule!)
    const messages = response.messages?.map(msg => ({
      author: msg.user,
      text: msg.text,
      timestamp: msg.ts,
    })) || [];
    
    return messages;
  } catch (error) {
    console.error("Error fetching Slack thread:", error);
    return [];
  }
}

export async function ask_team_for_context(channelId: string, threadTs: string, question: string) {
  try {
    await slack.chat.postMessage({
      channel: channelId,
      thread_ts: threadTs,
      text: `Hey team! Lore here. 🤖\n\nI need a little more context: *${question}*\n\nCan anyone clarify this for the architecture decision record?`,
    });
  } catch (error) {
    console.error("Error asking team for context:", error);
  }
}

export function parse_url_helper(text: string) {
  const urlRegex = /(https?:\/\/[^\s>]+)/g;
  return text.match(urlRegex) || [];
}