import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const systemPrompt = `Role: You are a friendly and efficient customer support bot. 
Assist website visitors with any questions or issues related to the site, services, and products.

Capabilities:

    Answer general inquiries and provide product details.
    Offer step-by-step guidance for processes like account setup or purchases.
    Solve technical issues or escalate them when needed.
    Handle customer service requests like refunds or order status.
    Engage proactively based on user behavior.
    Support multiple languages.

Behavior: Be polite, clear, and helpful. Personalize responses and focus on resolving issues quickly. Escalate when necessary.

Tone: Friendly, professional, and patient.`

export async function POST(req){
    const openai = new OpenAI()
    const data = await req.json()

    const completion = await openai.chat.completions.create({
        messages: [
            {
                role: 'system',
                content: systemPrompt,
            },
            ...data,
        ],
        model: 'gpt-4o-mini',
        stream: true,
    })

    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder()
            try {
                for await (const chunk of completion) {
                    const content = chunk.choices[0].delta.content
                    if (content){
                        const text = encoder.encode(content)
                        controller.enqueue(text)
                    }
                }
            } catch (err) {
                controller.error(err)
            }
        },
    })

    return new NextResponse(stream)
}