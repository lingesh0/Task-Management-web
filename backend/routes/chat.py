from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
import httpx
import os

router = APIRouter()

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
GEMINI_MODEL = 'gemini-1.5-flash'
GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"

@router.post('/api/chat')
async def chat_endpoint(request: Request):
    data = await request.json()
    user_message = data.get('message')
    if not user_message:
        return JSONResponse({'response': 'No message provided.'}, status_code=400)
    if not GEMINI_API_KEY:
        return JSONResponse({'response': 'Gemini API key not set.'}, status_code=500)
    async with httpx.AsyncClient() as client:
        r = await client.post(
            f"{GEMINI_API_URL}?key={GEMINI_API_KEY}",
            json={
                "contents": [
                    {"parts": [{"text": user_message}]}
                ]
            }
        )
        result = r.json()
        try:
            reply = result["candidates"][0]["content"]["parts"][0]["text"]
        except Exception:
            reply = "No response from Gemini."
        return {"response": reply} 