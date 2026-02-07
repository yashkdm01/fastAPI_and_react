🐛 TaskFlow - Issue Tracker
📌 Project Overview
TaskFlow is a high-performance, full-stack Task Management System designed to help teams organize projects and track workflows with a modern interface. This project implements real-world backend practices including FastAPI security, Asynchronous SQLAlchemy, and PostgreSQL relational mapping.


🌐 Live Links
Frontend: https://taskflow-o04bo1xgy-yash-kadams-projects-4187f088.vercel.app/
Backend API: https://fastapi-and-react.onrender.com/docs


🚀 Key Features
🔐 Authentication & Security
JWT Authentication: Secure user sessions using JSON Web Tokens with automated expiration and refresh logic.
Password Hashing: Industry-standard password security using passlib and bcrypt.
Protected Routes: API endpoints are protected by dependency injection to ensure only authorized users access data.


📂 Project & Task Management
Project Organization: Create distinct project spaces and assign team members.
Ticket System: Full CRUD functionality for bugs, feature requests, and tasks.
Kanban Board: Interactive drag-and-drop interface powered by @dnd-kit to move tickets through "To Do", "In Progress", and "Done".
Collaborative Comments: Discussion threads on individual tickets for team communication.


💻 Tech Stack
Backend (Python)
Framework: FastAPI (High performance, Asynchronous support).
Database: PostgreSQL (Relational Database Management).
ORM: SQLAlchemy 2.0 (AsyncIO support).
Migrations: Alembic (Database version control).
Validation: Pydantic v2 (Strict data parsing).
Frontend Framework: React.js (Vite-powered).
Styling: Tailwind CSS (Responsive, utility-first design).
State Management: React Context API & Hooks.
API Client: Axios with Request Interceptors.


⚙️ Local Setup
1. Clone the Repository
Bash
git clone https://github.com/yashkdm01/fastAPI_and_react.git
cd fastAPI_and_react

2. Backend Setup
Bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create a .env file in the backend directory:
Code snippet:
DATABASE_URL=postgresql+asyncpg://user:password@localhost/jira_db
SECRET_KEY=your_super_secret_key_here
ALGORITHM=HS256

3. Frontend Setup
Bash
cd ../frontend
npm install
npm run dev

🛠️ API Documentation
The API automatically generates documentation once the server is running:
Swagger UI: http://localhost:8000/docs
ReDoc: http://localhost:8000/redoc

Swagger UI: http://localhost:8000/docs

ReDoc: http://localhost:8000/redoc
