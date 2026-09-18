from langchain.agents import create_agent
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from tools import web_search , scrape_url 
from dotenv import load_dotenv

load_dotenv()

#model setup
llm = ChatGroq(model="openai/gpt-oss-20b", temperature=0)


# Intent Router
router_prompt = ChatPromptTemplate.from_messages([
    (
        "system",
        """You are an intent classifier.

Classify the user's message into exactly one category.

RESEARCH:
- The user wants current, detailed, sourced, or web-based information.
- The user asks to research, investigate, find recent information,
  gather sources, or analyze current developments.

CHAT:
- Greetings
- Casual conversation
- General questions
- Questions that do not require web research

Return ONLY one word:
RESEARCH
or
CHAT
"""
    ),
    ("human", "{message}")
])

router_chain = router_prompt | llm | StrOutputParser()

#1st agent 
def build_search_agent():
    return create_agent (
        model = llm,
        tools= [web_search],
        system_prompt="""You are a research search agent. Your job is to find relevant, recent, reliable information about the user's research topic.
        Use the web_search tool to search for information.
        Prefer reliable and authoritative sources.
        Do not make up information.
        Return the relevant findings and source URLs for the next agent.
        """
    )

#2nd agent 

def build_reader_agent():
    return create_agent(
        model = llm,
        tools = [scrape_url],

        system_prompt="""You are a research reading agent.
        Your job is to deeply read and extract useful information from webpages provided by the research workflow.
        Use the scrape_url tool to read webpages.
        Extract important facts, evidence, statistics, and context.
        Do not invent information.
        Clearly associate findings with their source URLs.
        """
    )


#writer chain 

writer_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are an expert research writer. Write clear, structured and insightful reports."),
    ("human", """Write a detailed research report on the topic below.

Topic: {topic}

Research Gathered:
{research}

Structure the report as:
- Introduction
- Key Findings (minimum 3 well-explained points)
- Conclusion
- Sources (list all URLs found in the research)

Be detailed, factual and professional."""),
])

writer_chain = writer_prompt | llm | StrOutputParser()

#critic_chain 

critic_prompt = ChatPromptTemplate.from_messages([
     ("system", "You are a sharp and constructive research critic. Be honest and specific."),
    ("human", """Review the research report below and evaluate it strictly.

Report:
{report}

Respond in this exact format:

Score: X/10

Strengths:
- ...
- ...

Areas to Improve:
- ...
- ...

One line verdict:
..."""),
])

critic_chain = critic_prompt | llm | StrOutputParser()