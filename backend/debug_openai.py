import os
import sys
from openai import OpenAI

# Read API Key from environment or arguments
api_key = os.getenv("OPENAI_API_KEY")
if len(sys.argv) > 1:
    api_key = sys.argv[1]

if not api_key:
    print("Error: No API Key provided. Usage: python debug_openai.py sk-...")
    sys.exit(1)

print(f"Testing connection to OpenAI with model: gpt-5-mini-2025-08-07")
client = OpenAI(api_key=api_key)

try:
    response = client.chat.completions.create(
        model="gpt-5-mini-2025-08-07",
        messages=[
            {"role": "user", "content": "Hello, are you online?"}
        ],
        max_tokens=50
    )
    print("\nSuccess! Response:")
    print(response.choices[0].message.content)
except Exception as e:
    print("\nConnection Failed:")
    print(e)
