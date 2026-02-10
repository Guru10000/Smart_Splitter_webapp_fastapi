
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import models
from routers import auth, groups, expenses,chat,admin,settlement,about
from dotenv import load_dotenv
import os

Base.metadata.create_all(bind=engine)

app = FastAPI()

load_dotenv()

frontend_url = os.getenv("FRONTEND_URL")
prod_frontend_url = os.getenv("PROD_FRONTEND_URL")

origins = [frontend_url]

if prod_frontend_url:
    origins.append(prod_frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(groups.router)
app.include_router(expenses.router)
app.include_router(admin.router)
app.include_router(settlement.router)
app.include_router(about.router)

@app.get("/")
def root():
    return {"message": "smart splitter api is running"}