
# SpendWise

A personal finance management application for tracking income, expenses, and cash flow.

SpendWise provides a central place to record transactions, manage categories, and review spending patterns through a dashboard and financial reports.

## Features

- **Authentication** — Register an account and sign in.
- **Dashboard** — View an overview of your financial activity.
- **Transactions** — Add, edit, delete, search, and filter income and expenses.
- **Categories** — Create and manage income and expense categories.
- **Reports** — Review income, expenses, net cash flow, savings rate, monthly comparisons, and expense breakdowns.
- **Date filters** — Review transactions and reports for selected periods.
- **Responsive UI** — Dark-themed interface with a purple and pink color palette.

## Tech Stack

### Frontend
- React
- Vite
- React Router
- Axios
- CSS

### Backend
- Java
- Spring Boot
- Spring Security
- JWT authentication
- Spring Data MongoDB

### Database
- MongoDB Atlas

## Project Structure

```text
spendwise/
├── backend/
│   ├── src/
│   └── pom.xml
│
└── frontend/
    ├── public/
    ├── src/
    │   ├── api/
    │   ├── pages/
    │   │   ├── Categories.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Reports.jsx
    │   │   └── Transactions.jsx
    │   ├── App.jsx
    │   ├── App.css
    │   ├── Auth.css
    │   └── index.css
    ├── package.json
    └── README.md
```

## Getting Started

### Requirements

- Node.js and npm
- Java 21
- MongoDB Atlas account or a compatible MongoDB deployment

### 1. Clone the repository

```bash
git clone https://github.com/monatat/spendwise.git
cd spendwise
```

### 2. Configure the backend

Configure the MongoDB connection string and JWT secret using the environment variables expected by the backend:

```text
SPENDWISE_MONGODB_URI
SPENDWISE_JWT_SECRET
```

Set these variables in your local environment before starting the backend. Do not commit credentials or secret values to GitHub.

### 3. Start the backend

Open a terminal in the `backend` folder:

```bash
cd backend
```

On Windows PowerShell:

```powershell
.\mvnw.cmd spring-boot:run
```

The backend is expected to run on `http://localhost:8080` with the current frontend API configuration.

### 4. Start the frontend

Open a second terminal in the `frontend` folder:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite, usually:

```text
http://localhost:5173
```

## Development

Run the frontend and backend in separate terminals while developing.

Frontend linting:

```bash
npm run lint
```

Create a production frontend build:

```bash
npm run build
```

## Notes

- The frontend communicates with the backend through the Axios API client.
- Financial reports are calculated from transaction data returned by the backend.
- Keep local environment files and credentials out of version control.
- This project is intended for personal finance tracking and development purposes.

## License

No license has been specified yet.
