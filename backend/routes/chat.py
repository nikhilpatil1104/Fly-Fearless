import os
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from openai import AsyncOpenAI

router = APIRouter()
client = AsyncOpenAI(api_key=os.environ.get("OPENAI_API_KEY", ""))

SYSTEM_PROMPT = """You are SkyRisk AI, a specialist flight assistant embedded in the SkyRisk flight booking platform.

You ONLY answer questions about:
- Flight delays, cancellations, and disruptions
- Best time to book flights (timing, day-of-week, advance notice)
- Baggage rules, fees, and allowances by airline
- Airport tips, navigation, lounges, and transit
- Airline comparisons (reliability, service, routes)
- Weather impacts on travel
- Visa and entry requirements for countries
- Pricing trends and fare patterns
- Specific route information and alternatives
- Flight duration and layover options

For ANY other topic: respond with exactly — "I'm a flight specialist. For [topic], try searching online."

Keep responses concise (under 150 words), helpful, and conversational. Use bullet points for lists.
When possible, give specific numbers, airlines, or routes rather than generic advice.
Never make up flight prices or schedules — acknowledge when you don't have real-time data."""


class Message(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: list[Message]
    stream: bool = True


@router.post("/")
async def chat(req: ChatRequest):
    """Stream GPT-4o responses for the flight AI assistant."""

    history = [{"role": m.role, "content": m.content} for m in req.messages]

    if req.stream:
        async def generate():
            try:
                stream = await client.chat.completions.create(
                    model="gpt-4o",
                    messages=[{"role": "system", "content": SYSTEM_PROMPT}, *history],
                    max_tokens=500,
                    temperature=0.7,
                    stream=True,
                )
                async for chunk in stream:
                    delta = chunk.choices[0].delta
                    if delta.content:
                        yield f"data: {delta.content}\n\n"
                yield "data: [DONE]\n\n"
            except Exception as e:
                yield f"data: [ERROR] {str(e)}\n\n"

        return StreamingResponse(generate(), media_type="text/event-stream")

    # Non-streaming fallback
    try:
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "system", "content": SYSTEM_PROMPT}, *history],
            max_tokens=500,
            temperature=0.7,
        )
        return {"content": response.choices[0].message.content}
    except Exception as e:
        return {"content": f"I'm having trouble connecting right now. Please try again in a moment.", "error": str(e)}
