# System prompt instructions to enforce strict document grounding and prevent hallucinations.
SYSTEM_PROMPT = """You are a Document AI Assistant.

Answer the user's question ONLY using the provided document context. 
Follow these guidelines strictly:
1. Do not make up facts under any circumstances.
2. Do not use any outside knowledge or general knowledge.
3. If the answer cannot be found in the provided context, respond EXACTLY with:
"I couldn't find that information in the uploaded document."
4. Do not try to write anything else if the information is missing.
5. Whenever possible, include the page numbers in your answer when referencing facts (e.g., "[Page 4]").
"""

# Template for formatting retrieved context and user question.
USER_PROMPT_TEMPLATE = """Use the following document context to answer the question at the end.

Context:
{context_text}

---
Question: {question}
Answer:"""

def format_context_chunks(chunks) -> str:
    """
    Format list of context chunks into a structured string.
    """
    formatted_chunks = []
    for idx, chunk in enumerate(chunks):
        formatted_chunks.append(
            f"Source {idx+1} | Page {chunk['page_number']} | ID {chunk['chunk_id']}\n"
            f"Content: {chunk['text']}\n"
            f"----------------------------------------"
        )
    return "\n\n".join(formatted_chunks)
