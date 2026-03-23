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
- **MySQL**: XAMPP (MariaDB) or a standalone MySQL instance.

### 2. Environment Setup
Create a `.env` file in the root directory based on the following template:

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your_strong_random_secret

DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=pawin_tech
```

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
Ensure your MySQL server is running and create a database named `pawin_tech`. Import the provided SQL schema (if available) to set up tables.

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
