from fastapi import APIRouter
from pydantic import BaseModel
import anthropic
import os

router = APIRouter(prefix="/score", tags=["Company Scoring"])

class StartupProfile(BaseModel):
    name: str
    description: str
    category: str
    stage: str
    co2ReductionTonnesPerYear: float = 0
    jobsCreated: int = 0

class ScoreRequest(BaseModel):
    startup_id: str
    profile: StartupProfile

class ScoreResponse(BaseModel):
    startup_id: str
    overall_score: int
    growth_score: int
    impact_score: int
    risk_score: int
    narrative: str

@router.post("/{startup_id}", response_model=ScoreResponse)
async def score_company(startup_id: str, body: ScoreRequest) -> ScoreResponse:
    p = body.profile
    client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

    prompt = f"""You are an expert climate investment analyst. Score this climate startup objectively.

Company: {p.name}
Category: {p.category}
Stage: {p.stage}
Description: {p.description}
CO2 Reduction: {p.co2ReductionTonnesPerYear} tonnes/year
Jobs Created: {p.jobsCreated}

Provide scores from 0-100 for:
1. overall_score: Overall investment attractiveness
2. growth_score: Growth potential based on stage, category, team
3. impact_score: Environmental/social impact potential
4. risk_score: Risk level (0=very safe, 100=very risky)

Also write a 2-3 sentence narrative summary for investors.

Respond ONLY with valid JSON in exactly this format:
{{"overall_score": 75, "growth_score": 80, "impact_score": 85, "risk_score": 40, "narrative": "..."}}"""

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=512,
        messages=[{"role": "user", "content": prompt}],
    )

    import json
    text = message.content[0].text.strip()
    # Extract JSON if wrapped in markdown
    if "```" in text:
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    data = json.loads(text.strip())

    return ScoreResponse(
        startup_id=startup_id,
        overall_score=int(data["overall_score"]),
        growth_score=int(data["growth_score"]),
        impact_score=int(data["impact_score"]),
        risk_score=int(data["risk_score"]),
        narrative=str(data["narrative"]),
    )
