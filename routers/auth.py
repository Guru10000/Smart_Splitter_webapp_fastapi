from fastapi import APIRouter, HTTPException, Depends, Response, Request, status
from sqlalchemy.orm import Session 
from database import SessionLocal
from models import User, OTPVerification
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from Schemas import Token, UserCreate
import random
from dotenv import load_dotenv
import os

load_dotenv()



SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACESS_TOKEN_EXPIRE_MINUTES = 30

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        
def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plan, hashed):
    return pwd_context.verify(plan, hashed)


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expires = datetime.utcnow() + (expires_delta or timedelta(minutes=ACESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expires})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

@router.post("/register/send-otp")
def send_otp(phone: str, db: Session=Depends(get_db)):
    
    existing = db.query(User).filter(User.phone==phone).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="phone number already exists")
    
    db.query(OTPVerification).filter(
        OTPVerification.phone == phone,
        OTPVerification.verified == False
    ).delete()
    
    otp = str(random.randint(100000, 999999))
    
    record = OTPVerification(
        phone=phone,
        otp=otp,
        expires_at=datetime.utcnow() + timedelta(minutes=10),
        verified=False
    )
    db.add(record)
    db.commit()
    
    print(f"OTP for {phone}: {otp}")
    # For testing - remove in production
    return {"message": "OTP sent successfully", "otp": otp}
    

@router.post("/register/verify")
def register(
    user: UserCreate,
    otp: str, 
    db: Session= Depends(get_db)
):
    record = db.query(OTPVerification).filter(
        OTPVerification.phone == user.phone,
        OTPVerification.verified == False
    ).order_by(OTPVerification.id.desc()).first()
    
    if not record:
        raise HTTPException(status_code=400, detail="OTP not found")
    
    if record.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="OTP expired")
    
    if record.otp != otp:
        raise HTTPException(status_code=400, detail="invalid OTP")
    
    existing = db.query(User).filter(User.phone==user.phone).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="phone number already exists")
    
    record.verified = True
    
    
    new_user = User(
        name = user.name,
        phone = user.phone,
        password_hash = hash_password(user.password),
        email = user.email
    )
    db.add(new_user)
    
    db.delete(record)
    
    db.commit()
    db.refresh(new_user)
    
    return {"message": "user registered successfully"}

@router.post("/login")
def Login(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session=Depends(get_db)
):
    user = db.query(User).filter(User.phone == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code= status.HTTP_401_UNAUTHORIZED, detail="invalid credentials")
    
    token = create_access_token({"sub": str(user.id)})
    
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="none",   # VERY IMPORTANT
        secure=True        # VERY IMPORTANT (must be True with samesite none)
    )
    
    return {
        "message": "login successfully",
        "access_token": token,
        "token_type": "bearer"
    }


def get_current_user(request: Request, db: Session=Depends(get_db)):
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="not authenticated")
    
    try: 
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="invalid token")
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    
    if not user:
        raise HTTPException(status_code=401, detail="user not found")
    
    
    return user


@router.get("/me")
def read_me(current_user=Depends(get_current_user)):
    return{
        "id": current_user.id,
        "name": current_user.name,
        "phone": current_user.phone,
        "email": current_user.email
        
    }
    
    
@router.post("/logout")
def Logout(response: Response):
    response.delete_cookie("access_token")
    return {"message":"Logged out"}
    
    

    

    

