import json
import logging
import requests
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.config import settings
from app.crud import get_system_setting

logger = logging.getLogger(__name__)

class AIService:
    @staticmethod
    def _get_active_provider(db: Session) -> str:
        provider_setting = get_system_setting(db, "active_ai_provider")
        if provider_setting and provider_setting.value:
            return provider_setting.value.lower()
        return settings.DEFAULT_AI_PROVIDER.lower()

    @staticmethod
    def _get_api_key(db: Session, provider: str) -> str:
        if provider == "groq":
            key_setting = get_system_setting(db, "groq_api_key")
            if key_setting and key_setting.value:
                return key_setting.value
            return settings.GROQ_API_KEY
        elif provider == "huggingface":
            key_setting = get_system_setting(db, "hf_api_key")
            if key_setting and key_setting.value:
                return key_setting.value
            return settings.HF_API_KEY
        return ""

    @classmethod
    def generate_schedule(cls, db: Session, event_type: str, num_sessions: int, num_speakers: int, duration_days: int, break_preferences: str, audience_type: str) -> Dict[str, Any]:
        provider = cls._get_active_provider(db)
        api_key = cls._get_api_key(db, provider)
        
        prompt = (
            f"Generate a {duration_days}-day event schedule for a '{event_type}' with {num_sessions} sessions, "
            f"{num_speakers} speakers, audience type '{audience_type}', and break preferences '{break_preferences}'.\n"
            f"Respond ONLY with a valid raw JSON object matching this structure (do not include markdown wrapping or backticks):\n"
            f"{{\n"
            f"  \"Day1\": [{{ \"time\": \"09:00 AM\", \"title\": \"Keynote\", \"speaker\": \"Speaker A\", \"venue\": \"Hall 1\", \"description\": \"Introductory session.\" }}],\n"
            f"  ... (include keys for Day1, Day2, up to Day{duration_days})\n"
            f"  \"Recommendations\": [\"Add interactive Q&A\", \"Prepare printed hand-outs\"]\n"
            f"}}\n"
        )
        
        if provider == "groq" and api_key:
            try:
                response = requests.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": settings.GROQ_MODEL,
                        "messages": [
                            {"role": "system", "content": "You are a professional event organizer assistant that outputs strict raw JSON only."},
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.3,
                        "max_tokens": 2048
                    },
                    timeout=15
                )
                if response.status_code == 200:
                    content = response.json()["choices"][0]["message"]["content"].strip()
                    # Strip any markdown triple backticks if the model ignores the instruction
                    if content.startswith("```"):
                        content = content.replace("```json", "").replace("```", "").strip()
                    return json.loads(content)
                else:
                    logger.error(f"Groq API Error: {response.text}. Falling back to Hugging Face or Mock.")
            except Exception as e:
                logger.error(f"Groq Exception: {e}. Falling back.")

        # Fallback to Hugging Face
        if (provider == "huggingface" or not api_key) and api_key:
            # Let's use HF inference client endpoint
            try:
                headers = {"Authorization": f"Bearer {api_key}"}
                response = requests.post(
                    f"https://api-inference.huggingface.co/models/{settings.HF_MODEL}",
                    headers=headers,
                    json={"inputs": prompt, "parameters": {"max_new_tokens": 1000, "temperature": 0.3}},
                    timeout=15
                )
                if response.status_code == 200:
                    # Depending on Hugging Face model settings, it might return generated text list
                    res_json = response.json()
                    gen_text = ""
                    if isinstance(res_json, list) and len(res_json) > 0:
                        gen_text = res_json[0].get("generated_text", "")
                    elif isinstance(res_json, dict):
                        gen_text = res_json.get("generated_text", "")
                        
                    # Extract JSON block
                    start = gen_text.find("{")
                    end = gen_text.rfind("}")
                    if start != -1 and end != -1:
                        json_str = gen_text[start:end+1]
                        return json.loads(json_str)
            except Exception as e:
                logger.error(f"Hugging Face Exception: {e}. Falling back to Mock.")

        # If both fail or no keys, run the high-quality Mock Generator
        return cls._generate_mock_schedule(event_type, num_sessions, num_speakers, duration_days, break_preferences, audience_type)

    @classmethod
    def generate_insights(cls, db: Session, title: str, description: str, category: str, venue: str, capacity: int, ticket_types: List[Dict[str, Any]]) -> Dict[str, Any]:
        provider = cls._get_active_provider(db)
        api_key = cls._get_api_key(db, provider)
        
        ticket_str = ", ".join([f"{t['name']}: ${t['price']}" for t in ticket_types])
        prompt = (
            f"Analyze this event:\n"
            f"Title: {title}\n"
            f"Description: {description}\n"
            f"Category: {category}\n"
            f"Venue: {venue}\n"
            f"Capacity: {capacity}\n"
            f"Ticket Types: {ticket_str}\n\n"
            f"Provide professional marketing analytics. Respond ONLY with a raw JSON matching this structure (no markdown wrapper):\n"
            f"{{\n"
            f"  \"attendance_prediction\": \"High/Medium/Low prediction and reasoning\",\n"
            f"  \"ticket_demand_forecast\": \"Demand curve description\",\n"
            f"  \"suggested_timing\": \"Optimal day of week and month recommendation\",\n"
            f"  \"suggested_category\": \"Optimal tagging and taxonomy alignment\",\n"
            f"  \"audience_recommendations\": [\"Recommendation 1\", \"Recommendation 2\"],\n"
            f"  \"explanation\": \"A 2-sentence summary of the event feasibility study.\"\n"
            f"}}\n"
        )
        
        if provider == "groq" and api_key:
            try:
                response = requests.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                    json={
                        "model": settings.GROQ_MODEL,
                        "messages": [
                            {"role": "system", "content": "You are a professional business analytics assistant that outputs strict raw JSON only."},
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.2
                    },
                    timeout=15
                )
                if response.status_code == 200:
                    content = response.json()["choices"][0]["message"]["content"].strip()
                    if content.startswith("```"):
                        content = content.replace("```json", "").replace("```", "").strip()
                    return json.loads(content)
            except Exception as e:
                logger.error(f"Groq Insights Exception: {e}. Falling back.")
                
        if provider == "huggingface" and api_key:
            try:
                response = requests.post(
                    f"https://api-inference.huggingface.co/models/{settings.HF_MODEL}",
                    headers={"Authorization": f"Bearer {api_key}"},
                    json={"inputs": prompt, "parameters": {"max_new_tokens": 800, "temperature": 0.2}},
                    timeout=15
                )
                if response.status_code == 200:
                    res_json = response.json()
                    gen_text = res_json[0].get("generated_text", "") if isinstance(res_json, list) else res_json.get("generated_text", "")
                    start = gen_text.find("{")
                    end = gen_text.rfind("}")
                    if start != -1 and end != -1:
                        return json.loads(gen_text[start:end+1])
            except Exception as e:
                logger.error(f"HF Insights Exception: {e}. Falling back.")

        return cls._generate_mock_insights(title, category, capacity, ticket_types)

    @classmethod
    def _generate_mock_schedule(cls, event_type: str, num_sessions: int, num_speakers: int, duration_days: int, break_preferences: str, audience_type: str) -> Dict[str, Any]:
        schedule = {}
        sessions_per_day = max(1, num_sessions // duration_days)
        speakers = [f"Dr. Jane Doe (AI Specialist)", f"Prof. John Smith (Keynote)", f"Sarah Jenkins (Tech Lead)", f"Michael Chang (DevOps Director)", f"Emily Watson (Security Architect)"]
        
        times = ["09:00 AM", "10:30 AM", "11:30 AM", "01:30 PM", "03:00 PM", "04:30 PM"]
        
        for day in range(1, duration_days + 1):
            day_key = f"Day{day}"
            schedule[day_key] = []
            
            # Keynote or Welcome Session
            schedule[day_key].append({
                "time": times[0],
                "title": f"Opening Keynote: The Future of {event_type}",
                "speaker": speakers[day % len(speakers)],
                "venue": "Grand Hall",
                "description": f"An inspiring start to Day {day} discussing growth in {event_type} for our target audience of {audience_type}."
            })
            
            # Networking break
            schedule[day_key].append({
                "time": "10:00 AM",
                "title": f"Networking Coffee Break ({break_preferences})",
                "speaker": "N/A",
                "venue": "Exhibition Lounge",
                "description": "Connect with fellow attendees and speakers over refreshments."
            })
            
            # Standard sessions
            for s in range(1, sessions_per_day):
                time_idx = (s + 1) % len(times)
                speaker_idx = (day * s) % len(speakers)
                schedule[day_key].append({
                    "time": times[time_idx],
                    "title": f"Session {s}: Deep Dive into Modern {event_type} Practices",
                    "speaker": speakers[speaker_idx],
                    "venue": f"Conference Room {1 + (s % 3)}",
                    "description": f"Exploring advanced methodologies, frameworks, and architecture patterns suitable for {audience_type}."
                })
                
        # Recommendations
        schedule["Recommendations"] = [
            f"Pre-survey your audience of {audience_type} to tailor session difficulty.",
            f"Dedicate the final 30 minutes of Day {duration_days} to an open Q&A panel.",
            f"Ensure high-speed internet in Conference Rooms to support live demos."
        ]
        return schedule

    @classmethod
    def _generate_mock_insights(cls, title: str, category: str, capacity: int, ticket_types: List[Dict[str, Any]]) -> Dict[str, Any]:
        total_price = sum([t["price"] for t in ticket_types])
        avg_price = total_price / len(ticket_types) if ticket_types else 0
        
        pred = "High Demand Expected" if avg_price < 50 else "Moderate Demand Expected"
        
        return {
            "attendance_prediction": f"{pred}. The '{category}' category combined with accessible pricing structure is highly appealing.",
            "ticket_demand_forecast": f"Early bird registration will likely account for 45% of tickets. Sales will spike 2 weeks before the event.",
            "suggested_timing": "Weekends (Saturday) or mid-week Tuesday afternoons show highest engagement metrics for this format.",
            "suggested_category": f"Tag as #ProfessionalDevelopment and #{category.replace(' ', '')} to maximize social reach.",
            "audience_recommendations": [
                f"Target local university graduates and industry professionals interested in {category}.",
                "Leverage LinkedIn groups for niche organic outreach."
            ],
            "explanation": f"The event '{title}' is highly viable. With a capacity of {capacity}, structured digital marketing and target newsletters will drive 85%+ fill rate."
        }
