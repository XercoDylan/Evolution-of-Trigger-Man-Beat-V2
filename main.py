import os
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")

SOUNDS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "Sounds")
app.mount("/sounds", StaticFiles(directory=SOUNDS_DIR), name="sounds")



@app.get("/")
async def home():
    return FileResponse("static/Home/home.html")


@app.get("/story")
async def story():
    return FileResponse("static/Story/story.html")
