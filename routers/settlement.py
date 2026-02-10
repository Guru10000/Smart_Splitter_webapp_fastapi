from fastapi import APIRouter,Depends,HTTPException
from models import User, Expense, Group, group_members,expense_members, Settlement
from .auth import get_current_user, get_db
from sqlalchemy.orm import Session
from services.chat_services import broadcast_bot_message
from fastapi import BackgroundTasks

router = APIRouter(
    prefix="/settlements",
    tags=["Settlements"]
)



def generate_settlements(balances: dict[int, float], db:Session=Depends(get_db)):
    
    debtors = []
    creditors = []
    
    for user_id, amount in balances.items():
        if amount < 0:
            debtors.append([user_id, -amount])
        elif amount > 0:
            creditors.append([user_id, amount])
            
    debtors.sort(key=lambda x: x[1], reverse=True)
    creditors.sort(key=lambda x: x[1], reverse=True)
            
    settlements = []
    
    i = j = 0
    
    while i<len(debtors) and j<len(creditors):
        debtors_id, debt = debtors[i]
        creditors_id, credit = creditors[j]
        
        pay_amount = min(debt, credit)
        
        
        settlements.append({
            "from": debtors_id,
            "to": creditors_id,
            "amount": round(pay_amount, 2)
        })
        
        debtors[i][1] -= pay_amount
        creditors[j][1] -= pay_amount
        
        if debtors[i][1] == 0:
            i += 1
        if creditors[j][1] == 0:
            j += 1
            
    
        
    return settlements


@router.post("/{group_id}/settle")
def settle_group(
    group_id: int,
    background_tasks: BackgroundTasks,
    db: Session=Depends(get_db),
    current_user: User=Depends(get_current_user)
    
):
    role = db.execute(
        group_members.select()
        .where(group_members.c.group_id==group_id)
        .where(group_members.c.user_id==current_user.id)
    ).first()
    
    if not role or role.role != "admin":
        raise HTTPException(status_code=404, detail="only admin can settle")
    
    # Clear existing pending settlements before generating new ones
    existing_pending = db.query(Settlement).filter(
        Settlement.group_id==group_id,
        Settlement.is_paid==False
    ).all()
    
    for pending in existing_pending:
        db.delete(pending)
    db.commit()
    
    expenses = db.query(Expense).filter(Expense.group_id==group_id).all()
    
    balances = {}
    
    for e in expenses:
        involved = db.execute(
            expense_members.select()
            .where(expense_members.c.expense_id==e.id)
        ).all()
        
        split_amount = e.amount/len(involved)
        
        
        for row in involved:
            uid = row.user_id
            balances.setdefault(uid, 0)
            balances[uid] -= split_amount
        
        balances.setdefault(e.paid_by,0)
        balances[e.paid_by] += e.amount
        
    paid_settlements = db.query(Settlement).filter(
        Settlement.group_id==group_id,
        Settlement.is_paid==True
    ).all()
    
    
    for s in paid_settlements:
        balances[s.payer_id] += s.amount
        balances[s.receiver_id] -= s.amount
        
    settlements = generate_settlements(balances)
    
    users = db.query(User).filter(User.id.in_(
        [s["from"] for s in settlements] +
        [s["to"] for s in settlements]
    )).all()
    
    user_map = {u.id: u.name for u in users}
    
    for s in settlements:
        record = Settlement(
            group_id = group_id,
            payer_id = s["from"],
            receiver_id = s["to"],
            amount = s["amount"]
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        
        
        msg = f"{user_map[s['from']]} has to pay {user_map[s['to']]} {s['amount']}"
        
        background_tasks.add_task(
            broadcast_bot_message, group_id, msg
        )
        
        
    return{
        "message": "settlement generated",
        "settlements": settlements
        
    }
    
    
@router.post("/{settlement_id}/mark_paid")
def mark_paid(
    settlement_id: int,
    db: Session=Depends(get_db),
    user: User=Depends(get_current_user)
):
    settlement = db.query(Settlement).filter(Settlement.id==settlement_id).first()
    
    if not settlement:
        raise HTTPException(status_code=400, detail="settlement not found")
    
    if settlement.payer_id != user.id:
        raise HTTPException(status_code=403, detail="only payer can mark paid")
    
    
    settlement.is_paid = True
    db.commit()
    
    msg = f"payment completed: {user.name} paid {settlement.amount} to {settlement.receiver.name}"
    
    broadcast_bot_message(settlement.group_id, msg)
    
    return{"message": "marked as paid"}




@router.get("/history/{group_id}")
def settlement_history(
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
        raise HTTPException(status_code=404, detail="user not belongs to the group")
    
    
    records = db.query(Settlement).filter(
        Settlement.group_id==group_id,
        Settlement.is_paid==True
    ).all()
    
    
    
    return[
        {
            "id": r.id,
            "from": r.payer,
            "to": r.receiver,
            "amount": r.amount,
            "paid": r.is_paid,
            "date": r.settled_at
        }
        for r in records
    ]
    
    
@router.get("/pending_history/{group_id}")
def pending_history(
    group_id: int,
    db: Session=Depends(get_db),
    current_user: User=Depends(get_current_user)
):
    
    member = db.execute(group_members.select()
                        .where(group_members.c.group_id==group_id)
                        .where(group_members.c.user_id==current_user.id)
                        ).first()
    
    if not member:
        raise HTTPException(status_code=404, detail="user not belongs to the group")
    
    records = db.query(Settlement).filter(
        Settlement.group_id==group_id,
        Settlement.is_paid==False
    ).all()
    
    return[
        {
            "id": r.id,
            "from": r.payer,
            "to": r.receiver,
            "amount": r.amount,
            "paid": r.is_paid,
            "date": r.settled_at
        }
         for r in records
    ]
    
    