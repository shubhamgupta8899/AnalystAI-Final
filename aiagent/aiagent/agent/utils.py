import os
import json
import re
import requests
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")



GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
HEADERS = {
    "Content-Type": "application/json",
    "X-goog-api-key": GEMINI_API_KEY
}

KNOWN_COMPANIES = [
    # Big Tech
    "microsoft", "google", "alphabet", "apple", "amazon", "meta", "facebook",
    "netflix", "tesla", "nvidia", "intel", "amd", "qualcomm", "broadcom",
    "ibm", "oracle", "cisco", "vmware", "salesforce", "adobe",

    # Global Tech & SaaS
    "spotify", "zoom", "dropbox", "slack", "atlassian", "shopify",
    "snowflake", "databricks", "palantir", "asana", "cloudflare",
    "twilio", "digitalocean", "mongodb", "elastic", "zendesk",
    "service now", "red hat", "openai", "deepmind",

    # Gaming
    "ea", "electronic arts", "ubisoft", "activision", "epic games",
    "riot games", "bethesda", "rockstar games", "cd projekt red",
    "supercell", "blizzard", "square enix", "sega",

    # Indian Tech
    "tcs", "infosys", "wipro", "hcl", "tech mahindra", "lti mindtree",
    "persistent", "mphasis", "zoho", "freshworks",

    # Indian Startups + Unicorns
    "swiggy", "zomato", "ola", "oyo", "paytm", "byju", "phonepe",
    "urban company", "naukri", "flipkart",

    # Fintech
    "visa", "mastercard", "paypal", "stripe", "coinbase", "robinhood",
    "revolut", "nubank",

    # Cloud/Infra
    "aws", "azure", "gcp", "google cloud", "digital ocean", "cloudflare",

    # Consulting
    "deloitte", "accenture", "ey", "ernst and young", "kpmg",
    "mckinsey", "bcg", "bain",

    # Automobile Tech
    "bmw", "mercedes", "volvo", "toyota", "honda",

    # Semiconductor
    "tsmc", "samsung", "micron", "arm",

    # E-commerce & Retail
    "ebay", "alibaba", "walmart", "target",

    # Others (Global)
    "siemens", "sap", "huawei", "xiaomi", "lenovo", "philips",
]


# ---------------------------------------------------------
# TAVILY SEARCH
# ---------------------------------------------------------
def tavily_search_text(query, max_hits=6):
    """Fetch short web snippets."""
    try:
        from tavily import TavilyClient
        client = TavilyClient(api_key=TAVILY_API_KEY)
        res = client.search(query=query)
        hits = res.get("results", [])[:max_hits]

        out = []
        for h in hits:
            title = h.get("title", "No title")
            url = h.get("url", "")
            snippet = (h.get("snippet") or "")[:200]
            out.append(f"- {title}\n  URL: {url}\n  Snippet: {snippet}")

        return "\n".join(out)

    except Exception:
        return ""


# ---------------------------------------------------------
# GEMINI CALL
# ---------------------------------------------------------
def call_gemini_rest(prompt, temperature=0.25, timeout=30):
    """Call Gemini with strict JSON expectation."""
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": temperature,
            "top_p": 0.8,
            "top_k": 40
        }
    }

    resp = requests.post(GEMINI_URL, headers=HEADERS, json=payload, timeout=timeout)
    resp.raise_for_status()
    data = resp.json()

    text = (
        data.get("candidates", [{}])[0]
            .get("content", {})
            .get("parts", [{}])[0]
            .get("text", "")
    )

    # Remove markdown fences
    if text.startswith("```"):
        text = text.replace("```json", "").replace("```", "").strip()

    return text.strip()


# ---------------------------------------------------------
# JSON EXTRACTOR
# ---------------------------------------------------------
def extract_json(raw):
    # Try direct extraction first
    try:
        s = raw.index("{")
        e = raw.rindex("}") + 1
        candidate = raw[s:e]
        json.loads(candidate)
        return candidate
    except Exception:
        pass

    # Fallback regex
    cleaned = raw.replace("```", "")
    m = re.search(r"(\{.*\})", cleaned, re.DOTALL)
    return m.group(1) if m else raw


# ---------------------------------------------------------
# TOPIC DETECTION
# ---------------------------------------------------------
def detect_company_from_text(text):
    if not text:
        return None

    t = text.lower()

    # Full exact match first
    for c in KNOWN_COMPANIES:
        if c == t.strip():
            return c.title()

    # Partial match detection
    for c in KNOWN_COMPANIES:
        if c in t:
            return c.title()

    # Token smart match: (e.g., "I want microsoft job" → "Microsoft")
    words = t.split()
    for w in words:
        for c in KNOWN_COMPANIES:
            if w == c:
                return c.title()

    return None



def detect_topic(user_text, tavily_snippets=""):
    """Detect main domain for structured AI response."""
    text = (user_text or "").lower() + " " + (tavily_snippets or "").lower()

    comp = detect_company_from_text(text)
    if comp:
        return "company", comp

    if any(k in text for k in ["job", "hiring", "resume", "interview", "salary", "careers"]):
        return "job", None

    if any(k in text for k in ["stock", "invest", "investment", "portfolio", "sip", "nifty", "crypto", "mutual fund"]):
        return "finance", None

    if any(k in text for k in ["game", "gaming", "unity", "unreal", "developer", "gamedev"]):
        return "gaming", None

    if any(k in text for k in ["python", "java", "c++", "leetcode", "algorithm", "debug"]):
        return "coding", None

    return "general", None


# ---------------------------------------------------------
# PROMPT: MAIN ANSWER GENERATOR
# ---------------------------------------------------------

def build_answer_prompt(topic, user_q, clarifiers, tavily_text, company=None):
    """
    FIXED VERSION — Removes the rule that forces unknown.
    Ensures full JSON with high-quality factual/estimated info.
    """

    base_context = f"""
You are an AI that MUST respond in STRICT JSON ONLY.
Never include commentary, markdown, explanations, or backticks.

User Question:
{user_q}

Additional Clarifiers:
{clarifiers}

Web Data:
{tavily_text}

RULES:
- NEVER return "unknown".
- NEVER leave fields empty.
- If web data is incomplete, use **industry-standard estimates**, widely known facts, and typical values.
- Fill ALL arrays with at least 2 relevant items.
- JSON must be fully factual, complete, polished.
"""

    # ----- COMPANY -----
    if topic == "company":
        return base_context + f"""

Company Detected: {company}

Return STRICT JSON ONLY with this schema:

{{
  "company_name": "{company}",
  "summary": "",
  "industry": "",
  "founding_year": "",
  "headquarters": "",
  "ceo": "",
  "employee_count": "",
  "global_presence": "",
  "hiring_info": "",
  "roles_open": ["", ""],
  "skills_required": ["", ""],
  "salaries": "",
  "interview_process": "",
  "work_culture": "",
  "tech_stack": ["", ""],
  "products_services": ["", ""],
  "competitors": ["", ""],
  "latest_news": "",
  "actionable_steps": ["", ""]
}}

RULES:
- NO field must ever be left blank.
- NO field must ever be "unknown".
- Use best-known information + reasonable estimates.
- Return ONLY JSON with no wrapper text.
"""
    # ----- JOB -----
    if topic == "job":
        return base_context + """
Return STRICT JSON ONLY:

{
  "summary": "",
  "job_roles": [],
  "required_skills": [],
  "roadmap": [],
  "interview_prep": [],
  "salary_range_india": "",
  "salary_range_global": "",
  "companies_hiring": [],
  "actionable_steps": []
}
"""


    # ----- FINANCE -----
    if topic == "finance":
        return base_context + """

Return ONLY this JSON structure:

{
  "summary": "",
  "options": [],
  "risk_notes": "",
  "suggested_strategy": "",
  "tax_considerations": ""
}
"""

    # ----- GAMING -----
    if topic == "gaming":
        return base_context + """

Return ONLY this JSON structure:

{
  "summary": "",
  "roles": [],
  "required_skills": [],
  "portfolio_advice": "",
  "companies_hiring": []
}
"""

    # ----- CODING -----
    if topic == "coding":
        return base_context + """

Return ONLY this JSON structure:

{
  "summary": "",
  "steps": [],
  "pseudocode": "",
  "complexity": "",
  "example": ""
}
"""

    # ----- GENERAL -----
    return base_context + """

Return ONLY this JSON structure:

{
  "summary": "",
  "steps": [],
  "details": "",
  "example": ""
}
"""


# ---------------------------------------------------------
# AI-GENERATED DYNAMIC FOLLOW-UP OPTIONS
# ---------------------------------------------------------
def dynamic_options_ai(topic, company, previous_json, tavily_text):
    """Generate 6 high-quality relevant follow-up options."""

    prompt = f"""
You are an AI assistant generating SMART follow-up options for the user.

You MUST return STRICT JSON only.

Topic: {topic}
Company: {company}
Previous JSON Answer:
{previous_json}

Relevant Web Snippets:
{tavily_text}

Your task:
- generate 6 follow-up questions the user may want to explore next
- questions must be short, relevant, actionable
- avoid generic questions
- tie them to the detected topic
- DO NOT hallucinate facts; ask only valid follow-ups

Return EXACTLY:

{{
  "options": ["...", "...", "...", "...", "...", "..."]
}}
"""

    try:
        raw = call_gemini_rest(prompt)
        data = extract_json(raw)
        parsed = json.loads(data)
        return parsed.get("options", [])
    except Exception:
        return [
            "Give more details",
            "Explain step-by-step",
            "Provide real examples",
            "Show latest related updates",
            "Compare alternatives",
            "Suggest next recommended actions"
        ]


# ---------------------------------------------------------
# FOLLOW-UP EXPANSION
# ---------------------------------------------------------

def build_followup_prompt(option_text, previous_answer_json, session_context):
    """
    Version 7.5 — Ultra Pro Max Expanded Follow-Up Prompt.
    Extremely deep context, multi-domain logic, hallucination prevention,
    structured thought constraints, and stronger JSON guarantees.
    """

    return f"""
You are an ULTRA-PRECISE MULTI-DOMAIN EXPERT AI.
You expand ONLY the selected follow-up option with maximum clarity and correctness.

=========================
FOLLOW-UP OPTION SELECTED
=========================
{option_text}

======================
PREVIOUS ANSWER (JSON)
======================
{previous_answer_json}

=====================
SESSION CONTEXT
=====================
{session_context}

========================================
GLOBAL RULES — MUST FOLLOW STRICTLY
========================================
1. Output MUST BE ONLY valid JSON.
2. No markdown, no code fences, no commentary.
3. No text outside JSON. Never break JSON format.
4. Must be fully valid using json.loads — NO trailing commas, NO escape errors.
5. Every field must be meaningful, domain-accurate, and non-generic.
6. Must NOT repeat or restate the previous JSON — only EXPAND.
7. If uncertain, use probability-based reasoning instead of hallucinating.
8. Assume all facts must be internally consistent and realistic.

======================================================
OUTPUT FORMAT — STRICT JSON SCHEMA (DO NOT MODIFY IT)
======================================================
{{
  "summary": "2–4 sentence highly condensed explanation of the chosen option. 
              Must reflect expert domain knowledge and high clarity.",

  "details": "Deep, multi-paragraph analysis (but compact). 
              Must contain: reasoning, domain insights, constraints, risks, 
              benefits, best practices, modern trends (2023–2025), 
              comparison of alternatives, and tactical knowledge.",

  "expanded_context": {{
    "domain_specific_analysis": "Add deeper breakdown specific to the domain.",
    "relevant_metrics": ["Include metrics, KPIs, statistics, or indicators."],
    "risk_factors": ["List measurable risks."],
    "opportunities": ["List realistic opportunities grounded in domain facts."],
    "timeline_estimation": "Give a realistic timeline (short/medium/long term)."
  }},

  "next_steps": [
    "Provide 8–12 ultra-specific, actionable steps.",
    "Steps must be ordered logically.",
    "Each must be measurable, practical, and realistic.",
    "Avoid generic statements like 'improve skills' or 'research more'."
  ],

  "resource_recommendations": {{
    "tools": ["List 3–6 tools relevant to the follow-up option."],
    "learning_paths": ["If applicable, give structured learning paths."],
    "industry_sources": ["Include reputable industry references."],
    "communities": ["List communities, forums, or networks to join."],
    "benchmarks": ["Give benchmarks or standards to measure progress."]
  }},

  "confidence_score": "Give a % confidence score (0–100%) based on data, 
                       clarity of context, and typical industry certainty."
}}

================================================
DOMAIN BEHAVIOR RULES (ULTRA INTELLIGENT MODE)
================================================

IF TOPIC = COMPANY:
- Include information on: hiring patterns, org culture, tech stack, 
  salary differentiation by region, competitors, market shifts, 
  hiring cycles, evaluation process, career tracks.
- For Indian companies: consider TCS/Infosys/Wipro/HCL hiring patterns.
- For US companies: consider layoff cycles, hybrid policies, FAANG standards.

IF TOPIC = JOB:
- Include resume filters, ATS behavior, skill mapping,
  interview loop structure, expected salary ranges,
  high-demand skills, hiring funnel probabilities.

IF TOPIC = FINANCE:
- Include Indian taxation, risk categories (low/med/high),
  diversification logic, asset allocation, inflation effects,
  market cycles, SIP vs lump-sum, portfolio balancing.

IF TOPIC = GAMING:
- Include game engines (Unity/Unreal/Godot), pipelines (Art → Dev → QA),
  monetization models, indie vs AAA strategies,
  top gaming studios, asset creation guidelines.

IF TOPIC = CODING:
- Include DSA principles, algorithmic thinking, complexity breakdowns,
  debugging process, test cases, optimization tricks,
  tech interview expectations, system design considerations.

IF TOPIC = GENERAL:
- Keep output simple but structured and logical.

===================================================
HALLUCINATION PREVENTION — CRITICAL RULES
===================================================
- DO NOT fabricate data, proprietary numbers, or confidential information.
- If a fact is unknown, phrase it probabilistically:
  "Most companies typically...", "Based on industry trends...", "Common patterns show..."
- Never invent fake URLs, fake statistics, or fake people.

====================================================
FINAL INSTRUCTION — PRODUCE JSON ONLY
====================================================
NOW produce ONLY the final JSON object. No explanation.
"""
