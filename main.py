from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")



@app.get("/")
async def home():
    return FileResponse("static/Home/home.html")


@app.get("/story")
async def story():
    return FileResponse("static/Story/story.html")
