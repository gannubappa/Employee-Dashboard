const dashboardAuth = JSON.parse(localStorage.getItem("employeePortalAuth") || "null");
const dashboardApi = "http://localhost:5000/api";

if (!dashboardAuth || dashboardAuth.role !== "employee" || !dashboardAuth.token) {
  window.location.href = "index.html";
}

const byId = (id) => document.getElementById(id);
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${dashboardAuth.token}`
});

const initialsFromName = (name) => name
  .split(" ")
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0]?.toUpperCase() || "")
  .join("");

const currency = (value) => `Rs. ${Number(value).toLocaleString("en-IN")}`;

const renderAttendance = (records = []) => {
  byId("attendanceTable").innerHTML = [
    '<div class="table-row table-head"><span>Date</span><span>Check In</span><span>Status</span></div>',
    ...records.map((record) => `
      <div class="table-row">
        <span>${record.date}</span>
        <span>${record.checkIn}</span>
        <span class="status-chip ${record.status === "Late" ? "late-chip" : ""}">${record.status}</span>
      </div>
    `)
  ].join("");
};

const renderList = (targetId, items, template, emptyMessage) => {
  byId(targetId).innerHTML = items.length ? items.map(template).join("") : `<p class="empty-state">${emptyMessage}</p>`;
};

const loadDashboard = async () => {
  try {
    const response = await fetch(`${dashboardApi}/dashboard`, { headers: authHeaders() });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.message || "Unable to load dashboard.");
    }

    const { employee, shared } = payload;
    const attendanceRate = employee.attendance.workingDays
      ? Math.round((employee.attendance.presentDays / employee.attendance.workingDays) * 100)
      : 0;

    byId("avatar").textContent = initialsFromName(employee.name);
    byId("sidebarName").textContent = employee.name;
    byId("sidebarRole").textContent = employee.designation;
    byId("welcomeHeading").textContent = `Welcome back, ${employee.name}`;
    byId("employeeMeta").textContent = `${employee.designation} • ${employee.department} • ${employee.email}`;
    byId("attendanceCount").textContent = `${employee.attendance.presentDays} / ${employee.attendance.workingDays} Days`;
    byId("attendanceRate").textContent = `${attendanceRate}% present rate`;
    byId("lateCount").textContent = `${employee.attendance.lateDays} Days`;
    byId("lateTrend").textContent = `${employee.attendance.leaveDays} leave days this month`;
    byId("certificateCount").textContent = `${employee.certificates.length} Earned`;
    byId("certificateNote").textContent = employee.certificates[0]?.title || "Recognition history";
    byId("noticeCount").textContent = `${shared.notices.length} Updates`;
    byId("noticeNote").textContent = "Latest company communication";
    byId("presentDays").textContent = `${employee.attendance.presentDays} Days`;
    byId("lateDays").textContent = `${employee.attendance.lateDays} Days`;
    byId("presentBar").style.width = `${attendanceRate}%`;
    byId("lateBar").style.width = `${Math.min(100, employee.attendance.lateDays * 10)}%`;

    renderAttendance(employee.attendance.records);
    renderList("salaryList", employee.salarySlips, (item) => `
      <li>
        <div>
          <strong>${item.month}</strong>
          <p>Net Salary: ${currency(item.netSalary)}</p>
        </div>
        <span class="pill">${item.status}</span>
      </li>
    `, "No salary slips available.");
    renderList("certificateList", employee.certificates, (item) => `
      <div class="certificate-card">
        <h4>${item.title}</h4>
        <p>${item.description}</p>
        <p class="employee-meta">Awarded on ${item.issuedOn}</p>
      </div>
    `, "No certificates available.");
    renderList("noticeList", shared.notices, (item) => `
      <li>
        <strong>${item.title}</strong>
        <p>${item.message}</p>
        <p class="employee-meta">Published on ${item.date}</p>
      </li>
    `, "No notices available.");
    renderList("taskList", employee.dailyUpdates, (item) => `
      <li class="${item.done ? "completed" : ""}">
        <input type="checkbox" ${item.done ? "checked" : ""} disabled>
        <span>${item.text}</span>
      </li>
    `, "No tasks available.");
    renderList("studyList", shared.studyMaterials, (item) => `
      <li>
        <div>
          <strong>${item.title}</strong>
          <p>${item.description}</p>
        </div>
        <span class="pill">${item.type}</span>
      </li>
    `, "No study material available.");
  } catch (error) {
    alert(error.message || "Unable to load dashboard. Please login again.");
    localStorage.removeItem("employeePortalAuth");
    window.location.href = "index.html";
  }
};

byId("refreshButton")?.addEventListener("click", loadDashboard);
byId("logoutButton")?.addEventListener("click", async () => {
  try {
    await fetch(`${dashboardApi}/logout`, { method: "POST", headers: authHeaders() });
  } catch (error) {
    // Ignore logout errors.
  }
  localStorage.removeItem("employeePortalAuth");
  window.location.href = "index.html";
});

loadDashboard();
