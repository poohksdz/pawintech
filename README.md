# Pawin Technology - Ecommerce Application

An Ecommerce application built with the MERN stack (MongoDB, Express, React, Node.js) and MySQL.

## Features
- PCB Ordering System (Standard, Custom, Copy PCB)
- Assembly Services
- Admin Dashboard
- Payment Integration (PromptPay QR)
- Notification System

## Prerequisites
- Node.js (v16 or higher)
- MySQL (XAMPP or standalone)
- MongoDB (Optional, for specific features if used)

## Getting Started

### 1. Clone the repository
```bash
git clone <your-repository-url>
cd pawin-backend
```

### 2. Install Dependencies
Install dependencies for both the root (backend) and the frontend.

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 3. Environment Variables
Create a `.env` file in the root directory based on the `.env.example` provided.

```bash
cp .env.example .env
```
Fill in your database credentials and other service configurations in the `.env` file.

### 4. Database Setup
1. Start your MySQL server (e.g., via XAMPP).
2. Create a database named `pawin_tech`.
3. The application will handle table creation via Sequelize/Models on startup (if configured).

### 5. Run the Application

#### Development Mode
Run both backend and frontend concurrently:
```bash
npm run dev
```

#### Production Mode
1. Build the frontend:
```bash
cd frontend
npm run build
cd ..
```
2. Start the server:
```bash
npm start
```

## Folder Structure
- `/controllers` - Backend logic
- `/models` - Database models (Sequelize/Mongoose)
- `/routes` - API endpoints
- `/frontend` - React application
- `/uploads` - User uploaded files (ignored by Git)
