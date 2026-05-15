import json
import os
import re
from typing import Any, Dict, List, Optional

import requests
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv(".env.local")
load_dotenv()

# NOTE:
# This FastAPI server is a legacy/optional backend.
# The default development runtime in this project uses `node server.js`.
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"
OPENAI_API_KEY = (os.getenv("OPENAI_API_KEY") or os.getenv("VITE_OPENAI_API_KEY") or "").strip()
OPENAI_MODEL = os.getenv("OPENAI_MODEL") or "gpt-4.1-mini"


class OpenAIRequest(BaseModel):
    prompt: str


class OpenAIReportRequest(BaseModel):
    fileName: str
    fileType: str
    sourceText: str
    promptOverride: Optional[str] = None
    analysisMode: Optional[str] = None
    skipRecommendations: Optional[bool] = False


def call_openai(prompt: str, temperature: float = 0.2) -> str:
    if not prompt:
        raise HTTPException(status_code=400, detail="No prompt provided")

    if not OPENAI_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="OpenAI API key is missing. Set OPENAI_API_KEY (recommended) or VITE_OPENAI_API_KEY.",
        )

    response = requests.post(
        OPENAI_API_URL,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {OPENAI_API_KEY}",
        },
        json={
            "model": OPENAI_MODEL,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": temperature,
        },
        timeout=90,
    )

    if not response.ok:
        raise HTTPException(status_code=response.status_code, detail=f"OpenAI API call failed: {response.text}")

    data = response.json()
    text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
    if not text:
        raise HTTPException(status_code=502, detail=f"No text found in OpenAI response: {data}")

    return text


def extract_json_array(text: str) -> List[Dict[str, Any]]:
    if not text:
        raise HTTPException(status_code=502, detail="Model response was empty")

    match = re.search(r"\[[\s\S]*\]", text)
    raw = match.group(0) if match else text
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=502, detail=f"Failed to parse JSON array: {exc}") from exc

    if not isinstance(parsed, list):
        raise HTTPException(status_code=502, detail="Expected JSON array response")

    return parsed


def to_text(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip()


def fallback_report_type(report_no: str) -> str:
    upper = report_no.upper()
    has_c = "C" in upper
    has_k = "K" in upper
    has_ai = "AI" in upper
    has_b = "B" in upper

    if has_k:
        return "KOLAS 시험성적서"
    if has_ai and has_b:
        return "KOLAS AI 시험성적서"
    if has_c and has_ai:
        return "일반 AI 성적서"
    if has_c and not has_ai:
        return "일반 성적서"
    return ""


def normalize_report_type(raw_type: str, report_no: str) -> str:
    text = (raw_type or "").strip()

    if re.search(r"kolas", text, re.IGNORECASE) and re.search(r"\bai\b", text, re.IGNORECASE):
        return "KOLAS AI 시험성적서"
    if re.search(r"kolas", text, re.IGNORECASE):
        return "KOLAS 시험성적서"
    if re.search(r"\bai\b", text, re.IGNORECASE):
        return "일반 AI 성적서"
    if re.search(r"성적서|시험성적서|보고서", text):
        return "일반 성적서"

    return fallback_report_type(report_no)


def sanitize_extracted_rows(rows: List[Dict[str, Any]], file_name: str) -> List[Dict[str, str]]:
    sanitized: List[Dict[str, str]] = []
    for row in rows:
        report_no = to_text(row.get("Report_No")) or file_name
        sanitized.append(
            {
                "Report_No": report_no,
                "company_name": to_text(row.get("company_name")),
                "gubun_code": normalize_report_type(to_text(row.get("gubun_code")), report_no),
                "created_at": to_text(row.get("created_at")),
                "productName": to_text(row.get("productName")),
                "overview": to_text(row.get("overview")),
                "Test_Item": to_text(row.get("Test_Item")),
                "Parameter": to_text(row.get("Parameter")),
                "testResult": to_text(row.get("testResult")),
            }
        )
    return sanitized


def merge_recommendations(
    base_rows: List[Dict[str, Any]], recommendation_rows: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    merged: List[Dict[str, Any]] = []
    for idx, row in enumerate(base_rows):
        rec = recommendation_rows[idx] if idx < len(recommendation_rows) else {}
        merged.append(
            {
                **row,
                "representativeDomain": to_text(rec.get("representativeDomain")),
                "mainTechField": to_text(rec.get("mainTechField")),
                "AI_Domain": to_text(rec.get("AI_Domain")),
                "AI_Tech": to_text(rec.get("AI_Tech")),
            }
        )
    return merged


def build_extraction_prompt(source_text: str, file_name: str, prompt_override: Optional[str]) -> str:
    if prompt_override and prompt_override.strip():
        return prompt_override.strip()

    return f"""아래는 시험성적서 원문입니다.
파일명: {file_name}

{source_text}

위 문서에서 다음 필드만 추출해서 JSON 배열로 반환하세요.
- Report_No: 문서 내 성적서번호를 그대로 작성. 없으면 파일명 사용
- company_name: 기관명 또는 회사명
- gubun_code: 문서에 명시된 보고서 종류 문구
- created_at: 발급 일자
- productName: 제품명
- overview: 개요
- Test_Item: 시험항목(문서 내 시험 결과 요약 기준)
- Parameter: 신청기관 기준(문서 내 시험 결과 요약 기준)
- testResult: 시험결과(문서 내 시험 결과 요약 기준)

규칙:
- company_name, productName, overview는 문서에서 찾아 원문 그대로 작성하세요.
- Test_Item, Parameter, testResult는 문서 내 시험 결과 요약을 기반으로 작성하세요.
- 대표 도메인/주요기술/AI 추천 필드는 이 단계에서 작성하지 마세요.
- 번역, 요약, 의역하지 마세요.
- 시험항목이 여러 개면 배열의 각 원소로 분리하세요.
- 문서에 없는 값만 빈 문자열로 두세요.
- 설명 문장 없이 JSON 배열만 반환하세요.
"""


def build_recommendation_prompt(extracted_rows: List[Dict[str, Any]]) -> str:
    return f"""다음은 시험성적서에서 추출된 원문 기반 JSON 배열입니다.
{json.dumps(extracted_rows, ensure_ascii=False, indent=2)}

각 행에 대해 아래 추천 필드 4개만 분석해서 JSON 배열로 반환하세요.
- representativeDomain: 시험항목별 대표 도메인
- mainTechField: 주요기술 분야
- AI_Domain: 도메인(AI)추천
- AI_Tech: 적용기술(AI)추천

규칙:
- 원본 필드는 수정하지 말고 추천 필드만 판단하세요.
- representativeDomain은 시험항목별 대표 도메인으로 작성하세요.
- mainTechField는 다음 중 하나만 사용하세요:
  인공지능(AI), 블록체인, 메타버스, 사물인터넷(IoT), 임베디드 시스템, 로봇, 클라우드, 정보보안, 통신, 빅데이터, 그외
- AI_Domain은 해당 시험항목을 대표적으로 사용하는 도메인으로 추천하고 반드시 괄호 설명을 포함하세요.
- AI_Tech는 해당 시험항목을 대표적으로 사용하는 적용기술로 추천하고 반드시 괄호 설명을 포함하세요.
- mainTechField는 반드시 시험항목 기준으로 판단하세요. (제품명/개요는 보조 참고만 허용)
- 설명 문장 없이 JSON 배열만 반환하세요.
"""


@app.post("/openai-analyze")
async def openai_analyze(request: OpenAIRequest):
    return {"generated_text": call_openai(request.prompt, temperature=0.2)}


@app.post("/gemini-analyze")
async def gemini_analyze_legacy(request: OpenAIRequest):
    # Backward-compatible route name for existing frontend calls.
    return {"generated_text": call_openai(request.prompt, temperature=0.2)}


@app.post("/openai-analyze-report")
async def openai_analyze_report(request: OpenAIReportRequest):
    if not request.fileName or not request.sourceText:
        raise HTTPException(status_code=400, detail="fileName and sourceText are required.")

    extraction_prompt = build_extraction_prompt(request.sourceText, request.fileName, request.promptOverride)
    extracted_text = call_openai(extraction_prompt, temperature=0.1)
    extracted_rows = sanitize_extracted_rows(extract_json_array(extracted_text), request.fileName)

    if not extracted_rows:
        raise HTTPException(status_code=502, detail="No extracted rows returned from extraction step.")

    should_skip_recommendations = bool(request.skipRecommendations) or (request.analysisMode or "").lower() == "fast"
    recommendation_error: Optional[str] = None
    recommendation_rows: List[Dict[str, Any]] = []
    recommendation_prompt = build_recommendation_prompt(extracted_rows)

    if not should_skip_recommendations:
        try:
            recommendation_text = call_openai(recommendation_prompt, temperature=0.2)
            recommendation_rows = extract_json_array(recommendation_text)
        except HTTPException as exc:
            recommendation_error = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
        except Exception as exc:  # Defensive fallback
            recommendation_error = str(exc)
    else:
        recommendation_error = "Recommendation step skipped in fast mode."

    results = merge_recommendations(extracted_rows, recommendation_rows)

    return {
        "results": results,
        "generated_text": json.dumps(results, ensure_ascii=False),
        "recommendationError": recommendation_error,
    }


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
