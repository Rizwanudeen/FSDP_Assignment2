# my_research.py
import asyncio
import json
import os
from aero.model_researcher import suggest_models

async def run_non_streaming(prompt: str):
    """
    Runs the Aero model researcher in non-streaming mode.
    Returns the full model suggestions result.
    """
    try:
        print("🔍 Running Aero Model Researcher (non-streaming)...")
        result = await suggest_models(prompt=prompt, streaming=False)

        # Aero returns a dictionary with: { "model_suggestions": [...] }
        suggestions = result.get("model_suggestions", [])

        print("\n📘 Model Suggestions:")
        print(json.dumps(suggestions, indent=2))

        return suggestions

    except Exception as e:
        print(f"❌ Error during non-streaming research: {e}")
        return []


async def run_streaming(prompt: str):
    """
    Runs Aero in streaming mode (yields partial updates).
    """
    try:
        print("🌊 Running Aero Model Researcher (streaming mode)...")

        async for update in await suggest_models(prompt=prompt, streaming=True):
            print("➡ Stream update:", update)

    except Exception as e:
        print(f"❌ Streaming error: {e}")


async def main():
    prompt = "Classify chest X-rays"

    print(f"\n🚀 Starting research for prompt: '{prompt}'")
    print("Aero API Key:", os.getenv("AERO_API_KEY") or "❌ NOT SET")

    # Choose one mode:
    
    # Non-streaming:
    await run_non_streaming(prompt)

    # Streaming:
    # await run_streaming(prompt)


if __name__ == "__main__":
    # Ensures compatibility on Windows (prevents event-loop crash)
    try:
        asyncio.run(main())
    except RuntimeError:
        # Edge case where event loop already running (e.g. inside notebook)
        loop = asyncio.get_event_loop()
        loop.run_until_complete(main())
