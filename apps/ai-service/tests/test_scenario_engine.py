import pytest
from unittest.mock import AsyncMock, patch
from app.models.schemas import ClimateScenario
from app.services.scenario_engine import run_scenario


@pytest.fixture
def baseline_scenario() -> ClimateScenario:
    return ClimateScenario(
        carbon_price_usd=50.0,
        policy_strictness=60,
        technology_adoption_rate=50,
        extreme_weather_frequency=30,
    )


@pytest.mark.asyncio
async def test_run_scenario_returns_projection(baseline_scenario: ClimateScenario) -> None:
    with patch("app.services.scenario_engine._generate_narrative", new_callable=AsyncMock) as mock_narrative:
        mock_narrative.return_value = "Test narrative."
        result = await run_scenario(
            startup_id="test-startup-1",
            scenarios=[baseline_scenario],
            baseline_valuation_usd=5_000_000.0,
        )

    assert result.startup_id == "test-startup-1"
    assert len(result.projections) == 1
    proj = result.projections[0]
    assert proj.projected_valuation_usd > 0
    assert 0 <= proj.risk_score <= 100
    assert proj.confidence_interval_low <= proj.confidence_interval_high


@pytest.mark.asyncio
async def test_high_carbon_price_increases_valuation(baseline_scenario: ClimateScenario) -> None:
    low_carbon = ClimateScenario(carbon_price_usd=10.0, policy_strictness=30, technology_adoption_rate=50, extreme_weather_frequency=20)
    high_carbon = ClimateScenario(carbon_price_usd=300.0, policy_strictness=80, technology_adoption_rate=70, extreme_weather_frequency=20)

    with patch("app.services.scenario_engine._generate_narrative", new_callable=AsyncMock) as mock:
        mock.return_value = ""
        low_result  = await run_scenario("s1", [low_carbon],  5_000_000.0, include_narrative=False)
        high_result = await run_scenario("s1", [high_carbon], 5_000_000.0, include_narrative=False)

    assert high_result.projections[0].projected_valuation_usd > low_result.projections[0].projected_valuation_usd
