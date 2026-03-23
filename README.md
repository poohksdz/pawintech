# Pawin Technology - Industrial Solutions Ecommerce

A robust, high-performance ecommerce platform specialized for industrial PCB solutions, electronics, and technical services. Built with a focus on speed, security, and ease of use.

## 🚀 Technology Stack
- **Backend**: Node.js, Express.js
- **Database**: MySQL (using `mysql2/promise`)
- **Frontend**: React.js with Redux Toolkit
- **Security**: JWT Authentication, Bcrypt hashing, Helmet, Rate Limiting, CORS, XSS Protection.
- **Tools**: Axios, Multer, Jimp, jsQR (for payment verification).

## 🛡️ Key Features & Security
- **PCB Ordering**: Standard, Custom, and Copy PCB ordering flows.
- **Secure File Uploads**: Protected Gerber and quotation uploads with path traversal prevention.
- **Admin Dashboard**: Comprehensive management of products, service blogs, and orders.
- **Thai Localization**: Full support for both English and Thai languages across all customer-facing and internal dashboards.
- **Payment Verification**: Automated PromptPay QR code verification to match slip amounts with order totals.
- **Hardenened Security**: Public debug leaks removed, secure cookie handling, and strong environment management.

---

## 🛠️ Getting Started

### 1. Prerequisites
- **Node.js**: v16 or higher
- **MySQL**: Managed via phpMyAdmin (often part of XAMPP) or a standalone MySQL instance.

### 2. Environment Setup
The application uses environment variables for configuration. Create a `.env` file in the root directory by copying the example provided:

```bash
cp .env.example .env
```
Once created, open the `.env` file and fill in your database credentials and other necessary service configurations (secrets, email, etc.). **Never commit the `.env` file to version control.**

### 3. Installation
Install dependencies for both the backend and frontend:

```bash
# Backend dependencies
npm install

# Frontend dependencies
cd frontend
npm install
cd ..
```

### 4. Database Initialization
Ensure your MySQL server is running (e.g., via XAMPP Control Panel). Open **phpMyAdmin**, and create a database named `pawin_tech`. Import the provided SQL schema to set up all required tables.

### 5. Running the Application
```bash
# Start both Backend and Frontend concurrently
npm run dev
```

---

## 📁 Project Structure
- `/controllers` - Main backend business logic and raw SQL queries.
- `/routes` - API route definitions and access control middleware.
- `/middleware` - Custom security and authentication handlers.
- `/utils` - Utility functions for JWT, file cleanup, and QR processing.
- `/frontend` - React single-page application.
- `/gerbers`, `/quotationimages`, `/uploads` - Persistent storage for uploads (git-ignored).

## 📄 License
Custom / Private Repository - Internal Pawin Technology Development.
