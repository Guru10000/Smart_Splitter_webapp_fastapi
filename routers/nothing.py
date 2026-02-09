# # chat.py
# from fastapi import APIRouter, WebSocket, Depends, HTTPException
# from starlette import status
# from sqlalchemy.orm import Session
# from database import SessionLocal
# from models import ChatMessage, User, Expense, expense_members, chat_read_receipts
# from datetime import datetime
# import asyncio
# import json
# from .auth import get_current_user

# router = APIRouter(
#     prefix="/chat",
#     tags=["chat"]
# )

# active_connections: dict[int, list[WebSocket]] = {}

# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()


# async def _send_message(ws: WebSocket, payload: dict):
#     try:
#         await ws.send_text(json.dumps(payload))
#     except:
#         pass


# def broadcast_bot_message(group_id: int, content: str):
#     db = SessionLocal()


#     msg = ChatMessage(
#         group_id=group_id,
#         sender_id=None,  # None for bot messages
#         content=content,
#         timestamp=datetime.utcnow()
#     )
#     db.add(msg)
#     db.commit()
#     db.refresh(msg)


#     if group_id in active_connections:
#         for ws in active_connections[group_id]:
#             asyncio.run(_send_message(ws, content))

#     db.close()


# async def broadcast_expense_message(group_id: int, expense_id: int):
#     db = SessionLocal()
#     expense = db.query(Expense).filter(Expense.id == expense_id).first()
#     if not expense:
#         db.close()
#         return

#     # Get names of involved users
#     involved_rows = db.execute(
#         expense_members.select().where(expense_members.c.expense_id == expense.id)
#     ).all()
#     involved_ids = [row.user_id for row in involved_rows]
#     involved_users = db.query(User).filter(User.id.in_(involved_ids)).all()
#     name_list = ", ".join([u.name for u in involved_users])

#     # Build bot message
#     bot_msg = (
#         f"💸 {expense.payer.name} added ₹{expense.amount} "
#         f"for {expense.note or 'expense'}\n"
#         f"👥 Split between: {name_list}"
#     )

#     # Save and broadcast
#     broadcast_bot_message(group_id, bot_msg)
#     db.close()
    
# async def broadcast_typing(group_id: int, user_name: str):
#     typing_msg = f"✍️ {user_name} is typing..."
#     if group_id in active_connections:
#         for ws in active_connections[group_id]:
#             try:
#                 await _send_message(ws, typing_msg)
#             except:
#                 pass


# @router.websocket("/ws/{group_id}")
# async def websocket_endpoint(websocket: WebSocket, group_id: int):
#     """WebSocket endpoint for real-time chat per group."""
#     await websocket.accept()
#     active_connections.setdefault(group_id, []).append(websocket)

#     try:
#         while True:
#             # Receive user messages (you can extend this later)
#             msg = await websocket.receive_text()

#             # Here, you could save user messages in DB
#             db = SessionLocal()
#             chat_msg = ChatMessage(
#                 group_id=group_id,
#                 sender_id=None,  # You can replace with actual user_id if using auth
#                 content=msg,
#                 timestamp=datetime.utcnow()
#             )
#             db.add(chat_msg)
#             db.commit()
#             db.refresh(chat_msg)
#             db.close()

#             # Broadcast to all clients
#             for ws in active_connections[group_id]:
#                 asyncio.create_task(_send_message(ws, msg))

#     except:
#         # Remove disconnected websocket
#         active_connections[group_id].remove(websocket)
        
#     try:
#         while True:
#             data = await websocket.receive_json()
#             event = data.get("event")
            
#             if event == "typing":
#                 user_name = data.get("user_name")
#                 await broadcast_typing(group_id, user_name)
                
#             elif event == "message":
#                 content = data.get("content")
                
#     except:
#         active_connections[group_id].remove(websocket)
        
# @router.post("/read/{message_id}")
# def mark_as_read(message_id: int,current_user: User = Depends(get_current_user), db: Session=Depends(get_db)):
#     message = db.query(ChatMessage).filter(ChatMessage.id == message_id).first()
    
#     if not message:
#         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
    
#     exists = db.execute(
#         chat_read_receipts.select()
#         .where(chat_read_receipts.c.message_id==message_id)
#         .where(chat_read_receipts.c.user_id == current_user.id)
#     ).first()
    
#     if not exists:
#         db.execute(
#             chat_read_receipts.insert().values(
#                 message_id=message_id,
#                 user_id=current_user.id
#             )
#         )
        
#         db.commit()
        
#     return{"status": "read"}
