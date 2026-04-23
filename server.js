const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = 5000;
const DATA_DIR = path.join(__dirname, "data");
const STORE_FILE = path.join(DATA_DIR, "store.json");
const PUBLIC_DIR = path.join(__dirname, "..");
const sessions = new Map();

const hashPassword = (password) => crypto.createHash("sha256").update(password).digest("hex");
const clone = (value) => JSON.parse(JSON.stringify(value));

const ensureStore = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
};

const readStore = () => JSON.parse(fs.readFileSync(STORE_FILE, "utf8"));
const saveStore = (store) => fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2));

const sanitizeEmployee = (employee) => {
  const clean = clone(employee);
  delete clean.passwordHash;
  return clean;
};

const createSession = (empId, role) => {
  const token = crypto.randomUUID();
  sessions.set(token, { empId, role });
  return token;
};

const authMiddleware = (roles = []) => (req, res, next) => {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  const session = sessions.get(token);

  if (!session) {
    return res.status(401).json({ success: false, message: "Unauthorized request." });
  }

  if (roles.length && !roles.includes(session.role)) {
    return res.status(403).json({ success: false, message: "You do not have access." });
  }

  req.session = session;
  req.token = token;
  next();
};

ensureStore();

app.use(cors());
app.use(express.json());
app.use(express.static(PUBLIC_DIR));

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Employee dashboard API is running." });
});

app.post("/api/login", (req, res) => {
  const { role = "employee", empId, password } = req.body || {};

  if (!empId || !password) {
    return res.status(400).json({ success: false, message: "Employee ID and password are required." });
  }

  const store = readStore();
  const source = role === "admin" ? store.admins : store.employees;
  const account = source.find((item) => item.empId === empId);

  if (!account || account.passwordHash !== hashPassword(password)) {
    return res.status(401).json({ success: false, message: "Invalid credentials." });
  }

  const token = createSession(account.empId, role);
  res.json({ success: true, token, role, empId: account.empId, name: account.name });
});

app.post("/api/logout", authMiddleware(["employee", "admin"]), (req, res) => {
  sessions.delete(req.token);
  res.json({ success: true });
});

app.get("/api/dashboard", authMiddleware(["employee"]), (req, res) => {
  const store = readStore();
  const employee = store.employees.find((item) => item.empId === req.session.empId);

  if (!employee) {
    return res.status(404).json({ success: false, message: "Employee not found." });
  }

  res.json({
    success: true,
    employee: sanitizeEmployee(employee),
    shared: clone(store.shared)
  });
});

app.get("/api/admin/employees", authMiddleware(["admin"]), (req, res) => {
  const store = readStore();
  res.json({ success: true, employees: store.employees.map(sanitizeEmployee) });
});

app.post("/api/admin/employees", authMiddleware(["admin"]), (req, res) => {
  const {
    empId,
    password,
    name,
    designation,
    department,
    email,
    phone,
    joiningDate,
    bloodGroup,
    dob,
    gender,
    employmentType,
    location,
    manager,
    salary,
    leaveBalance,
    presentDays,
    lateDays,
    bankName,
    accountNumber,
    ifsc,
    pan,
    aadhaar,
    emergencyContactName,
    emergencyContactPhone,
    address,
    notes
  } = req.body || {};

  if (!empId || !password || !name) {
    return res.status(400).json({ success: false, message: "Employee ID, password, and name are required." });
  }

  const store = readStore();
  if (store.employees.some((item) => item.empId === empId)) {
    return res.status(409).json({ success: false, message: "Employee ID already exists." });
  }

  const salaryValue = Number(salary) || 0;

  store.employees.push({
    empId,
    name,
    designation: designation || "Employee",
    department: department || "General",
    email: email || "",
    phone: phone || "",
    joiningDate: joiningDate || "",
    bloodGroup: bloodGroup || "",
    dob: dob || "",
    gender: gender || "Not specified",
    employmentType: employmentType || "Full Time",
    location: location || "",
    manager: manager || "",
    bankName: bankName || "",
    accountNumber: accountNumber || "",
    ifsc: ifsc || "",
    pan: pan || "",
    aadhaar: aadhaar || "",
    emergencyContactName: emergencyContactName || "",
    emergencyContactPhone: emergencyContactPhone || "",
    address: address || "",
    notes: notes || "",
    passwordHash: hashPassword(password),
    attendance: {
      workingDays: 26,
      presentDays: Number(presentDays) || 0,
      lateDays: Number(lateDays) || 0,
      leaveDays: Number(leaveBalance) || 0,
      records: []
    },
    salarySlips: [
      { month: "March 2026", netSalary: salaryValue, status: "Pending" },
      { month: "February 2026", netSalary: salaryValue, status: "Pending" },
      { month: "January 2026", netSalary: salaryValue, status: "Pending" }
    ],
    certificates: [],
    dailyUpdates: [
      { text: "Complete onboarding checklist", done: false },
      { text: "Read employee handbook", done: false }
    ]
  });

  saveStore(store);
  res.status(201).json({ success: true, message: "Employee created successfully." });
});

app.put("/api/admin/employees/:empId", authMiddleware(["admin"]), (req, res) => {
  const { empId } = req.params;
  const {
    attendance = {},
    latestSalary,
    password,
    name,
    designation,
    department,
    email,
    phone,
    joiningDate,
    bloodGroup,
    dob,
    gender,
    employmentType,
    location,
    manager,
    salary,
    leaveBalance,
    presentDays,
    lateDays,
    bankName,
    accountNumber,
    ifsc,
    pan,
    aadhaar,
    emergencyContactName,
    emergencyContactPhone,
    address,
    notes
  } = req.body || {};
  const store = readStore();
  const employee = store.employees.find((item) => item.empId === empId);

  if (!employee) {
    return res.status(404).json({ success: false, message: "Employee not found." });
  }

  if (name !== undefined) employee.name = name;
  if (designation !== undefined) employee.designation = designation;
  if (department !== undefined) employee.department = department;
  if (email !== undefined) employee.email = email;
  if (phone !== undefined) employee.phone = phone;
  if (joiningDate !== undefined) employee.joiningDate = joiningDate;
  if (bloodGroup !== undefined) employee.bloodGroup = bloodGroup;
  if (dob !== undefined) employee.dob = dob;
  if (gender !== undefined) employee.gender = gender;
  if (employmentType !== undefined) employee.employmentType = employmentType;
  if (location !== undefined) employee.location = location;
  if (manager !== undefined) employee.manager = manager;
  if (bankName !== undefined) employee.bankName = bankName;
  if (accountNumber !== undefined) employee.accountNumber = accountNumber;
  if (ifsc !== undefined) employee.ifsc = ifsc;
  if (pan !== undefined) employee.pan = pan;
  if (aadhaar !== undefined) employee.aadhaar = aadhaar;
  if (emergencyContactName !== undefined) employee.emergencyContactName = emergencyContactName;
  if (emergencyContactPhone !== undefined) employee.emergencyContactPhone = emergencyContactPhone;
  if (address !== undefined) employee.address = address;
  if (notes !== undefined) employee.notes = notes;
  if (password) employee.passwordHash = hashPassword(password);

  employee.attendance.presentDays = Number(attendance.presentDays ?? presentDays ?? employee.attendance.presentDays);
  employee.attendance.lateDays = Number(attendance.lateDays ?? lateDays ?? employee.attendance.lateDays);
  employee.attendance.leaveDays = Number(attendance.leaveDays ?? leaveBalance ?? employee.attendance.leaveDays);

  const resolvedSalary = latestSalary ?? salary;
  if (resolvedSalary !== undefined && employee.salarySlips.length) {
    employee.salarySlips[0].netSalary = Number(resolvedSalary);
  }

  saveStore(store);
  res.json({ success: true, message: "Employee updated successfully." });
});

app.use((req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Employee dashboard server running at http://localhost:${PORT}`);
});
