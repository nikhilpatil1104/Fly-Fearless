import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routes import flights, chat, upload, analytics

load_dotenv()

app = FastAPI(
    title="SkyRisk API",
    description="Production flight data, AI chat, and analytics API",
    version="2.0.0",
)

# CORS — allow Vercel frontend + localhost dev
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    os.getenv("FRONTEND_URL", ""),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o for o in origins if o],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(flights.router, prefix="/api/flights", tags=["flights"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(upload.router, prefix="/api/upload", tags=["upload"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])


@app.get("/")
async def root():
    return {"service": "SkyRisk API", "version": "2.0.0", "status": "ok"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
