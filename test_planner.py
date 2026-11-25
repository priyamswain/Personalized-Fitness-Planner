from planner import build_plan

sample = {"age": 22, "gender": "male", "height_cm": 175, "weight_kg": 70,
          "meal_type": "veg", "intensity": "intermediate", "goal": "maintain"}


def test_plan_shape():
    p = build_plan(sample)
    assert 2000 < p["calories"] < 3000
    assert p["water_litres"] > 2
    assert len(p["workout"]["days"]) == 7
    assert len(p["micronutrients"]) == 10


if __name__ == "__main__":
    test_plan_shape()
    print("ok")
