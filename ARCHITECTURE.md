# Project Architecture & Data Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FastAPI Application                     │
│                       (main.py)                             │
└────┬──────────────────────────────────────────────────────┬─┘
     │                                                      │
     ├────────────────────────────────────────────────────┐ │
     │                                                    │ │
     │          ┌───────────────────────────┐             │ │
     │          │   Static File Mount       │             │ │
     │          │  /app/static/css/style.css│             │ │
     │          │  /app/static/js/app.js    │             │ │
     │          └───────────────────────────┘             │ │
     │                                                    │ │
     │          ┌──────────────────────────┐              │ │
     │          │   Jinja2 Templates       │              │ │
     │          │ /app/templates/index.html│              │ │
     │          └──────────────────────────┘              │ │
     │                                                    │ │
     └────────────────────────────────────────────────────┘ │
                                                            │
     ┌────────────────────────────────────────────────────┐ │
     │                                                    │ │
     │          ┌──────────────────────────┐              │ │
     │          │   app/config.py          │              │ │
     │          │  Configuration           │              │ │
     │          └──────────────────────────┘              │ │
     │                       │                            │ │
     │                       ▼                            │ │
     │          ┌──────────────────────────┐              │ │
     │          │   app/ai_client.py       │              │ │
     │          │  AI Generation Logic     │              │ │
     │          └──────────────────────────┘              │ │
     │                       │                            │ │
     │                       ▼                            │ │
     │          ┌──────────────────────────┐              │ │
     │          │   app/prompts.py         │              │ │
     │          │  Prompt Templates        │              │ │
     │          └──────────────────────────┘              │ │
     │                       │                            │ │
     │                       ▼                            │ │
     │          ┌──────────────────────────┐              │ │
     │          │  Google Gemini API       │              │ │
     │          │ (AI Generation)          │              │ │
     │          └──────────────────────────┘              │ │
     │                                                    │ │
     └────────────────────────────────────────────────────┘ │
                                                            
```

## Request/Response Flow

### Test Plan Generation

```
User Interface (Browser)
         │
         │ POST /generate-plan
         │ (start_date, end_date, feature_summary, requirements)
         ▼
┌─────────────────────────┐
│   app/main.py           │
│ generate_plan_endpoint()│
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  app/ai_client.py       │
│ generate_test_plan()    │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  app/prompts.py         │
│ get_test_plan_prompt()  │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  Google Gemini API      │
│  (generate_content)     │
└──────────┬──────────────┘
           │
           ▼ (Markdown Response)
┌─────────────────────────┐
│  main.py                │
│  (HTMLResponse)         │
└──────────┬──────────────┘
           │
           ▼
User Interface (rendered markdown)
```

### Test Case Generation

```
User Interface (Browser)
         │
         │ POST /generate-cases
         │ (feature_summary, requirements, format_type, json_schema)
         ▼
┌─────────────────────────┐
│   app/main.py           │
│generate_cases_endpoint()│
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  app/ai_client.py       │
│ generate_test_cases()   │
└──────────┬──────────────┘
           │
           ├─► Format Check
           │   ├─ gherkin
           │   ├─ json
           │   └─ steps
           │
           ▼
┌─────────────────────────┐
│  app/prompts.py         │
│format-specific prompts()│
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  Google Gemini API      │
│  (generate_content)     │
└──────────┬──────────────┘
           │
           ▼ (Response)
┌─────────────────────────┐
│  main.py                │
│  (HTMLResponse)         │
└──────────┬──────────────┘
           │
           ▼
User Interface (rendered response)
```

## File Dependencies

```
main.py
├── FastAPI, Request, Form
├── Jinja2Templates, StaticFiles
├── Path (pathlib)
├── app.ai_client
│   ├── generate_test_plan()
│   └── generate_test_cases()
└── app.config (indirect)

app/ai_client.py
├── google.genai
├── app.config
│   ├── GOOGLE_API_KEY
│   └── MODEL_NAME
└── app.prompts
    ├── get_test_plan_prompt()
    ├── get_test_cases_prompt()
    ├── get_gherkin_format_instruction()
    ├── get_json_format_instruction()
    └── get_steps_format_instruction()

app/config.py
├── os, pathlib
├── dotenv.load_dotenv
└── Environment Variables (.env)

static/js/app.js
├── marked.js (CDN)
├── highlight.js (CDN)
└── Fetch API
    ├── /generate-plan
    └── /generate-cases

templates/index.html
├── Jinja2 template syntax
├── {{ url_for() }} (FastAPI feature)
├── static/css/style.css
└── static/js/app.js
```

## Module Responsibilities

```
┌─────────────────────────────────────┐
│         main.py                     │
│  Routes & FastAPI Configuration     │
│  ✓ Request routing                  │
│  ✓ Template rendering               │
│  ✓ Static file serving              │
└─────────────────────────────────────┘
                △
                │
                │ uses
                │
┌─────────────────────────────────────┐
│      app/ai_client.py               │
│  AI Generation Logic                │
│  ✓ API client initialization        │
│  ✓ Test plan generation             │
│  ✓ Test case generation             │
└─────────────────────────────────────┘
                △
                │
                │ uses
                │
┌──────────────────────────┬──────────────────────────┐
│     app/config.py        │    app/prompts.py        │
│ Configuration Management │  Prompt Templates        │
│ ✓ API keys               │  ✓ Test plan prompt      │
│ ✓ Model selection        │  ✓ Test case prompts     │
│ ✓ App directories        │  ✓ Format instructions   │
│ ✓ Settings               │  ✓ Customizable prompts  │
└──────────────────────────┴──────────────────────────┘
```

## Data Models (Implicit)

```javascript
// Test Plan Request
{
  start_date: string,       // ISO 8601 format
  end_date: string,         // ISO 8601 format
  feature_summary: string,  // Description of feature
  requirements: string      // Feature requirements
}

// Test Cases Request
{
  feature_summary: string,  // Description of feature
  requirements: string,     // Feature requirements
  format_type: string,      // "gherkin" | "json" | "steps"
  json_schema: string?      // Optional JSON schema example
}

// AI Response (Text)
{
  text: string             // Markdown formatted response
}
```

## Configuration Flow

```
.env File
    │
    ├─ GOOGLE_API_KEY
    ├─ DEBUG
    ├─ HOST
    └─ PORT
         │
         ▼
  app/config.py (load_dotenv)
         │
         ├─ GOOGLE_API_KEY
         ├─ MODEL_NAME
         ├─ BASE_DIR
         ├─ STATIC_DIR
         ├─ TEMPLATES_DIR
         └─ Other Settings
              │
              ▼
         app/ai_client.py
              │
              ▼
         main.py
```

## Deployment Considerations

```
Production Deployment:
├─ Set GOOGLE_API_KEY in environment
├─ Set DEBUG=False
├─ Use proper WSGI server (Gunicorn, Uvicorn with multiple workers)
├─ Set HOST/PORT appropriately
├─ Use reverse proxy (Nginx, Apache)
├─ Enable HTTPS/SSL
├─ Set up logging
├─ Configure CORS if needed
└─ Use environment-specific .env files

Development:
├─ Use .env file with API key
├─ Set DEBUG=True
├─ Use uvicorn --reload
└─ Keep configuration in app/config.py
```

