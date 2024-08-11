import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const systemPrompt = `Role: You are a friendly and efficient customer support bot.
Assist website visitors with any questions or issues related to the site, services, and products. You have very short responses.
Capabilities:
    Answer general inquiries and provide product details.
    Offer step-by-step guidance for processes like account setup or purchases.
    Solve technical issues or escalate them when needed.
    Handle customer service requests like refunds or order status.
    Engage proactively based on user behavior.
    Support multiple languages.
Behavior: Be polite, clear, and helpful. Personalize responses and focus on resolving issues quickly. Escalate when necessary.
Tone: Friendly, professional, relaxed, and patient.`

export async function POST(req) {
    try {
        let data;
        try {
            data = await req.json()
        } catch (parseError) {
            console.error('Error parsing request JSON:', parseError);
            return new NextResponse(JSON.stringify({ error: 'Invalid JSON in request body' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (!data.message || typeof data.message !== 'string') {
            console.error('Invalid or missing message in request:', data);
            return new NextResponse(JSON.stringify({ error: 'Invalid or missing message' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        let groq;
        try {
            groq = new Groq({
                apiKey: process.env.GROQ_API_KEY,
                dangerouslyAllowBrowser: true
            });
        } catch (groqInitError) {
            console.error('Error initializing Groq client:', groqInitError);
            return new NextResponse(JSON.stringify({ error: 'Error initializing AI service' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        let completion;
        try {
            completion = await groq.chat.completions.create({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: data.message }
                ],
                model: 'llama3-70b-8192',
                stream: true,
            });
        } catch (groqApiError) {
            console.error('Error calling Groq API:', groqApiError);
            return new NextResponse(JSON.stringify({ error: 'Error generating AI response', details: groqApiError.message }), {
                status: 502,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder()
                try {
                    for await (const chunk of completion) {
                        const content = chunk.choices[0]?.delta?.content
                        if (content) {
                            const text = encoder.encode(content)
                            controller.enqueue(text)
                        }
                    }
                    controller.close()
                } catch (streamError) {
                    console.error('Error processing stream:', streamError);
                    controller.error(streamError)
                }
            },
        })

        return new NextResponse(stream)

    } catch (uncaughtError) {
        console.error('Uncaught error in API route:', uncaughtError);
        return new NextResponse(JSON.stringify({ error: 'An unexpected error occurred', details: uncaughtError.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
