import pytest
from pydantic import ValidationError
from app.models import SensorRange, TriggerConfig, DeviceRegistration


def test_sensor_range_accepts_valid_limits():
    assert SensorRange(min=5, max=20).max == 20


def test_sensor_range_rejects_equal_limits():
    with pytest.raises(ValidationError):
        SensorRange(min=10, max=10)


def test_device_id_is_restricted():
    with pytest.raises(ValidationError):
        DeviceRegistration(device_id="bad id!", name="Test")
