const path = require('path')
const express = require('express')
const dotenv = require('dotenv')
const cookieParser = require('cookie-parser')
const cors = require('cors') // ✅ CORS ต้องมาก่อน
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const hpp = require('hpp')
const xss = require('xss-clean')

// ✅ Load Config
dotenv.config()
const validateEnv = require('./utils/envValidator.js')
validateEnv()

// ✅ Connect Database (SQL)
require('./config/db.js')
const { pool } = require('./config/db.js')

const { notFound, errorHandler } = require('./middleware/errorMiddleware.js')
const { seedDatabase } = require('./utils/seeder.js')

// ✅ Auto-seed database in development mode
if (process.env.NODE_ENV === 'development') {
  seedDatabase().catch(err => console.error('Seeder failed:', err));
}

// ✅ Star Rating Auto-Reset Job
const initStarResetCron = require('./utils/starResetCron.js')
initStarResetCron()

// =========================================================
// 📦 IMPORT ROUTES
// =========================================================
const productRoutes = require('./routes/productRoutes.js')
const serviceRoutes = require('./routes/serviceRoutes.js')
const orderpcbRoutes = require('./routes/orderpcbRoutes.js')
const folioRoutes = require('./routes/folioRoutes.js')
const categoryRoutes = require('./routes/categoryRoutes.js')
const userRoutes = require('./routes/userRoutes.js')
const orderRoutes = require('./routes/orderRoutes.js')
const uploadRoutes = require('./routes/uploadRoutes.js')
const showcaseRoutes = require('./routes/showcaseRoutes.js')
const blogRoutes = require('./routes/blogRoutes.js')
const aboutRoutes = require('./routes/aboutRoutes.js')
const aboutImageRoutes = require('./routes/aboutImageRoutes.js')
const emailRoutes = require('./routes/emailRoutes.js')
const invoiceRoutes = require('./routes/invoiceRoutes.js')
const vatDefaultRouters = require('./routes/vatDefaultRouters.js')
const uploadDefaultInvoiceLogoRoutes = require('./routes/uploadDefaultInvoiceLogoRoutes.js')
const quotationRoutes = require('./routes/quotationRoutes.js')
const quotationDefaultRoutes = require('./routes/quotationDefaultRoutes.js')
const customerRoutes = require('./routes/customerRoutes.js')
const gerberRoutes = require('./routes/gerberRoutes.js')
const notificationRoutes = require('./routes/notificationRoutes.js')

// Payment Routes
const paymentRoutes = require('./routes/paymentRoutes.js')

// Cart Routes
const cartRoutes = require('./routes/cartRoutes.js')

// Stock System Routes
const stockProductRoutes = require('./routes/stockProductRoutes.js')
const stockCategoryRoutes = require('./routes/stockCategoryRoutes.js')
const stockSubcategoryRoutes = require('./routes/stockSubcategoryRoutes.js')
const stockFootprintRoutes = require('./routes/stockFootprintRoutes.js')
const stockManufactureRoutes = require('./routes/stockManufactureRoutes.js')
const stockSupplierRoutes = require('./routes/stockSupplierRoutes.js')
const stockRequestRoutes = require('./routes/stockRequestRoutes.js')
const stockIssueRoutes = require('./routes/stockIssueRoutes.js')
const stockReceiveRoutes = require('./routes/stockReceiveRoutes.js')

// PCB Systems Routes
const copypcbRoutes = require('./routes/copypcbRoutes.js')
const copypcbCartRoutes = require('./routes/copypcbCartRoutes.js')

const custompcbRoutes = require('./routes/custompcbRoutes.js')
const custompcbCartRoutes = require('./routes/custompcbCartRoutes.js')
const assemblypcbRoutes = require('./routes/assemblypcbRoutes.js')
const assemblypcbCartRoutes = require('./routes/assemblypcbCartRoutes.js')

const port = process.env.PORT || 5000

const app = express()

// ✅ FIX: Proxy Trust (สำคัญสำหรับ Heroku/Cloud หรือการทำงานหลัง Nginx)
app.set('trust proxy', 1)

// =========================================================
// 🛡️ CORS SECTION (แก้ปัญหา Blocked Origin ตรงนี้)
// =========================================================
// กำหนด Origin ที่อนุญาตให้ชัดเจน ไม่ต้องใช้ Function Callback เพื่อลดความผิดพลาด
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  'http://127.0.0.1:3000',
  process.env.CLIENT_URL // (ถ้าใน .env ไม่มีค่านี้ ก็ไม่เป็นไร เพราะมี localhost ดักไว้แล้ว)
]

app.use(cors({
  origin: allowedOrigins,
  credentials: true, // อนุญาตให้ส่ง Cookie/Auth Header
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}))

// =========================================================
// 🛡️ SECURITY & PARSERS
// =========================================================

// Body Parser (ย้ายมาไว้ตรงนี้เพื่อให้รับ JSON ได้ก่อนจะโดน Security อื่นๆ กวน)
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))
app.use(cookieParser())

// Helmet (Security Headers)
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "blob:", "http:", "https:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "http:", "https:", "ws:", "wss:"],
    },
  },
  referrerPolicy: { policy: 'same-origin' }, // ✅ ป้องกัน Leak ข้อมูล Referrer
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true } // ✅ Enforce HTTPS
}))

app.use(xss())
app.use(hpp())

// Rate Limiting (จำกัดการยิง Request ถี่ๆ)
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 5000 : 500, // ✅ เพิ่ม Limit ในโหมด Dev
  message: 'Too many requests from this IP, please try again later.'
})
app.use('/api', limiter)

// Stricter Rate Limit for Login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: process.env.NODE_ENV === 'development' ? 1000 : 20, // ✅ เพิ่ม Limit ในโหมด Dev
  message: 'Too many login attempts, please try again after 15 minutes'
})
// Rate limiting specifically for reset password
const resetLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 5, // ✅ เพิ่ม Limit ในโหมด Dev
  message: 'มีการส่งคำขอมากเกินไป กรุณาลองใหม่ในอีก 15 นาที',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/users/login', loginLimiter)
app.use('/api/users/request-reset', resetLimit);

// =========================================================
// 📂 STATIC FILES & MALFORMED REQUEST FILTER
// =========================================================
const rootPath = path.resolve();

// 1. Filter out known malformed requests to prevent noisy server logs
app.use((req, res, next) => {
  if (req.url.includes('[object%20Object]') || req.url.includes('[object Object]')) {
    return res.status(400).json({ message: 'Malformed URL request blocked' });
  }
  next();
});

const staticFolders = [
  'uploads', 'images', 'serviceImages', 'showcaseImages', 'blogImages', 'folios',
  'copypcps', 'componentImages', 'paymentSlipImages', 'aboutImages', 'datasheets',
  'manuals', 'quotationimages', 'defaultquotationimages', 'copypcbImages',
  'copypcbZipFiles', 'custompcbImages', 'custompcbZipFiles', 'assemblypcbImages',
  'assemblypcbZipFiles', 'gerbers'
];

// Serve static folders with specific prefixes (Recommended)
staticFolders.forEach(folder => {
  app.use(`/${folder}`, express.static(path.join(rootPath, folder)));
});

// Fallback: Serve files from root of each folder if no prefix provided (Emergency Fix)
// Note: This is after the malformed request filter, so [object Object] will be blocked before reaching here.
staticFolders.forEach(folder => {
  app.use('/', express.static(path.join(rootPath, folder)));
});

// Health Check Endpoint (For Cloud Load Balancers)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})


app.use('/api/gerber', gerberRoutes)
app.use('/api/products', productRoutes)
app.use('/api/services', serviceRoutes)
app.use('/api/orderpcbs', orderpcbRoutes)
app.use('/api/folios', folioRoutes)
app.use('/api/categorys', categoryRoutes)
app.use('/api/users', userRoutes)
app.use('/api/customers', customerRoutes)

// Cart Routes
app.use('/api/cart', cartRoutes)

app.use('/api/quotations', quotationRoutes)
app.use('/api/quotations/upload', require('./routes/uploadQuotationRoutes'))
app.use('/api/defaultquotations', quotationDefaultRoutes)
app.use('/api/defaultquotations/upload', require('./routes/uploadQuotationDefaultRoutes'))
app.use('/api/invoices', invoiceRoutes)
app.use('/api/defaultinvoices', vatDefaultRouters)
app.use('/api/defaultInvoiceImages', uploadDefaultInvoiceLogoRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api', uploadRoutes)
app.use('/api/showcases', showcaseRoutes)
app.use('/api/blogs', blogRoutes)
app.use('/api/abouts', aboutRoutes)
app.use('/api/aboutimages', aboutImageRoutes)
app.use('/api/emails', emailRoutes)
app.use('/api/notifications', notificationRoutes)

// Payment Routes
app.use('/api/payments', paymentRoutes)

// Stock Routes
app.use('/api/stockproducts', stockProductRoutes)
app.use('/api/stockcategories', stockCategoryRoutes)
app.use('/api/stocksubcategories', stockSubcategoryRoutes)
app.use('/api/stockfootprints', stockFootprintRoutes)
app.use('/api/stockmanufactures', stockManufactureRoutes)
app.use('/api/stocksuppliers', stockSupplierRoutes)
app.use('/api/stockrequests', stockRequestRoutes)
app.use('/api/stockissues', stockIssueRoutes)
app.use('/api/stockreceives', stockReceiveRoutes)

// PCB Routes
app.use('/api/copypcbs', copypcbRoutes)
app.use('/api/copypcbs/upload', require('./routes/uploadCopyPCBRoutes')) // ✅ Added
app.use('/api/copycartpcbs', copypcbCartRoutes)
app.use('/api/copycartpcbs/upload', require('./routes/uploadCopyPCBRoutes')) // ✅ Added

app.use('/api/custompcbs', custompcbRoutes)
app.use('/api/custompcbs/upload', require('./routes/uploadCustomPCBRoutes')) // ✅ Added
app.use('/api/customcartpcbs', custompcbCartRoutes)
app.use('/api/customcartpcbs/upload', require('./routes/uploadCustomPCBRoutes'))

app.use('/api/assemblypcbs', assemblypcbRoutes)
app.use('/api/assemblypcbs/upload', require('./routes/uploadAssemblyPCBRoutes.js')) // ✅ Added
app.use('/api/assemblycartpcbs', assemblypcbCartRoutes)
app.use('/api/assemblycartpcbs/upload', require('./routes/uploadAssemblyPCBRoutes.js'))

// Production / Frontend Build
if (process.env.NODE_ENV === 'production') {
  // ✅ ใช้ rootPath แทน __dirname ป้องกัน Error Syntax ในบางโหมด
  app.use(express.static(path.join(rootPath, 'frontend/build')))
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(rootPath, 'frontend', 'build', 'index.html'))
  })
} else {
  app.get('/', (req, res) => {
    res.send('API is running securely (SQL Mode)....')
  })
}

// Error Handling
app.use(notFound)
app.use(errorHandler)

const server = app.listen(port, () =>
  console.log(`✅ Server running in ${process.env.NODE_ENV} mode on port ${port} (SQL Mode)`)
)

// =========================================================
// 🛡️ GRACEFUL SHUTDOWN (For Cloud Environments)
// =========================================================
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received. Shutting down gracefully...')
  server.close(async () => {
    console.log('✔ HTTP server closed.')
    try {
      await pool.end()
      console.log('✔ Database pool closed.')
      process.exit(0)
    } catch (err) {
      console.error('✘ Error during database pool shutdown:', err)
      process.exit(1)
    }
  })
})

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received. Shutting down gracefully...')
  server.close(async () => {
    try {
      await pool.end()
      process.exit(0)
    } catch (err) {
      process.exit(1)
    }
  })
})