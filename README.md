# AI Test Assistant

An AI-powered test planning and test case generation tool using FastAPI and Google's Gemini API.

## Features

- **Test Plan Generation**: Automatically generate comprehensive test plans with scope, strategies, and timelines
- **Test Case Generation**: Create test cases in multiple formats:
  - BDD (Gherkin) format
  - JSON format with custom schemas
  - Test Steps format
- **Smart UI**: Interactive web interface with markdown rendering and code highlighting

## Project Structure

```
ai-assistant/
├── app/                          # Main application package
│   ├── main.py                   # FastAPI application entry point
│   ├── clients/                  # AI client implementations
│   ├── static/                   # Static files (CSS, JS)
│   ├── templates/                # HTML templates
│   ├── config.py                 # Configuration settings
│   ├── ai_client.py              # AI API client and generation logic
│   └── prompts.py                # Prompt templates for AI
├── tests/                        # Test suite
│   └── e2e/                      # Playwright end-to-end tests
├── pyproject.toml                # Project configuration
├── .env.example                  # Environment variables template
├── README.md                     # This file
└── uv.lock                       # Dependency lock file
```

## Setup

### Prerequisites

- Python 3.13+
- Google Gemini API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ai-assistant
```

2. Create a `.env` file from the template:
```bash
cp .env.example .env
```

3. Add your Google API key to `.env`:
```
GOOGLE_API_KEY=your_actual_api_key_here
```

4. Install dependencies using `uv`:
```bash
uv sync
```

### Running the Application

```bash
uv run python -m uvicorn app.main:app --reload
```

The application will be available at `http://localhost:8000`

## Usage

1. Open the web interface at `http://localhost:8000`
2. **Generate Test Plan**: 
   - Enter start and end dates
   - Provide feature summary and requirements
   - Click "Generate Test Plan"
3. **Generate Test Cases**:
   - Click "View Test Case Generator"
   - Select your desired format (Gherkin, JSON, or Steps)
   - For JSON, optionally provide a custom schema
   - Click "Generate Test Cases"

## Dependencies

- **FastAPI**: Modern web framework for building APIs
- **Uvicorn**: ASGI server for running FastAPI
- **Google Genai**: Official Google AI SDK
- **Jinja2**: Template engine for HTML rendering
- **Python-multipart**: For handling form data

See `pyproject.toml` for the complete list of dependencies.

## Configuration

Edit `app/config.py` to customize:
- Model selection (default: gemini-2.5-flash)
- API endpoint configuration
- Application directories

## Environment Variables

- `GOOGLE_API_KEY`: Your Google Gemini API key (required)
- `DEBUG`: Enable debug mode (default: False)
- `HOST`: Server host address (default: 0.0.0.0)
- `PORT`: Server port (default: 8000)

## Contributing

Feel free to submit issues and enhancement requests!
