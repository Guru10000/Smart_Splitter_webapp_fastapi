from pydantic import BaseModel
from typing import Optional, List

class UserCreate(BaseModel):
    name: str
    phone: str
    password: str
    email: str
    
class Token(BaseModel):
    access_token: str
    token_type: str
    
class GroupCreate(BaseModel):
    name: str
    description: Optional[str] = None  
    
class AddMember(BaseModel):
    phone: str

class GroupOut(BaseModel):
    id: int
    name: str
    members: list[str]
    
class ExpenseCreate(BaseModel):
    amount: float
    note: Optional[str]=None
    involved_user_ids: List[int]
    
class FeedbackCreate(BaseModel):
    name: Optional[str]
    email: str
    comments: str
    rating: str
    

    