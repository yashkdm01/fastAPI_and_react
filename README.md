# AI Data Analyst Dashboard 

Hey there! Welcome to my AI Data Analyst Dashboard. 

I built this full-stack application to solve a pretty common problem: business teams always have questions about their data, but they don't always know how to write Python or SQL to get the answers. This dashboard bridges that gap. It lets users upload a raw CSV file and literally just type what they want to know in plain English. The backend figures out the math, writes the Pandas code, and spits back a clean, interactive chart.

## Tech Stack

I wanted this to be fast and lightweight, so I went with:
*   **Frontend:** React.js, Tailwind CSS (for that dark, glassmorphic UI), and Recharts for the visualizations. Built with Vite.
*   **Backend:** FastAPI (Python). It’s incredibly fast and great for asynchronous tasks.
*   **Data Processing:** Pandas.
*   **NLP Engine:** Custom-built deterministic keyword mapper.

## How It Works (The Cool Stuff)

Instead of just hooking up an LLM and calling it a day, I engineered a few specific solutions to make this app run like a production environment:

1.  **Memory-Safe Uploads:** When you upload a CSV, it doesn't save to the server's hard drive. I used `io.BytesIO` to read the byte-stream directly into server RAM. It builds the Pandas DataFrame instantly without I/O latency.
2.  **Custom NLP-to-Pandas Engine:** To keep API costs down and responses instant, the backend parses the user's plain-English sentence, extracts the category and metric targets, figures out the math operation (`sum`, `mean`, `count`), and executes the Pandas logic on the fly.
3.  **JSON Type Safety:** Pandas loves to return `numpy.int64` data types, which completely break standard JSON encoders. I built a type-casting layer to catch these and convert them to native Python integers before they hit the API boundary, preventing 500 Server Errors.

## Running It Locally

If you want to spin this up on your own machine, here is how you do it:

**1. Clone the repo**
```bash
git clone [https://github.com/yashkdm01/fastAPI_and_react.git](https://github.com/yashkdm01/fastAPI_and_react.git)
cd fastAPI_and_react


----  cd backend
python -m venv venv
source venv/bin/activate  # (use venv\Scripts\activate on Windows)
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload


---- cd frontend
npm install
npm run dev

Then just open http://localhost:5173 in your browser!
