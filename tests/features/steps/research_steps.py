# tests/features/steps/research_steps.py
import asyncio
from behave import given, when, then

from app.app_utils.session_store import create_session, get_session
from app.agent_runtime_app import run_research_pipeline

@given('a research query "{query}"')
def step_impl_given_query(context, query):
    context.query = query

@when('the multi-agent research pipeline is executed')
def step_impl_run_pipeline(context):
    session = create_session(context.query)
    # Run the async pipeline synchronously in a new event loop
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(run_research_pipeline(session.session_id))
    finally:
        loop.close()
    
    # Reload session from store to inspect results
    context.session = get_session(session.session_id)
    assert context.session is not None, "Failed to retrieve session from store"

@then('the generated report should contain the literature summaries')
def step_impl_check_summaries(context):
    assert len(context.session.summaries.strip()) > 10, "Summaries are empty or too short"
    assert "1." in context.session.summaries, "Should contain numbered summaries"

@then('the report should list at least 2 research gaps')
def step_impl_check_gaps(context):
    assert len(context.session.gaps.strip()) > 10, "Research gaps are empty"
    # Should contain bullet points
    assert "-" in context.session.gaps or "*" in context.session.gaps, "Should contain bulleted gaps list"

@then('the report should propose an experimental methodology')
def step_impl_check_methodology(context):
    assert "Methodology" in context.session.methodology, "Should contain methodology details"
    assert len(context.session.methodology.strip()) > 20, "Methodology proposal is too short"

@then('the report should provide future work recommendations')
def step_impl_check_future_work(context):
    assert len(context.session.future_work.strip()) > 10, "Future work recommendations are empty"

@then('the citations should contain valid BibTeX entries starting with "@article"')
def step_impl_check_citations(context):
    assert "@article" in context.session.citations, "Citations should contain BibTeX entries"
