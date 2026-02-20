# Signature_app: Full-Stack E-Signature Platform

## Project Overview
Signature_app is a high-performance, full-stack Document Management and E-Signature platform designed to let users securely upload, digitally sign, and share PDF documents. This project implements real-world backend practices including FastAPI security, strict file-system routing, and deep PDF manipulation using PyMuPDF.

## Live Links
* **Frontend:** [Signature_app Web App](https://fast-api-and-react-1u1005gq6-yash-kadams-projects-4187f088.vercel.app/)
* **Backend API:** [Signature_app Swagger UI](https://fastapiandreact-production.up.railway.app/docs)

## Key Features
###  Authentication & Security
* **JWT Authentication:** Secure user sessions using JSON Web Tokens.
* **Password Hashing:** Industry-standard password security using Argon2.
* **Protected Routes:** API endpoints are protected by dependency injection to ensure only authorized users can access or modify their documents.

### E-Signature & Document Management
* **Document Vault:** Upload, store, and manage personal PDF documents.
* **Interactive Signature Pad:** Draw your signature digitally directly in the browser using the HTML5 Canvas API, or upload a scanned image.
* **Drag-and-Drop Placement:** Visually drag your signature onto the document using `@dnd-kit` to set the exact X and Y coordinates.
* **PDF Engine:** The backend permanently "burns" the signature onto the PDF using PyMuPDF, altering the file securely.
* **Public Sharing Gateway:** Generate decoupled, cryptographically secure share links to send signed documents to unauthenticated clients.
## Tech Stack
### Backend (Python)
* **Framework:** FastAPI (High performance, Asynchronous support)
* **File Processing:** PyMuPDF / fitz (Advanced PDF manipulation)
* **Database:** SQLite (Local) / PostgreSQL (Production)
* **ORM:** SQLAlchemy 2.0
* **Security:** Passlib (Argon2), python-jose (JWT)

### Frontend (React)
* **Framework:** React.js (Vite-powered)
* **PDF Rendering:** react-pdf
* **Interactivity:** @dnd-kit (Drag and drop coordinate mapping)
* **Styling:** Tailwind CSS (Responsive, utility-first design)
* **API Client:** Axios

## Local Setup
### 1. Clone the Repository
```bash
git clone [https://github.com/yashkdm01/signature_app.git](https://github.com/yashkdm01/signature_app.git)
cd signature_app

___________________________________________________________________

### Backend Setup
Navigate to the backend directory, isolate your environment, and install the dependencies.
Bash
cd backend
python -m venv venv

# Activate on Windows:
venv\Scripts\activate
# Activate on Mac/Linux:
source venv/bin/activate 

pip install -r requirements.txt

Create a .env file in the backend directory with your security credentials:
Code snippet
SECRET_KEY=your_super_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
Start the server:
Bash
uvicorn main:app –reload

___________________________________________________________________

Frontend Setup
Open a new terminal, navigate to the frontend directory, and start the development server.
Bash
cd frontend
npm install
npm run dev
API Documentation
The API automatically generates documentation once the server is running. You can interact with the endpoints directly:
•	Swagger UI: http://localhost:8000/docs
•	ReDoc: http://localhost:8000/redoc

