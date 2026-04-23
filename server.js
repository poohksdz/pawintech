const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const cors = require("cors"); //  CORS เธ•เนเธญเธเธกเธฒเธเนเธญเธ
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const xss = require("xss-clean");

//  Load Config
dotenv.config();
const validateEnv = require("./utils/envValidator.js");
validateEnv();

//  Connect Database (SQL)
require("./config/db.js");
const { pool } = require("./config/db.js");

const { notFound, errorHandler } = require("./middleware/errorMiddleware.js");
const { seedDatabase } = require("./utils/seeder.js");

//  Auto-seed database in development mode
if (process.env.NODE_ENV === "development") {
  seedDatabase().catch((err) => console.error("Seeder failed:", err));
}

//  Star Rating Auto-Reset Job
const initStarResetCron = require("./utils/starResetCron.js");
initStarResetCron();

// =========================================================
//  IMPORT ROUTES
// =========================================================
const productRoutes = require("./routes/productRoutes.js");
const serviceRoutes = require("./routes/serviceRoutes.js");
const orderpcbRoutes = require("./routes/orderpcbRoutes.js");
const folioRoutes = require("./routes/folioRoutes.js");
const categoryRoutes = require("./routes/categoryRoutes.js");
const userRoutes = require("./routes/userRoutes.js");
const orderRoutes = require("./routes/orderRoutes.js");
const uploadRoutes = require("./routes/uploadRoutes.js");
const showcaseRoutes = require("./routes/showcaseRoutes.js");
const blogRoutes = require("./routes/blogRoutes.js");
const aboutRoutes = require("./routes/aboutRoutes.js");
const aboutImageRoutes = require("./routes/aboutImageRoutes.js");
const emailRoutes = require("./routes/emailRoutes.js");
const invoiceRoutes = require("./routes/invoiceRoutes.js");
const vatDefaultRouters = require("./routes/vatDefaultRouters.js");
const uploadDefaultInvoiceLogoRoutes = require("./routes/uploadDefaultInvoiceLogoRoutes.js");
const quotationRoutes = require("./routes/quotationRoutes.js");
const quotationDefaultRoutes = require("./routes/quotationDefaultRoutes.js");
const customerRoutes = require("./routes/customerRoutes.js");
const gerberRoutes = require("./routes/gerberRoutes.js");
const notificationRoutes = require("./routes/notificationRoutes.js");
const signatureRoutes = require("./routes/signatureRoutes.js");

// Payment Routes
const paymentRoutes = require("./routes/paymentRoutes.js");

// Cart Routes
const cartRoutes = require("./routes/cartRoutes.js");

// Stock System Routes
const stockProductRoutes = require("./routes/stockProductRoutes.js");
const stockCategoryRoutes = require("./routes/stockCategoryRoutes.js");
const stockSubcategoryRoutes = require("./routes/stockSubcategoryRoutes.js");
const stockFootprintRoutes = require("./routes/stockFootprintRoutes.js");
const stockManufactureRoutes = require("./routes/stockManufactureRoutes.js");
const stockSupplierRoutes = require("./routes/stockSupplierRoutes.js");
const stockRequestRoutes = require("./routes/stockRequestRoutes.js");
const stockIssueRoutes = require("./routes/stockIssueRoutes.js");
const stockReceiveRoutes = require("./routes/stockReceiveRoutes.js");

// PCB Systems Routes
const copypcbRoutes = require("./routes/copypcbRoutes.js");
const copypcbCartRoutes = require("./routes/copypcbCartRoutes.js");

const custompcbRoutes = require("./routes/custompcbRoutes.js");
const custompcbCartRoutes = require("./routes/custompcbCartRoutes.js");
const assemblypcbRoutes = require("./routes/assemblypcbRoutes.js");
const assemblypcbCartRoutes = require("./routes/assemblypcbCartRoutes.js");

const port = process.env.PORT || 5000;

const app = express();

//  FIX: Proxy Trust (เธชเธณเธเธฑเธเธชเธณเธซเธฃเธฑเธ Heroku/Cloud เธซเธฃเธทเธญเธเธฒเธฃเธ—เธณเธเธฒเธเธซเธฅเธฑเธ Nginx)
app.set("trust proxy", 1);

// =========================================================
// ๏ธ CORS SECTION (เนเธเนเธเธฑเธเธซเธฒ Blocked Origin เธ•เธฃเธเธเธตเน)
// =========================================================
const allowedOrigins = (process.env.CLIENT_URL || "").split(",").filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // เธญเธเธธเธเธฒเธ• requests เธ—เธตเนเนเธกเนเธกเธต origin (เน€เธเนเธ mobile apps, curl) เธซเธฃเธทเธญ localhost เธ—เธฑเนเธเธซเธกเธ”
      if (!origin || allowedOrigins.includes(origin) || origin.startsWith("http://localhost") || origin.startsWith("http://127.0.0.1")) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS: " + origin));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  }),
);

// =========================================================
// ๏ธ SECURITY & PARSERS
// =========================================================

// Body Parser (เธขเนเธฒเธขเธกเธฒเนเธงเนเธ•เธฃเธเธเธตเนเน€เธเธทเนเธญเนเธซเนเธฃเธฑเธ JSON เนเธ”เนเธเนเธญเธเธเธฐเนเธ”เธ Security เธญเธทเนเธเน เธเธงเธ)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

// Helmet (Security Headers)
const helmetConfig = {
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
  referrerPolicy: { policy: "same-origin" },
};

// HSTS เธ•เนเธญเธเน€เธเธดเธ”เน€เธเธเธฒเธฐ production เน€เธ—เนเธฒเธเธฑเนเธ
if (process.env.NODE_ENV === "production") {
  helmetConfig.hsts = { maxAge: 31536000, includeSubDomains: true, preload: true };
}

app.use(helmet(helmetConfig));

app.use(xss());
app.use(hpp());

// Rate Limiting (เธเธณเธเธฑเธ”เธเธฒเธฃเธขเธดเธ Request เธ–เธตเนเน)
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: process.env.NODE_ENV === "development" ? 500 : 500, //  เน€เธเธดเนเธก Limit เนเธเนเธซเธกเธ” Dev
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api", limiter);

// Stricter Rate Limit for Login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: process.env.NODE_ENV === "development" ? 100 : 20, //  เน€เธเธดเนเธก Limit เนเธเนเธซเธกเธ” Dev
  message: "Too many login attempts, please try again after 15 minutes",
});
// Rate limiting specifically for register
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "development" ? 100 : 10,
  message: "Too many registration attempts, please try again after 15 minutes",
});

// Rate limiting specifically for reset password
const resetLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "development" ? 50 : 5, //  เน€เธเธดเนเธก Limit เนเธเนเธซเธกเธ” Dev
  message: "เธกเธตเธเธฒเธฃเธชเนเธเธเธณเธเธญเธกเธฒเธเน€เธเธดเธเนเธ เธเธฃเธธเธ“เธฒเธฅเธญเธเนเธซเธกเนเนเธเธญเธตเธ 15 เธเธฒเธ—เธต",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/users/login", loginLimiter);
app.use("/api/users/register", registerLimiter);
app.use("/api/users/request-reset", resetLimit);

// =========================================================
//  STATIC FILES & MALFORMED REQUEST FILTER
// =========================================================
const rootPath = path.resolve();

// 1. Filter out known malformed requests to prevent noisy server logs
app.use((req, res, next) => {
  if (
    req.url.includes("[object%20Object]") ||
    req.url.includes("[object Object]")
  ) {
    return res.status(400).json({ message: "Malformed URL request blocked" });
  }
  next();
});

const staticFolders = [
  "uploads",
  "images",
  "serviceImages",
  "showcaseImages",
  "blogImages",
  "folios",
  "copypcps",
  "componentImages",
  "paymentSlipImages",
  "aboutImages",
  "datasheets",
  "manuals",
  "quotationimages",
  "defaultquotationimages",
  "copypcbImages",
  "copypcbZipFiles",
  "custompcbImages",
  "custompcbZipFiles",
  "assemblypcbImages",
  "assemblypcbZipFiles",
  "gerbers",
];

// Serve static folders with specific prefixes (Recommended)
staticFolders.forEach((folder) => {
  app.use(`/${folder}`, express.static(path.join(rootPath, folder)));
});

// All static folders are served with their respective prefixes above.
// But for legacy compatibility (where DB paths might lack prefixes), 
// we also serve them at the root level.
app.use(express.static(path.join(rootPath, "uploads")));
app.use(express.static(path.join(rootPath, "componentImages"))); // Fallback for component images stored as /images/xxx.jpg in DB
app.use(express.static(path.join(rootPath, "custompcbImages")));
app.use(express.static(path.join(rootPath, "custompcbZipFiles")));
app.use(express.static(path.join(rootPath, "assemblypcbImages")));
app.use(express.static(path.join(rootPath, "assemblypcbZipFiles")));
app.use(express.static(path.join(rootPath, "copypcbImages")));
app.use(express.static(path.join(rootPath, "copypcbZipFiles")));

// No fallback at root "/" to prevent shadowing API routes and ensure security.

// Health Check Endpoint (For Cloud Load Balancers)
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.use("/api/gerber", gerberRoutes);
app.use("/api/products", productRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/orderpcbs", orderpcbRoutes);
app.use("/api/folios", folioRoutes);
app.use("/api/categorys", categoryRoutes);
app.use("/api/users", userRoutes);
app.use("/api/customers", customerRoutes);

// Cart Routes
app.use("/api/cart", cartRoutes);

app.use("/api/quotations", quotationRoutes);
app.use("/api/quotations/upload", require("./routes/uploadQuotationRoutes"));
app.use("/api/defaultquotations", quotationDefaultRoutes);
app.use(
  "/api/defaultquotations/upload",
  require("./routes/uploadQuotationDefaultRoutes"),
);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/defaultinvoices", vatDefaultRouters);
app.use("/api/defaultInvoiceImages", uploadDefaultInvoiceLogoRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api", uploadRoutes);
app.use("/api/showcases", showcaseRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/abouts", aboutRoutes);
app.use("/api/aboutimages", aboutImageRoutes);
app.use("/api/emails", emailRoutes);
app.use("/api/notifications", notificationRoutes);

// Signature Routes
app.use("/api/signatures", signatureRoutes);

// Payment Routes
app.use("/api/payments", paymentRoutes);

// Payment Slip Upload Route
app.use("/api/paymentSlipImages", require("./routes/paymentSlipRoutes"));

// Stock Routes
app.use("/api/stockproducts", stockProductRoutes);
app.use("/api/stockcategories", stockCategoryRoutes);
app.use("/api/stocksubcategories", stockSubcategoryRoutes);
app.use("/api/stockfootprints", stockFootprintRoutes);
app.use("/api/stockmanufactures", stockManufactureRoutes);
app.use("/api/stocksuppliers", stockSupplierRoutes);
app.use("/api/stockrequests", stockRequestRoutes);
app.use("/api/stockissues", stockIssueRoutes);
app.use("/api/stockreceives", stockReceiveRoutes);

// PCB Routes
app.use("/api/copypcbs", copypcbRoutes);
app.use("/api/copypcbs/upload", require("./routes/uploadCopyPCBRoutes")); //  Added
app.use("/api/copycartpcbs", copypcbCartRoutes);
app.use("/api/copycartpcbs/upload", require("./routes/uploadCopyPCBRoutes")); //  Added

app.use("/api/custompcbs", custompcbRoutes);
app.use("/api/custompcbs/upload", require("./routes/uploadCustomPCBRoutes")); //  Added
app.use("/api/customcartpcbs", custompcbCartRoutes);
app.use(
  "/api/customcartpcbs/upload",
  require("./routes/uploadCustomPCBRoutes"),
);

const orderpcbCartRoutes = require("./routes/orderPCBCartRoutes");
app.use("/api/orderpcbcarts", orderpcbCartRoutes);

app.use("/api/assemblypcbs", assemblypcbRoutes);
app.use(
  "/api/assemblypcbs/upload",
  require("./routes/uploadAssemblyPCBRoutes.js"),
); //  Added
app.use("/api/assemblycartpcbs", assemblypcbCartRoutes);
app.use(
  "/api/assemblycartpcbs/upload",
  require("./routes/uploadAssemblyPCBRoutes.js"),
);

// Production / Frontend Build
if (process.env.NODE_ENV === "production") {
  //  เนเธเน rootPath เนเธ—เธ __dirname เธเนเธญเธเธเธฑเธ Error Syntax เนเธเธเธฒเธเนเธซเธกเธ”
  app.use(express.static(path.join(rootPath, "frontend/build")));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(rootPath, "frontend", "build", "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send("API is running securely (SQL Mode)....");
  });
}

// Error Handling
app.use(notFound);
app.use(errorHandler);

const server = app.listen(port, () =>
  console.log(
    `โ… Server running in ${process.env.NODE_ENV} mode on port ${port} (SQL Mode)`,
  ),
);

// =========================================================
// ๏ธ GRACEFUL SHUTDOWN (For Cloud Environments)
// =========================================================
process.on("SIGTERM", async () => {
  console.log("๐‘ SIGTERM received. Shutting down gracefully...");
  server.close(async () => {
    console.log("โ” HTTP server closed.");
    try {
      await pool.end();
      console.log("โ” Database pool closed.");
      process.exit(0);
    } catch (err) {
      console.error("โ Error during database pool shutdown:", err);
      process.exit(1);
    }
  });
});

process.on("SIGINT", async () => {
  console.log("๐‘ SIGINT received. Shutting down gracefully...");
  server.close(async () => {
    try {
      await pool.end();
      process.exit(0);
    } catch (err) {
      process.exit(1);
    }
  });
});
