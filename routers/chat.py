# chat.py
from fastapi import APIRouter, WebSocket, Depends, HTTPException, WebSocketDisconnect
from starlette import status
from sqlalchemy.orm import Session
from database import SessionLocal
from models import ChatMessage, User, Expense, expense_members, chat_read_receipts
from datetime import datetime
import asyncio
import json
from .auth import get_current_user
import anyio

router = APIRouter(
    prefix="/chat",
    tags=["chat"]
)

active_connections: dict[int, list[WebSocket]] = {}

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


async def _send_message(ws: WebSocket, payload: dict):
    try:
        await ws.send_text(json.dumps(payload))
    except:
        pass
    
async def broadcast(group_id: int, payload: dict):
    if group_id not in active_connections:
        return

    for ws in active_connections[group_id]:
        asyncio.create_task(_send_message(ws, payload))


# def broadcast_bot_message(group_id: int, content: str):
#     db = SessionLocal()


#     msg = ChatMessage(
#         group_id=group_id,
#         sender_id=None,  # None for bot messages
#         sender_type="bot",
#         content=content,     
#         timestamp=datetime.utcnow()
#     )
    
#     db.add(msg)
#     db.commit()
#     db.refresh(msg)
#     db.close()


#     # if group_id in active_connections:
#     #     for ws in active_connections[group_id]:
#     #         asyncio.run(_send_message(ws, content))

#     # db.close()
    
#     payload = {
#         "event": "bot_message",
#         "message": {
#             "id": msg.id,
#             "content": msg.content,
#             "timestamp": msg.timestamp.isoformat()
#         }
#     }
    
#     anyio.from_thread.run(broadcast, group_id, payload)




@router.websocket("/ws/{group_id}")
async def websocket_endpoint(websocket: WebSocket, group_id: int):

    await websocket.accept()
    active_connections.setdefault(group_id, []).append(websocket)

    try:
        while True:
            data = await websocket.receive_text()
            data = json.loads(data)
            
            event = data.get("event")
            
            if event == "message":
                user_id = data.get("user_id")
                content = data.get("content")
          
                db = SessionLocal()
            
                user = db.query(User).filter(User.id == user_id).first()
            
                if not user:
                    db.close()
                    continue
                
                
                chat_msg = ChatMessage(
                    group_id=group_id,
                    sender_id=user.id,
                    sender_type="user",
                    content=content,
                    timestamp=datetime.utcnow()
                )
                db.add(chat_msg)
                db.commit()
                db.refresh(chat_msg)
                
                # Build payload BEFORE closing DB (while object is still attached)
                payload = {
                    "event": "message",
                    "message": {
                        "id": chat_msg.id,
                        "sender_id": user.id,
                        "sender_name": user.name,
                        "content": chat_msg.content,
                        "timestamp": chat_msg.timestamp.isoformat()
                    }
                }
                
                db.close()

                await broadcast(group_id, payload)
            
            
            elif event == "typing":
                user_name = data.get("user_name")
                await broadcast_typing(group_id, user_name)
                
    except WebSocketDisconnect:
        if group_id in active_connections and websocket in active_connections[group_id]:
            active_connections[group_id].remove(websocket)
        print(f"Client disconnected from group {group_id}")
    except Exception as e:
        print(f"WebSocket error in group {group_id}: {str(e)}")
        if group_id in active_connections and websocket in active_connections[group_id]:
            active_connections[group_id].remove(websocket)

        
        
# async def broadcast_expense_message(group_id: int, expense_id: int):
#     db = SessionLocal()
#     try:
#         expense = db.query(Expense).filter(Expense.id == expense_id).first()
#         if not expense:
#             return

#         involved_rows = db.execute(
#             expense_members.select()
#             .where(expense_members.c.expense_id == expense.id)
#         ).all()

#         involved_ids = [row.user_id for row in involved_rows]
#         users = db.query(User).filter(User.id.in_(involved_ids)).all()
#         name_list = ", ".join(u.name for u in users)

#         bot_msg = (
#             f"{expense.payer.name} added ₹{expense.amount} "
#             f"for {expense.note or 'expense'}\n"
#             f"Split between: {name_list}"
#         )
#     finally:
#         db.close()

#     broadcast_bot_message(group_id, bot_msg)
    
    
async def broadcast_typing(group_id: int, user_name: str):
    payload = {
        "event": "typing",
        "user": user_name
    }
    await broadcast(group_id, payload)
    
    
@router.get("/{group_id}/messages")
def get_chat_messages(
    group_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from models import group_members

    # Verify user is in the group
    member = db.execute(
        group_members.select()
        .where(group_members.c.group_id == group_id)
        .where(group_members.c.user_id == current_user.id)
    ).first()

    if not member:
        raise HTTPException(status_code=403, detail="Not a group member")

    # Get last 50 messages
    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.group_id == group_id)
        .order_by(ChatMessage.timestamp.asc())
        .limit(50)
        .all()
    )

    result = []

    for msg in messages:
        if msg.sender_type == "bot":
            result.append({
                "id": msg.id,
                "content": msg.content,
                "timestamp": msg.timestamp.isoformat(),
                "type": "bot"
            })
        else:
            result.append({
                "id": msg.id,
                "content": msg.content,
                "sender_id": msg.sender_id,
                "sender_name": msg.sender.name if msg.sender else "Unknown",
                "timestamp": msg.timestamp.isoformat(),
                "type": "user"
            })

    return result






@router.post("/read/{message_id}")
def mark_as_read(
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    exists = db.execute(
        chat_read_receipts.select()
        .where(chat_read_receipts.c.message_id == message_id)
        .where(chat_read_receipts.c.user_id == current_user.id)
    ).first()

    if not exists:
        db.execute(
            chat_read_receipts.insert().values(
                message_id=message_id,
                user_id=current_user.id
            )
        )
        db.commit()

    return {"status": "read"}

