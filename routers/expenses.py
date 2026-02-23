from fastapi import APIRouter, HTTPException,Depends,Request
from sqlalchemy.orm import Session
from sqlalchemy import select
from zoneinfo import ZoneInfo
from database import SessionLocal
from models import Group,Expense,User,expense_members,group_members, Settlement
from .auth import get_current_user 
from datetime import datetime
from Schemas import ExpenseCreate
from services.chat_services import broadcast_bot_message


router = APIRouter(
    prefix="/expenses",
    tags=["Expenses"]
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        
from fastapi import BackgroundTasks

@router.post("/{group_id}/add")
def add_expense(
    group_id: int,
    data: ExpenseCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="group not found")

    member = db.execute(
        select(group_members)
        .where(group_members.c.group_id == group_id)
        .where(group_members.c.user_id == current_user.id)
    ).first()

    if not member:
        raise HTTPException(status_code=400, detail="user not belong to the group")

    # Create expense
    expense = Expense(
        group_id=group_id,
        paid_by=current_user.id,
        amount=data.amount,
        note=data.note,
        date=datetime.now(ZoneInfo("Asia/Kolkata"))
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)

    # Add involved users
    involved = set(data.involved_user_ids)
    involved.add(current_user.id)

    for user_id in involved:
        db.execute(
            expense_members.insert().values(
                expense_id=expense.id,
                user_id=user_id
            )
        )
    db.commit()

    names = db.query(User).filter(User.id.in_(involved)).all()
    name_list = ", ".join(u.name for u in names)

    bot_msg = (
        f"💸 {current_user.name} added ₹{expense.amount} "
        f"for {expense.note or 'expense'}\n"
        f"👥 Split between: {name_list}"
    )

    # ✅ SAFE: fire-and-forget
    background_tasks.add_task(
        broadcast_bot_message,
        group_id,
        bot_msg
    )

    return {
        "message": "expense added",
        "expense_id": expense.id
    }

        
@router.get("/{group_id}")
def list_expenses(
    group_id: int,
    db: Session=Depends(get_db),
    current_user: User=Depends(get_current_user)
):
    expenses = db.query(Expense).filter(
        Expense.group_id==group_id).order_by(Expense.date.desc()).all()
    
    if not expenses:
        # Return empty list instead of 404, so the UI can show the empty state with "Add First Expense" button
        return []
    
    result = []
    for e in expenses:
        # Get involved users for this expense
        involved_rows = db.execute(
            select(expense_members)
            .where(expense_members.c.expense_id == e.id)
        ).all()
        
        involved_user_ids = [row.user_id for row in involved_rows]
        involved_users = db.query(User).filter(User.id.in_(involved_user_ids)).all()
        
        result.append({
            "id": e.id,
            "amount": e.amount,
            "note": e.note,
            "paid_by": e.paid_by,
            "date": e.date,
            "payer_name": e.payer.name if e.payer else "Unknown",
            "involved_users": [
                {
                    "id": user.id,
                    "name": user.name
                } for user in involved_users
            ]
        })
    
    return result
    


@router.get("/{group_id}/balance")
def calculate_balance(
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
        raise HTTPException(status_code=400, detail="user not in group")
    
    
    balances = {}
    
    expenses = db.query(Expense).filter(Expense.group_id==group_id).all()
    
    for e in expenses:
        involved = db.execute(
            select(expense_members)
            .where(expense_members.c.expense_id==e.id)
        ).all()
        
        if not involved:
            continue
        
        split_amount = e.amount/len(involved)
        
        for row in involved:
            uid = row.user_id
            balances.setdefault(uid,0)
            balances[uid] -= split_amount
            
        balances.setdefault(e.paid_by,0)
        balances[e.paid_by] += e.amount
        
    paid_settlements = db.query(Settlement).filter(Settlement.group_id==group_id).filter(Settlement.is_paid==True).all()
    
    for s in paid_settlements:
        balances[s.payer_id] += s.amount
        balances[s.receiver_id] -= s.amount
        
    return {
        "balances": [
            {
                "user_id": uid,
                "balance": round(amount, 2)
            }
            for uid, amount in balances.items()
            if round(amount,2) != 0
        ]
    }





            
        
            
        
    
    
    
    
