# Campus Lost & Found Portal

A full-stack responsive web application for a college or university campus. Enables students, faculty, and campus staff to report lost and found property, search listings with filters, discover possible matches via an intelligent multi-attribute heuristic algorithm, submit private ownership claims with non-public evidence, and complete physical handover using single-use time-limited QR verification tokens scanned by authorized administrators.

---

## 🏛️ System Architecture

```text
Lost-Found/
├── frontend/               # Next.js 16 (React 19, TypeScript, Tailwind CSS, Lucide Icons)
│   ├── src/app/            # App Router pages (Catalog, Report Wizards, Dashboards, Admin Console)
│   ├── src/components/     # Reusable UI components & QR Camera Scanner
│   └── src/lib/            # Axios API client & AuthProvider context
│
├── backend/                # FastAPI (Python 3.14, Async Motor MongoDB driver, Pydantic v2)
│   ├── app/core/           # Security (bcrypt, JWT), Config (.env), Async DB connection & indexing
│   ├── app/models/         # User, Report, Claim, QR Token, Notification, and AuditLog models
│   ├── app/routers/        # Auth, Reports, Claims, Admin, and Notification endpoints
│   ├── app/services/       # Multi-attribute heuristic matching engine, StorageProvider, QR service
│   ├── tests/              # Pytest test suite for security, matching, and tokens
│   └── uploads/            # Local media storage directory (static mount)
│
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Python 3.10+** (Tested on Python 3.14)
- **Node.js v18+** & **npm**
- **MongoDB Atlas** connection string (or local MongoDB)

---

### 2. Backend Setup

1. Open a terminal and navigate to `backend/`:
   ```bash
   cd backend
   ```
2. Install Python dependencies:
   ```bash
   python -m pip install -r requirements.txt
   ```
3. Configure your `.env` file (copy from `.env.example`):
   ```env
   MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority"
   DATABASE_NAME="lost_and_found_db"
   SECRET_KEY="campus-lost-and-found-super-secret-jwt-key"
   AUTO_APPROVE_REPORTS=False
   ```
   *(Set `AUTO_APPROVE_REPORTS=True` if you want submitted reports to automatically publish without manual admin approval during rapid testing)*.

4. Seed the initial Administrator account:
   ```bash
   python seed.py
   ```
   - **Default Admin Account**: `admin@campus.edu`
   - **Default Password**: `Admin@12345`

5. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   Interactive Swagger API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### 3. Frontend Setup

1. Open a second terminal and navigate to `frontend/`:
   ```bash
   cd frontend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
4. Open the application in your browser:
   👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🧪 Running Automated Tests

Run backend unit tests verifying password hashing, cryptographic token generation, SHA-256 storage, and the multi-attribute matching engine:

```bash
cd backend
python -m pytest
```

---

## 🔑 Key Workflows

### 1. Lost & Found Reporting
- **Report Lost Item** (`/reports/lost/new`): Users provide item details, category, color, brand, location, event date, and optional photograph.
- **Report Found Item** (`/reports/found/new`): Finder provides observable item attributes and private physical custody location (e.g. Campus Security Office, Library Desk).

### 2. Multi-Attribute Candidate Matching Engine
- Automatically compares newly published reports against eligible opposite-type listings.
- Heuristic scoring formula:
  - **Category Alignment**: 30%
  - **Color Overlap**: 20%
  - **Brand Token Matching**: 20%
  - **Location Overlap**: 15%
  - **Date Proximity Decay**: 10%
  - **Keyword Jaccard Overlap**: 5%
- Pairs scoring $\ge 50\%$ generate candidate match records and trigger in-app notifications to the lost item owner.

### 3. Private Ownership Claims
- On an eligible found item, claimants click **Claim this Item**.
- Private verification inputs (distinctive scratches, decals, secret pocket contents, serial numbers) are withheld from public view and made accessible exclusively to authorized campus administrators.

### 4. Admin Review & QR Handover
- Administrators review claims at `/admin/claims`.
- On approval, a **256-bit URL-safe token** is generated with a 48-hour expiration. The SHA-256 hash is saved in MongoDB and the QR pass is presented on the claimant's dashboard (`/dashboard/claims/[id]`).
- At collection, the administrator opens the **QR Camera Scanner** (`/admin/handover`), scans the claimant's phone screen, verifies the physical item details, and clicks **Confirm Handover**.
- The token is atomically retired (`status="used"`), the claim is marked `completed`, the item is marked `returned`, and an audit event is permanently logged.
