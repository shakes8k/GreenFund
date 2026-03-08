from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file="../../.env", extra="ignore")

    # App
    app_name: str = "GreenFund AI Service"
    debug: bool = False
    api_prefix: str = "/api/v1"

    # Database
    database_url: str

    # Anthropic (for narrative generation in scenario reports)
    anthropic_api_key: str

    # AI Model versions (bump when retraining)
    impact_model_version: str = "v1.0.0"
    scenario_model_version: str = "v1.0.0"
    risk_pool_model_version: str = "v1.0.0"

    # Rebalancing
    rebalance_interval_hours: int = 24
    min_rebalance_drift_pct: float = 5.0  # only rebalance if allocation drifts >5%


settings = Settings()  # type: ignore[call-arg]
