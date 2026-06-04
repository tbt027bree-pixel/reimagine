exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' }) };
  }

  try {
    const body = JSON.parse(event.body);
    const { imageData, spaceType, concerns } = body;

    const messages = [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: imageData.mediaType,
              data: imageData.data
            }
          },
          {
            type: 'text',
            text: `You are a declutter and organization expert. Analyze this ${spaceType} photo and give practical, specific advice on how to organize and declutter it using what the person already owns — do NOT suggest buying new furniture or redesigning the space. Focus purely on arrangement, decluttering, and organizing.

${concerns ? `The person is especially concerned about: ${concerns}` : ''}

Format your response like this:
**What I See:** (brief honest assessment)
**Top 3 Quick Wins:** (things they can do in under 30 minutes)
**Bigger Projects:** (2-3 deeper organization tasks)
**Your Mantra:** (one motivating sentence for this space)

Keep it warm, encouraging, and practical. Under 300 words total.`
          }
        ]
      }
    ];

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 1024,
        messages
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return { statusCode: response.status, body: JSON.stringify({ error: data.error?.message || 'API error' }) };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ result: data.content[0].text })
    };

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
