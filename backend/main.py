from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from pipeline import run_research_pipeline


app = FastAPI(
    title="ResearchMind API",
    description="Multi-Agent AI Research System",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],

)


# Request schema
class ResearchRequest(BaseModel):
    topic: str


# Health check
@app.get("/")
def root():
    return {
        "message": "ResearchMind API is running"
    }


# Research endpoint
@app.post("/research")
def research(request: ResearchRequest):
    topic = request.topic.strip()

    if not topic:
        raise HTTPException(
            status_code=400,
            detail="Research topic cannot be empty."
        )

    try:
        result = run_research_pipeline(topic)

        # Normal conversation
        if result["type"] == "chat":
            return {
                "type": "chat",
                "response": result["response"]
            }

        # Research response
        return {
            "type": "research",
            "topic": topic,
            "search_results": result["search_results"],
            "scraped_content": result["scraped_content"],
            "report": result["report"],
            "feedback": result["feedback"]
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Research pipeline failed: {str(e)}"
        )