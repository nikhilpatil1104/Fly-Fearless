import os
import base64
from fastapi import APIRouter, UploadFile, File, HTTPException
from openai import AsyncOpenAI

router = APIRouter()
client = AsyncOpenAI(api_key=os.environ.get("OPENAI_API_KEY", ""))

VISION_PROMPT = """You are analyzing a travel document (boarding pass, e-ticket, itinerary, or airport map).

Extract ALL available information and return it as valid JSON with these fields (use null for missing fields):

{
  "documentType": "boarding_pass | e_ticket | itinerary | airport_map | other",
  "passengerName": null,
  "airline": null,
  "airlineCode": null,
  "flightNumber": null,
  "origin": { "iata": null, "city": null, "airport": null },
  "destination": { "iata": null, "city": null, "airport": null },
  "departureDate": null,
  "departureTime": null,
  "arrivalDate": null,
  "arrivalTime": null,
  "seat": null,
  "gate": null,
  "boardingTime": null,
  "bookingReference": null,
  "confirmationCode": null,
  "cabinClass": null,
  "baggage": null,
  "terminal": null,
  "aircraft": null,
  "mealPreference": null,
  "frequentFlyerNumber": null,
  "additionalInfo": null
}

Return ONLY valid JSON. No preamble, no explanation, no markdown backticks."""


ALLOWED_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"}
MAX_SIZE_MB = 10


@router.post("/analyze")
async def analyze_document(file: UploadFile = File(...)):
    """Analyze a boarding pass or travel document using GPT-4o Vision."""

    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{file.content_type}'. Upload JPG, PNG, WebP, or PDF.",
        )

    content = await file.read()
    size_mb = len(content) / (1024 * 1024)
    if size_mb > MAX_SIZE_MB:
        raise HTTPException(
            status_code=413,
            detail=f"File too large ({size_mb:.1f} MB). Maximum is {MAX_SIZE_MB} MB.",
        )

    b64 = base64.b64encode(content).decode("utf-8")
    media_type = file.content_type

    # GPT-4o Vision doesn't support PDF natively — convert PDF to note
    if media_type == "application/pdf":
        raise HTTPException(
            status_code=422,
            detail="PDF analysis not yet supported. Please upload a screenshot or photo of your document.",
        )

    try:
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{media_type};base64,{b64}",
                                "detail": "high",
                            },
                        },
                        {"type": "text", "text": VISION_PROMPT},
                    ],
                }
            ],
            max_tokens=1000,
            temperature=0,
        )

        raw = response.choices[0].message.content or "{}"
        clean = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()

        import json
        try:
            data = json.loads(clean)
        except json.JSONDecodeError:
            data = {"raw": raw, "parseError": "Could not parse structured data"}

        return {"success": True, "data": data, "filename": file.filename}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vision analysis error: {str(e)}")
