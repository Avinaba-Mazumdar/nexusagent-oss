import pytest
from httpx import ASGITransport, AsyncClient

from app.core.auth import create_access_token, decode_access_token, hash_password, verify_password
from app.db.neon import neon_db
from app.main import app


@pytest.fixture(autouse=True)
async def setup_db():
    await neon_db.connect()
    yield
    await neon_db.disconnect()


@pytest.mark.asyncio
async def test_password_hashing():
    raw_pass = "SuperSecretSecurePass123!"
    hashed = hash_password(raw_pass)
    assert hashed != raw_pass
    assert verify_password(raw_pass, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False


@pytest.mark.asyncio
async def test_jwt_token_encode_decode():
    data = {"sub": "00000000-0000-0000-0000-000000000001", "role": "user"}
    token, expires_in = create_access_token(data)
    assert isinstance(token, str)
    assert expires_in > 0

    decoded = decode_access_token(token)
    assert decoded["sub"] == "00000000-0000-0000-0000-000000000001"
    assert decoded["role"] == "user"


@pytest.mark.asyncio
async def test_guest_pass_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/api/auth/guest")
        assert response.status_code == 200
        data = response.json()

        assert "user" in data
        assert data["user"]["isGuest"] is True
        assert "Guest Architect" in data["user"]["name"]
        assert "tokens" in data
        assert data["tokens"]["tokenType"] == "bearer"
        assert len(data["tokens"]["accessToken"]) > 20
        assert data["quotaRemaining"] == 5
        assert data["bucketCapacity"] == 5

        # Test authenticated /me with this guest token
        token = data["tokens"]["accessToken"]
        me_resp = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me_resp.status_code == 200
        me_data = me_resp.json()
        assert me_data["user"]["id"] == data["user"]["id"]
        assert me_data["quota"]["tokensRemaining"] == 5

        # Reusing same deviceId should return the same guest user
        dev_id = f"test-device-{uuid4().hex[:8]}"
        res1 = await client.post("/api/auth/guest", json={"deviceId": dev_id})
        assert res1.status_code == 200
        user1 = res1.json()["user"]

        res2 = await client.post("/api/auth/guest", json={"deviceId": dev_id})
        assert res2.status_code == 200
        user2 = res2.json()["user"]

        assert user1["id"] == user2["id"]
        assert user1["name"] == user2["name"]
        assert user2["deviceId"] == dev_id


from uuid import uuid4


@pytest.mark.asyncio
async def test_register_login_and_me_flow():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        unique_id = uuid4().hex[:8]
        email = f"architect_{unique_id}@nexusagent.internal"
        password = "ProductionPassword2026!"
        name = "Staff Architect"

        # 1. Register
        reg_resp = await client.post(
            "/api/auth/register",
            json={"email": email, "password": password, "name": name},
        )
        assert reg_resp.status_code == 200
        reg_data = reg_resp.json()
        assert reg_data["user"]["email"] == email
        assert reg_data["user"]["name"] == name
        assert reg_data["user"]["isGuest"] is False
        assert "accessToken" in reg_data

        # 2. Duplicate registration returns 409
        dup_resp = await client.post(
            "/api/auth/register",
            json={"email": email, "password": password, "name": name},
        )
        assert dup_resp.status_code == 409

        # 3. Login with correct credentials
        login_resp = await client.post(
            "/api/auth/login",
            json={"email": email, "password": password},
        )
        assert login_resp.status_code == 200
        login_data = login_resp.json()
        token = login_data["accessToken"]

        # 4. Login with invalid credentials returns 401
        bad_login = await client.post(
            "/api/auth/login",
            json={"email": email, "password": "WrongPassword!"},
        )
        assert bad_login.status_code == 401

        # 5. Access /me with token
        me_resp = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me_resp.status_code == 200
        me_data = me_resp.json()
        assert me_data["user"]["email"] == email
        assert me_data["quota"]["bucketCapacity"] == 25

        # 6. Refresh token
        refresh_resp = await client.post(
            "/api/auth/refresh", headers={"Authorization": f"Bearer {token}"}
        )
        assert refresh_resp.status_code == 200
        refresh_data = refresh_resp.json()
        assert "accessToken" in refresh_data


@pytest.mark.asyncio
async def test_unauthorized_access():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/auth/me")
        assert resp.status_code == 401

        resp_bad = await client.get(
            "/api/auth/me", headers={"Authorization": "Bearer invalid_garbage_token"}
        )
        assert resp_bad.status_code == 401
