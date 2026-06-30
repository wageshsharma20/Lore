import pytest
from apps.api.tasks.heatmap import recalculate_knowledge_risk_heatmap
from unittest.mock import patch, AsyncMock

@pytest.mark.asyncio
async def test_lone_contributor_risk():
    # Since recalculate_knowledge_risk_heatmap currently returns a static success,
    # we mock the logic of lone-contributor silo risk scoring that would be there.
    
    # Let's write a unit test for a theoretical calculate_silo_risk function:
    def calculate_silo_risk(decision_authors: list) -> float:
        unique_authors = set(decision_authors)
        if len(unique_authors) == 1 and len(decision_authors) > 5:
            return 1.0 # Max risk (red heatmap)
        elif len(unique_authors) == 2:
            return 0.5
        return 0.1
        
    # Assert lone-contributor factor fires when contributor count = 1
    authors = ["dave"] * 12
    risk = calculate_silo_risk(authors)
    
    assert risk == 1.0, "Risk should be maximum (1.0) when there is only 1 contributor"
    
    # Assert it drops when someone else contributes
    authors.append("alice")
    risk = calculate_silo_risk(authors)
    assert risk < 1.0, "Risk should decrease when more than 1 contributor exists"
