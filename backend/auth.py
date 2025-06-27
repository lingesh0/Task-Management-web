import os
from fastapi import Request, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import credentials, auth as firebase_auth, initialize_app, _apps
from dotenv import load_dotenv
import logging

load_dotenv()
cred_path = os.getenv("FIREBASE_CREDENTIALS")
if not cred_path or not os.path.exists(cred_path):
    logging.warning(f"FIREBASE_CREDENTIALS is not set or file does not exist: {cred_path}")
if not _apps:
    cred = credentials.Certificate(cred_path)
    initialize_app(cred)

# Bearer Token Scheme
bearer_scheme = HTTPBearer()

# Auth Dependency
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)
):
    token = credentials.credentials
    try:
        decoded_token = firebase_auth.verify_id_token(token)
        uid = decoded_token["uid"]
        return uid
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid Firebase token")

def verify_token(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = auth_header.split(" ")[1]
    try:
        decoded_token = firebase_auth.verify_id_token(token)
        request.state.user_id = decoded_token["uid"]
    except Exception:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return decoded_token["uid"]