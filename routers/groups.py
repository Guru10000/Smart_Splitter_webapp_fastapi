from fastapi import APIRouter, HTTPException, Depends
from database import SessionLocal
from sqlalchemy.orm import Session
from models import Group, User, group_members, GroupInvite,Expense
from Schemas import GroupCreate, AddMember
from .auth import get_current_user
import secrets
from datetime import datetime, timedelta
from sqlalchemy import select
from services.chat_services import broadcast_bot_message

router = APIRouter(
    prefix="/groups",
    tags=["groups"]
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()



# creating the group
@router.post("/create")
def create_group(data: GroupCreate, db: Session=Depends(get_db), current_user: Session=Depends(get_current_user)):
    
    group = Group(
        name = data.name,
        description = data.description,
        created_by = current_user.id
    )
    
    db.add(group)
    db.commit()
    db.refresh(group)
    
    
    # add creater as the admin
    db.execute(group_members.insert().values(
        group_id = group.id,
        user_id = current_user.id,
        role = "admin"
    ))
    db.commit()
    
    return {"message": "group created", "group_id": group.id}



@router.post("/{group_id}/add_member")
def add_member(group_id: int,
               data: AddMember,
               db: Session=Depends(get_db),
               current_user: User=Depends(get_current_user)
               ):
    
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="group not found")
    
    role = db.execute(
        group_members.select()
        .where(group_members.c.group_id == group_id) 
        .where(group_members.c.user_id == current_user.id)
    ).first()
    
    if not role or role.role != "admin":
        raise HTTPException(status_code=401, detail="only admin can add members")
    
    
    user = db.query(User).filter(User.phone == data.phone).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="user not found")
    
    exist = db.execute(group_members.select()
               .where(group_members.c.group_id==group_id)
               .where(group_members.c.user_id==user.id)
               ).first()
    if exist:
        raise HTTPException(status_code=400, detail="user already in the group")
    
    
    db.execute(group_members.insert().values(
        group_id = group_id,
        user_id = user.id,
        role = "member"
    ))
    
    db.commit()
    
    broadcast_bot_message(
        group_id, f"🚪 {user.name} joined the group"
    )
    
    return {"message": f"{user.name} added to the group"}


@router.post("/{group_id}/invite")
def create_invite(
    group_id: int,
    db: Session=Depends(get_db), 
    cureent_user: User=Depends(get_current_user)
):
    
    token = secrets.token_urlsafe(16)
    
    invite = GroupInvite(
        group_id = group_id,
        token = token,
        expires_at = datetime.utcnow() + timedelta(hours=24),
        created_by = cureent_user.id
    )
    db.add(invite)
    db.commit()
    db.refresh(invite)
    
    return {"invite_link": f"http://127.0.0.1:8000/groups/join/{token}"}


@router.get("/join/{token}")
def join_group(
    token: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    invite = db.query(GroupInvite).filter(GroupInvite.token == token).first()

    if not invite or invite.used:
        raise HTTPException(status_code=400, detail="Invalid or used invite")

    if invite.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invite expired")

    # Check if user already in group
    exist = db.execute(
        group_members.select()
        .where(group_members.c.group_id == invite.group_id)
        .where(group_members.c.user_id == current_user.id)
    ).first()

    if exist:
        raise HTTPException(status_code=400, detail="User already in group")

    # Add user to group
    db.execute(
        group_members.insert().values(
            group_id=invite.group_id,
            user_id=current_user.id,
            role="member"
        )
    )

    invite.used = True
    db.commit()
    
    broadcast_bot_message(
        invite.group_id, f"{current_user.name} joined the group"
    )
    
    

    return {"message": "Joined group successfully"}


@router.get("/test")
def test_auth(current_user: User = Depends(get_current_user)):
    return {
        "message": "Authentication working",
        "user_id": current_user.id,
        "user_name": current_user.name
    }

@router.get("/my-groups")
def my_groups(
    db: Session=Depends(get_db),
    current_user: User=Depends(get_current_user)
):
    groups = db.execute(
        select(Group)
        .join(group_members)
        .where(group_members.c.user_id == current_user.id)
    ).scalars().all()
    
    # Convert to JSON serializable format
    result = []
    for group in groups:
        result.append({
            "id": group.id,
            "name": group.name,
            "description": group.description,
            "created_by": group.created_by
        })
    
    return result
    
    
@router.get("/{group_id}")
def group_dashboard(
    group_id: int,
    db: Session=Depends(get_db),
    current_user: User=Depends(get_current_user)
):
    group = db.query(Group).filter(Group.id==group_id).first()
    if not group:
        raise HTTPException(status_code=400, detail="group not found")
    
    member = db.execute(
        group_members.select()
        .where(group_members.c.group_id==group_id)
        .where(group_members.c.user_id==current_user.id)
    ).first()
    
    if not member:
        raise HTTPException(status_code=400, detail="not a group member")
    
    members_with_roles = db.execute(
        select(User, group_members.c.role)
        .join(group_members)
        .where(group_members.c.group_id==group_id)
    ).all()
    
    expenses = db.query(Expense).filter(Expense.group_id==group_id).order_by(Expense.date.desc()).all()
    
    # Convert to JSON serializable format
    return{
        "group": {
            "id": group.id,
            "name": group.name,
            "description": group.description,
            "created_by": group.created_by
        },
        "members": [
            {
                "id": member.id,
                "name": member.name,
                "phone": member.phone,
                "email": member.email,
                "role": role
            } for member, role in members_with_roles
        ],
        "expenses": [
            {
                "id": expense.id,
                "amount": expense.amount,
                "note": expense.note,
                "date": expense.date.isoformat() if expense.date else None,
                "paid_by": expense.paid_by,
                "payer": {
                    "id": expense.payer.id,
                    "name": expense.payer.name
                } if expense.payer else None
            } for expense in expenses
        ]
    }
    
    
@router.delete("/{group_id}/exit")
def exit_group(
    group_id: int,
    db: Session=Depends(get_db),
    current_user: User=Depends(get_current_user)
):
    
    member = db.execute(
        group_members.select()
        .where(group_members.c.group_id==group_id)
        .where(group_members.c.user_id==current_user.id)
    ).first()
    
    if not member:
        raise HTTPException(status_code=404, detail="not a group member")
    
    if member.role == "admin":
        raise HTTPException(status_code=400, detail="admin cannot exit group, transfer admin rights first")
    
    db.execute(
        group_members.delete()
        .where(group_members.c.group_id==group_id)
        .where(group_members.c.user_id==current_user.id)
    )
    db.commit()
    
    broadcast_bot_message(
        group_id,f"{current_user.name} left the group"
    )
    
    return {"message": "exited group successfully"}

@router.get("/{group_id}/members/{user_id}")
def get_group_member_profile(
    group_id: int,
    user_id: int,
    db: Session=Depends(get_db),
    current_user: User=Depends(get_current_user)
):
    
    current = db.execute(
        group_members.select()
        .where(group_members.c.group_id==group_id)
        .where(group_members.c.user_id==current_user.id)
    ).first()
    
    if not current:
        raise HTTPException(status_code=404, detail="not a group member")
    
    target = db.execute(
        group_members.select()
        .where(group_members.c.group_id==group_id)
        .where(group_members.c.user_id==user_id)
    ).first()
    
    if not target:
        raise HTTPException(status_code=404, detail="user not in group")
    
    
    user = db.query(User).filter(User.id==user_id).first()
    
    return{
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "role": target.role
    }
    
    
    
    
    
    
    
  


    