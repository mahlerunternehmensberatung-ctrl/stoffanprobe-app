import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'https://api.x.ai/v1',
  apiKey: process.env.GROK_API_KEY,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!process.env.GROK_API_KEY) {
      return res.status(500).json({ error: 'GROK_API_KEY is not configured' });
    }

    const completion = await openai.chat.completions.create({
      model: 'grok-beta',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const response = completion.choices[0]?.message?.content || '';

    return res.status(200).json({ response });
  } catch (error: any) {
    console.error('Error in chat API:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
