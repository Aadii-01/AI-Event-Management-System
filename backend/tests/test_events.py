from datetime import datetime, timedelta

def test_get_categories(client):
    # During startup, seed_database seeds categories. In pytest conftest, we setup the tables.
    # Let's verify that we can fetch categories or seed one.
    response = client.get("/api/events/categories")
    assert response.status_code == 200
    # Categories should be pre-populated by startup
    assert isinstance(response.json(), list)

def test_create_event_by_organizer(client):
    # 1. Register Organizer
    org_payload = {
        "email": "org@events.com",
        "password": "securepassword",
        "full_name": "Test Organizer",
        "role_name": "organizer"
    }
    client.post("/api/auth/register", json=org_payload)
    
    # 2. Login Organizer
    login_res = client.post("/api/auth/login", data={
        "username": "org@events.com",
        "password": "securepassword"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get a category ID
    cat_res = client.get("/api/events/categories")
    categories = cat_res.json()
    # Let's find or create a category
    if categories:
        cat_id = categories[0]["id"]
    else:
        # Create category
        new_cat = client.post("/api/events/categories", json={"name": "DevTest", "description": "test"}, headers=headers)
        cat_id = new_cat.json()["id"]

    # 3. Create Event
    event_payload = {
        "title": "Test AI Event",
        "description": "A test conference",
        "category_id": cat_id,
        "start_date": (datetime.utcnow() + timedelta(days=2)).isoformat(),
        "end_date": (datetime.utcnow() + timedelta(days=2, hours=4)).isoformat(),
        "venue": "Test Venue Hall",
        "capacity": 100,
        "banner_image": "http://image.url",
        "ticket_types": [
            {"name": "General Admission", "price": 10.0, "capacity": 100}
        ]
    }
    
    response = client.post("/api/events/", json=event_payload, headers=headers)
    assert response.status_code == 201
    event = response.json()
    assert event["title"] == "Test AI Event"
    assert event["capacity"] == 100
    assert event["status"] == "draft"

def test_create_event_fails_for_attendee(client):
    # 1. Register Attendee
    att_payload = {
        "email": "att@events.com",
        "password": "securepassword",
        "full_name": "Test Attendee",
        "role_name": "attendee"
    }
    client.post("/api/auth/register", json=att_payload)
    
    # 2. Login Attendee
    login_res = client.post("/api/auth/login", data={
        "username": "att@events.com",
        "password": "securepassword"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Try to create event
    event_payload = {
        "title": "Failed Event",
        "category_id": "some-id",
        "start_date": datetime.utcnow().isoformat(),
        "end_date": datetime.utcnow().isoformat(),
        "venue": "Venue",
        "capacity": 50,
        "ticket_types": []
    }
    response = client.post("/api/events/", json=event_payload, headers=headers)
    # Check permissions fails
    assert response.status_code == 403
