from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Session
from .serializers import SessionSerializer
from . import utils
from django.shortcuts import get_object_or_404
import json
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

class QueryView(APIView):
    """
    POST /api/query/
    { "question": "...", "clarifiers": "" }
    """
    def post(self, request):
        body = request.data
        question = body.get("question") or ""
        clarifiers = body.get("clarifiers","")
        if not question:
            return Response({"error":"question required"}, status=status.HTTP_400_BAD_REQUEST)

        # tavily search snippets
        tavily_text = utils.tavily_search_text(question)

        topic, detected_company = utils.detect_topic(question, tavily_text)
        if topic == "company" and not detected_company:
            detected_company = utils.detect_company_from_text(tavily_text)

        prompt = utils.build_answer_prompt(topic, question, clarifiers, tavily_text, company=detected_company)
        try:
            raw = utils.call_gemini_rest(prompt)
        except Exception as e:
            return Response({"error":"AI API failed","detail":str(e)}, status=500)

        answer_json = utils.extract_json(raw)
        # store session
        s = Session.objects.create(company=detected_company or "", last_topic=topic, history=[])
        entry = {
            "question": question,
            "clarifiers": clarifiers,
            "topic": topic,
            "company": detected_company,
            "answer_json": answer_json,
            "answer_raw": raw,
            "ts": str(s.created_at)
        }
        s.append_history(entry)

        # generate dynamic options (AI)
        tavily_context = utils.tavily_search_text(detected_company or topic)
        options = utils.dynamic_options_ai(topic, detected_company, answer_json, tavily_context)

        resp = {
            "session_id": str(s.id),
            "topic": topic,
            "company": detected_company,
            "answer": json.loads(answer_json) if answer_json and answer_json.startswith("{") else answer_json,
            "options": options
        }
        return Response(resp, status=201)

@method_decorator(csrf_exempt, name='dispatch')
class FollowupView(APIView):
    """
    POST /api/followup/
    { "session_id": "...", "option_index": 1 } OR { "session_id":"...", "custom":"..." }
    """
    def post(self, request):
        body = request.data
        sid = body.get("session_id")
        if not sid:
            return Response({"error":"session_id required"}, status=400)
        session = get_object_or_404(Session, id=sid)

        # get last answer from session history
        last = session.history[-1] if session.history else {}
        previous_json = last.get("answer_json","")
        topic = session.last_topic or last.get("topic","general")
        company = session.company or last.get("company", "")

        if "custom" in body:
            follow_text = body.get("custom")
        else:
            opt_index = body.get("option_index")
            if opt_index is None:
                return Response({"error":"option_index or custom required"}, status=400)
            # regenerate options just in case
            tavily_context = utils.tavily_search_text(company or topic)
            options = utils.dynamic_options_ai(topic, company, previous_json, tavily_context)
            try:
                follow_text = options[int(opt_index)-1]
            except Exception:
                return Response({"error":"invalid option index"}, status=400)

        # build followup prompt and call AI
        prompt = utils.build_followup_prompt(follow_text, previous_json, {"company": company, "topic": topic})
        try:
            raw = utils.call_gemini_rest(prompt)
        except Exception as e:
            return Response({"error":"AI error","detail":str(e)}, status=500)

        answer_json = utils.extract_json(raw)
        entry = {
            "question": follow_text,
            "topic": topic,
            "company": company,
            "answer_json": answer_json,
            "answer_raw": raw,
            "ts": str(session.created_at)
        }
        session.append_history(entry)

        # new dynamic options
        tavily_context = utils.tavily_search_text(company or topic)
        options = utils.dynamic_options_ai(topic, company, answer_json, tavily_context)

        resp = {
            "session_id": str(session.id),
            "answer": json.loads(answer_json) if answer_json and answer_json.startswith("{") else answer_json,
            "options": options
        }
        return Response(resp, status=200)

class SessionDetailView(APIView):
    def get(self, request, session_id):
        session = get_object_or_404(Session, id=session_id)
        ser = SessionSerializer(session)
        return Response(ser.data)
