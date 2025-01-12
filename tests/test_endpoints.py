from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_calculate():
    response = client.post("/calculate", json={
        "price_data": [{"Date": "2024-01-01", "Close": 100}, {"Date": "2024-01-02", "Close": 102}],
        "indicator_name": "MACD",
        "variables": {"fast_length": 12, "slow_length": 26, "signal_length": 9},
        "detect_divergence": False
    })
    assert response.status_code == 200
    assert "data" in response.json()
    assert "signals" in response.json()
