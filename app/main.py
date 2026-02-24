"""
Main Application Entry Point
"""

from fastapi import FastAPI, Request, Form
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import asyncio
import logging

from app.ai_client import generate_test_plan, generate_test_cases

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AI Test Assistant",
    description="Generate test plans and cases using AI",
    version="0.1.0"
)

BASE_DIR = Path(__file__).parent

app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")

templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))


@app.get("/", response_class=HTMLResponse)
async def get_form(request: Request):
    """Serve the main page."""
    return templates.TemplateResponse("index.html", {"request": request})


@app.post("/generate-plan", response_class=HTMLResponse)
async def generate_plan_endpoint(
    start_date: str = Form(...),
    end_date: str = Form(...),
    feature_summary: str = Form(...),
    requirements: str = Form(...),
):
    """Handle test plan generation requests."""
    logger.info("Received generate-plan request: start=%s end=%s", start_date, end_date)
    try:
        # run the blocking AI call in a thread
        result = await asyncio.to_thread(generate_test_plan, start_date, end_date, feature_summary, requirements)
        return HTMLResponse(content=result)
    except Exception as e:
        logger.exception("Error generating test plan")
        return HTMLResponse(content=f"Error generating test plan: {e}", status_code=500)


@app.post("/generate-cases", response_class=HTMLResponse)
async def generate_cases_endpoint(
    feature_summary: str = Form(...),
    requirements: str = Form(...),
    format_type: str = Form(...),
    json_schema: str = Form(None),
):
    """Handle test case generation requests."""
    logger.info("Received generate-cases request: format=%s", format_type)
    try:
        # run the blocking AI call in a thread
        result = await asyncio.to_thread(generate_test_cases, feature_summary, requirements, format_type, json_schema)
        return HTMLResponse(content=result)
    except Exception as e:
        logger.exception("Error generating test cases")
        return HTMLResponse(content=f"Error generating test cases: {e}", status_code=500)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

