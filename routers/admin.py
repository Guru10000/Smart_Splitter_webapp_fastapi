from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .auth import get_current_user, get_db
from models import Settlement, User, Group, group_members
from services.chat_services import broadcast_bot_message

router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


@router.delete("/settlement/{settlement_id}")
def undo_settlement(
    settlement_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    
    settlement = db.query(Settlement).filter(
        Settlement.id == settlement_id
    ).first()

    if not settlement:
        raise HTTPException(status_code=404, detail="settlement not found")
    
    
    # ADMIN CHECK
    role = db.execute(
        group_members.select()
        .where(group_members.c.group_id == settlement.group_id)
        .where(group_members.c.user_id == user.id)
    ).first()
    
    
    if role.role != "admin":
        raise HTTPException(status_code=403, detail="only admins can undo settlements")

    

    group_id = settlement.group_id
    amount = settlement.amount
    payer_name = settlement.payer.name
    receiver_name = settlement.receiver.name

    settlement.is_paid = False
    settlement.settled_at = None
    db.commit()
    db.refresh(settlement)

    # BOT MESSAGE
    msg = f"Settlement undone: {payer_name} → {receiver_name} ₹{amount}"
    broadcast_bot_message(group_id, msg)

    return {"message": "settlement undone successfully"}


@router.delete("/{group_id}")

def delete_group(
    group_id: int,
    db: Session=Depends(get_db),
    current_user: User=Depends(get_current_user)
):
    
    group = db.query(Group).filter(Group.id == group_id).first()
    
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    
    role = db.execute(
        group_members.select()
        .where(group_members.c.group_id == group_id)
        .where(group_members.c.user_id == current_user.id)
    ).first()
    
    if role.role != "admin":
        raise HTTPException(status_code=403, detail="only admins can delete the group")
    
    db.delete(group)
    db.commit() 
    return {"message": "group deleted successfully"}


@router.delete("/{group_id}/{user_id}")

def delete_member(
    group_id: int,
    user_id: int,
    db: Session=Depends(get_db),
    current_user: User=Depends(get_current_user)
):
    
    member = db.execute(
        group_members.select()
        .where(group_members.c.group_id == group_id)
        .where(group_members.c.user_id == current_user.id)
    ).first()
    
    if not member:
        raise HTTPException(status_code=404, detail="not a group member")
    
    if member.role != "admin":
        raise HTTPException(status_code=403, detail="not authorized to remove user")
    
    target_member = db.execute(
        group_members.select()
        .where(group_members.c.group_id == group_id)
        .where(group_members.c.user_id == user_id)
    ).first()
    
    
    
    if not target_member:
        raise HTTPException(status_code=404, detail="user not found in group")
    
    # Get user info before deletion
    target_user = db.query(User).filter(User.id == user_id).first()
    
    db.execute(
        group_members.delete()
        .where(group_members.c.group_id == group_id)
        .where(group_members.c.user_id == user_id)
    )
    
    db.commit()
    
    msg = f"{target_user.name} was removed from the group by {current_user.name}"
    
    broadcast_bot_message(group_id, msg)
    
    
    return {"message": "user removed from group"}

    
    

