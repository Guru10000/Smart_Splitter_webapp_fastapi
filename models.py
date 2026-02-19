from database import Base
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Table, Float,Boolean
from sqlalchemy.orm import relationship
from datetime import datetime



group_members = Table(
    "group_members",
    Base.metadata,
    Column("group_id", Integer, ForeignKey("groups.id", ondelete="CASCADE"), primary_key=True),
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"),primary_key=True),
    Column("role", String, default="member")   
)

expense_members = Table(
    "expense_members",
    Base.metadata,
    Column("expense_id", Integer, ForeignKey("expenses.id", ondelete="CASCADE"), primary_key=True),
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"),primary_key=True)
)

chat_read_receipts = Table(
    "chat_read_recipts",
    Base.metadata,
    Column("message_id", Integer, ForeignKey("chat_messages.id", ondelete="CASCADE"), primary_key=True),
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"),primary_key=True)
)



class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=True)
    password_hash = Column(String, nullable=False)
    
    groups = relationship("Group", secondary=group_members, back_populates="members")
    expenses_paid = relationship("Expense", back_populates="payer")
    
    
class OTPVerification(Base):
    __tablename__ = "otp_verifications"
    
    id = Column(Integer, primary_key=True)
    phone = Column(String, nullable=False, index=True)
    otp = Column(String, nullable=False)
    expires_at= Column(DateTime)
    verified = Column(Boolean, default=False)
    
    
    
    
class Group(Base):
    __tablename__ = "groups"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    
    members = relationship("User", secondary=group_members, back_populates="groups")
    expenses = relationship("Expense", back_populates="group")
    messages = relationship("ChatMessage", back_populates="group")
    
    
    
    
class Expense(Base):
    __tablename__ = "expenses"
    
    id = Column(Integer, primary_key=True, index=True)
    group_id =Column(Integer, ForeignKey("groups.id", ondelete="CASCADE"))
    paid_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    amount = Column(Float, nullable=False)
    note = Column(String)
    date = Column(DateTime, default=datetime.utcnow)
    
    payer = relationship("User", back_populates="expenses_paid")
    group = relationship("Group", back_populates="expenses")
    involved_users = relationship("User", secondary=expense_members)
    
    
    
class ChatMessage(Base):
    __tablename__ = "chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="CASCADE"))
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    sender_type = Column(String, default="user")  # 'user' or 'bot'
    content = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    group = relationship("Group", back_populates="messages")
    readers = relationship("User", secondary=chat_read_receipts)
    
    sender = relationship("User", foreign_keys=[sender_id])
    

class GroupInvite(Base):
    __tablename__ = "group_invites"
    
    id = Column(Integer, primary_key=True)
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="CASCADE"))
    token = Column(String, unique=True, index=True)
    expires_at = Column(DateTime)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    used = Column(Boolean, default=False)
    
    
class Settlement(Base):
    __tablename__ = "settlements"
    
    id = Column(Integer, primary_key=True)
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="CASCADE"))
    payer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    receiver_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    amount = Column(Float, nullable=False)
    settled_at = Column(DateTime, default=datetime.utcnow())
    is_paid = Column(Boolean, default=False)
    
    payer = relationship("User", foreign_keys=[payer_id])
    receiver = relationship("User", foreign_keys=[receiver_id])
    
class Feedback(Base):
    __tablename__ = "feedbacks"
    
    id = Column(Integer, primary_key=True)
    name = Column(String)
    email = Column(String)
    rating = Column(String)
    comments = Column(String)
    created_at = Column(DateTime,
        default=datetime.utcnow)
    
    

    
    
    