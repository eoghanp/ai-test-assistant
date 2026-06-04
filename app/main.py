"""
Main Application Entry Point
"""

from fastapi import FastAPI, Request, Form
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import asyncio
import logging

from app.ai_client import generate_test_plan, generate_test_cases
from app.clients.base import AIClientError

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
    ai_provider: str = Form(None),
):
    """Handle test plan generation requests."""
    logger.info("Received generate-plan request: start=%s end=%s provider=%s", start_date, end_date, ai_provider)
    try:
        # run the blocking AI call in a thread
        result = await asyncio.to_thread(generate_test_plan, start_date, end_date, feature_summary, requirements, provider=ai_provider)
        return HTMLResponse(content=result)
    except AIClientError as e:
        logger.exception("AI Client error generating test plan")
        if e.code is not None:
            return JSONResponse(
                status_code=e.code,
                content={
                    "error": "AI Client Error",
                    "message": e.message,
                    "status_code": e.code,
                    "details": e.details
                }
            )
        return HTMLResponse(content=f"Error generating test plan: {e.message}", status_code=500)
    except Exception as e:
        logger.exception("Error generating test plan")
        return HTMLResponse(content=f"Error generating test plan: {e}", status_code=500)


@app.post("/generate-cases", response_class=HTMLResponse)
async def generate_cases_endpoint(
    feature_summary: str = Form(...),
    requirements: str = Form(...),
    format_type: str = Form(...),
    json_schema: str = Form(None),
    ai_provider: str = Form(None),
):
    """Handle test case generation requests."""
    logger.info("Received generate-cases request: format=%s provider=%s", format_type, ai_provider)
    try:
        # run the blocking AI call in a thread
        result = await asyncio.to_thread(generate_test_cases, feature_summary, requirements, format_type, json_schema, provider=ai_provider)
        return HTMLResponse(content=result)
    except AIClientError as e:
        logger.exception("AI Client error generating test cases")
        if e.code is not None:
            return JSONResponse(
                status_code=e.code,
                content={
                    "error": "AI Client Error",
                    "message": e.message,
                    "status_code": e.code,
                    "details": e.details
                }
            )
        return HTMLResponse(content=f"Error generating test cases: {e.message}", status_code=500)
    except Exception as e:
        logger.exception("Error generating test cases")
        return HTMLResponse(content=f"Error generating test cases: {e}", status_code=500)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

