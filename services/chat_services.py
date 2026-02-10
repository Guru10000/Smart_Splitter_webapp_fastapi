# services/chat_service.py

from database import SessionLocal
from models import ChatMessage, Expense, User, expense_members
from datetime import datetime
import anyio
from routers.chat import broadcast


def broadcast_bot_message(group_id: int, content: str):
    

    db = SessionLocal()
    try:
        msg = ChatMessage(
            group_id=group_id,
            sender_id=None,
            sender_type="bot",
            content=content,
            timestamp=datetime.utcnow()
        )

        db.add(msg)
        db.commit()
        db.refresh(msg)

        payload = {
            "event": "bot_message",
            "message": {
                "id": msg.id,
                "content": msg.content,
                "timestamp": msg.timestamp.isoformat()
            }
        }
    finally:
        db.close()

    # Run async broadcast safely from sync context
    anyio.from_thread.run(broadcast, group_id, payload)


async def broadcast_expense_message(group_id: int, expense_id: int):
    """
    Build and send an automatic bot message when an expense is added.
    """

    db = SessionLocal()
    try:
        expense = db.query(Expense).filter(Expense.id == expense_id).first()
        if not expense:
            return

        involved_rows = db.execute(
            expense_members.select()
            .where(expense_members.c.expense_id == expense.id)
        ).all()

        involved_ids = [row.user_id for row in involved_rows]
        users = db.query(User).filter(User.id.in_(involved_ids)).all()

        name_list = ", ".join(u.name for u in users)

        bot_msg = (
            f"{expense.payer.name} added ₹{expense.amount} "
            f"for {expense.note or 'expense'}\n"
            f"Split between: {name_list}"
        )
    finally:
        db.close()

    broadcast_bot_message(group_id, bot_msg)
