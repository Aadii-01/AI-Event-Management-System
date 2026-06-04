def test_register_user(client):
    payload = {
        "email": "testuser@gmail.com",
        "password": "securepassword",
        "full_name": "Test User",
        "role_name": "attendee"
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "testuser@gmail.com"
    assert data["full_name"] == "Test User"
    assert data["role"] == "attendee"
    assert "id" in data

def test_register_duplicate_user(client):
    payload = {
        "email": "duplicate@gmail.com",
        "password": "securepassword",
        "full_name": "First User",
        "role_name": "attendee"
    }
    client.post("/api/auth/register", json=payload)
    
    # Repeat signup
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 400
    assert response.json()["detail"] == "A user with this email is already registered."

def test_login_user(client):
    # Register first
    signup_payload = {
        "email": "loginuser@gmail.com",
        "password": "securepassword",
        "full_name": "Login User",
        "role_name": "attendee"
    }
    client.post("/api/auth/register", json=signup_payload)
    
    # Try login
    login_payload = {
        "username": "loginuser@gmail.com",
        "password": "securepassword"
    }
    response = client.post("/api/auth/login", data=login_payload)
    assert response.status_code == 200
    token = response.json()
    assert "access_token" in token
    assert token["token_type"] == "bearer"
    assert token["role"] == "attendee"

def test_get_profile(client):
    signup_payload = {
        "email": "profile@gmail.com",
        "password": "securepassword",
        "full_name": "Profile User",
        "role_name": "attendee"
    }
    client.post("/api/auth/register", json=signup_payload)
    
    login_response = client.post("/api/auth/login", data={
        "username": "profile@gmail.com",
        "password": "securepassword"
    })
    token = login_response.json()["access_token"]
    
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/auth/me", headers=headers)
    assert response.status_code == 200
    profile = response.json()
    assert profile["email"] == "profile@gmail.com"
    assert profile["full_name"] == "Profile User"
