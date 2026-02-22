const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const dotenv = require("dotenv");
const attachmentsApi = require("./routes/attachments");   // << เพิ่มบรรทัดนี้
// Swagger
const swaggerUi = require("swagger-ui-express");
const fs = require("fs");

dotenv.config();

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*' }));
// app.use(cors());
app.use(express.urlencoded({ extended: true }));  // ใส่คู่กับ express.json()
app.use(express.json());
// NOTE: removed app-level multer parsing to avoid double-parsing multipart streams
// Upload middleware (`./middlewares/upload`) is mocked in tests and is responsible
// for handling `req.file` and any needed parsing. Keeping a global multer() here
// caused `Unexpected end of form` when tests supply multipart requests.
app.use(morgan("dev"));
app.get('/oak',function(req,res){ 
  console.log("req=",req.query)
    res.send({
      status: 'Hello World oak!',
      data: req.query
      })
});
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/public", express.static(path.join(__dirname, "public")));

// Health
//http://localhost:7000/health
app.get("/health", (req, res) => {
  res.json({ service: "okoak", time: new Date().toISOString() });
});

// ให้ /openapi.json ส่งไฟล์จริงแบบ no-store เพื่อไม่ให้แคช
app.get("/openapi.json", (req, res) => {
  res.set("Cache-Control", "no-store");
  res.sendFile(path.join(__dirname, "openapi.json"));
});

// ให้ Swagger UI ไปดึงสเปกจาก URL ด้านบน (สดใหม่เสมอ)
app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(null, {
    swaggerOptions: { url: "/openapi.json" },
  })
);
const userRoutes = require("./routes/users.routes");
const authRoutes = require("./routes/auth.routes");
const uploadRoutes = require("./routes/upload.routes");

// Task routes (ตามโจทย์การแข่งขัน)
const task1Routes = require("./routes/task1.routes");
const task2Routes = require("./routes/task2.routes");
const task3Routes = require("./routes/task3.routes");
const task4Routes = require("./routes/task4.routes");
const task5Routes = require("./routes/task5.routes");

// CRUD routes
const topicsRoutes = require("./routes/topics.routes");
const indicatorsRoutes = require("./routes/indicators.routes");
const periodsRoutes = require("./routes/periods.routes");
const departmentsRoutes = require("./routes/departments.routes");
const assignmentsRoutes = require("./routes/assignments.routes");
const resultsRoutes = require("./routes/results.routes");

// http://localhost:7000/api/auth/login
// app.use('/api/auth', require('./routes/auth.routes'));
app.use("/api/auth", authRoutes);
// http://localhost:7000/api/users
app.use("/api/users", userRoutes);
// http://localhost:7000/api/upload
app.use("/api/upload", uploadRoutes);

// CRUD API routes (ต้องมาก่อน attachmentsApi)
app.use("/api/topics", topicsRoutes);
app.use("/api/indicators", indicatorsRoutes);
app.use("/api/periods", periodsRoutes);
app.use("/api/departments", departmentsRoutes);
app.use("/api/assignments", assignmentsRoutes);
app.use("/api/results", resultsRoutes);

// << เส้นทางสำหรับ Period/Indicator/EvidenceType และ POST /attachments (ต้องมาหลัง CRUD)
app.use("/api", attachmentsApi);           // จะได้ /api/periods/active, /api/attachments

// Task routes (Security & Business Logic)
app.use("/api/task1", task1Routes);  // IDOR Guard
app.use("/api/task2", task2Routes);  // Evidence Submit Rule  
app.use("/api/task3", task3Routes);  // Normalized /60
app.use("/api/task4", task4Routes);  // Unique Assignment
app.use("/api/task5", task5Routes);  // Progress by Department


app.use((req, res, next) => {
  res.status(404).json({ success: false, message: "ไม่พบหน้านี้" });
});

// Error handler
const error = require("./middlewares/error");
app.use(error);
// console.log(module);// Debug: log the module object to see its properties

module.exports = app;
