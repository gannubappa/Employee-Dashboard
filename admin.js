const adminApi = "http://localhost:5000/api";
const adminAuth = JSON.parse(localStorage.getItem("employeePortalAuth") || "null");

const adminById = (id) => document.getElementById(id);
const adminHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${adminAuth?.token || ""}`
});

const viewButtons = () => Array.from(document.querySelectorAll("[data-admin-view]"));
const fieldSections = {
  "employee-form": "basicFields",
  "bank-details": "bankFields",
  "more-info": "moreInfoFields"
};

const resetAdminSession = (message = "") => {
  localStorage.removeItem("employeePortalAuth");
  adminById("adminWorkspace").classList.add("hidden");
  adminById("adminLoginPanel").classList.remove("hidden");
  if (message) {
    adminById("adminLoginMessage").textContent = message;
  }
};

const renderAdminState = () => {
  const isLoggedIn = Boolean(adminAuth?.token && adminAuth?.role === "admin");
  adminById("adminLoginPanel").classList.toggle("hidden", isLoggedIn);
  adminById("adminWorkspace").classList.toggle("hidden", !isLoggedIn);

  if (isLoggedIn) {
    adminById("adminHeading").textContent = `Welcome, ${adminAuth.name || adminAuth.empId}`;
  }
};

const switchView = async (view) => {
  viewButtons().forEach((button) => {
    button.classList.toggle("active", button.dataset.adminView === view);
  });

  adminById("employeeFormView").classList.toggle("hidden", view === "employee-list");
  adminById("employeeListView").classList.toggle("hidden", view !== "employee-list");

  Object.entries(fieldSections).forEach(([key, id]) => {
    adminById(id).classList.toggle("hidden", key !== view);
  });

  if (view === "employee-list") {
    await loadEmployees();
  }
};

const setCreateMode = () => {
  adminById("employeeFormEyebrow").textContent = "Create Employee";
  adminById("employeeFormHeading").textContent = "Mandatory employee details";
  adminById("employeeSubmitButton").textContent = "Save Employee";
  adminById("employeeCancelEditButton").classList.add("hidden");
  adminById("employeeId").readOnly = false;
  adminById("employeePassword").required = true;
  adminById("employeePassword").placeholder = "Create password";
  adminById("employeeFormMessage").textContent = "";
};

const resetEmployeeForm = () => {
  adminById("employeeForm").reset();
  adminById("employeeOriginalId").value = "";
  adminById("employeeEmploymentType").value = "Full Time";
  adminById("employeeLeaveBalance").value = 12;
  adminById("employeePresentDays").value = 0;
  adminById("employeeLateDays").value = 0;
  setCreateMode();
  switchView("employee-form");
};

const fillEmployeeForm = (employee) => {
  adminById("employeeOriginalId").value = employee.empId || "";
  adminById("employeeId").value = employee.empId || "";
  adminById("employeePassword").value = "";
  adminById("employeeName").value = employee.name || "";
  adminById("employeeEmail").value = employee.email || "";
  adminById("employeePhone").value = employee.phone || "";
  adminById("employeeJoiningDate").value = employee.joiningDate || "";
  adminById("employeeBloodGroup").value = employee.bloodGroup || "";
  adminById("employeeGender").value = employee.gender || "";
  adminById("employeeBankName").value = employee.bankName || "";
  adminById("employeeAccountNumber").value = employee.accountNumber || "";
  adminById("employeeIfsc").value = employee.ifsc || "";
  adminById("employeeDesignation").value = employee.designation || "";
  adminById("employeeDepartment").value = employee.department || "";
  adminById("employeeDob").value = employee.dob || "";
  adminById("employeeEmploymentType").value = employee.employmentType || "Full Time";
  adminById("employeeLocation").value = employee.location || "";
  adminById("employeeManager").value = employee.manager || "";
  adminById("employeeSalary").value = employee.salarySlips?.[0]?.netSalary || 0;
  adminById("employeeLeaveBalance").value = employee.attendance?.leaveDays || 0;
  adminById("employeePresentDays").value = employee.attendance?.presentDays || 0;
  adminById("employeeLateDays").value = employee.attendance?.lateDays || 0;
  adminById("employeePan").value = employee.pan || "";
  adminById("employeeAadhaar").value = employee.aadhaar || "";
  adminById("employeeEmergencyName").value = employee.emergencyContactName || "";
  adminById("employeeEmergencyPhone").value = employee.emergencyContactPhone || "";
  adminById("employeeAddress").value = employee.address || "";
  adminById("employeeNotes").value = employee.notes || "";

  adminById("employeeFormEyebrow").textContent = "Edit Employee";
  adminById("employeeFormHeading").textContent = `Update details for ${employee.name}`;
  adminById("employeeSubmitButton").textContent = "Update Employee";
  adminById("employeeCancelEditButton").classList.remove("hidden");
  adminById("employeeId").readOnly = true;
  adminById("employeePassword").required = false;
  adminById("employeePassword").placeholder = "Leave blank to keep current password";
  adminById("employeeFormMessage").textContent = "";
  switchView("employee-form");
  adminById("employeeForm").scrollIntoView({ behavior: "smooth", block: "start" });
};

const renderEmployeeCard = (employee) => `
  <article class="employee-card">
    <h4>${employee.name}</h4>
    <p class="employee-meta">${employee.empId} • ${employee.designation || "Employee"}</p>
    <p>${employee.email || "-"}</p>
    <p>${employee.phone || "-"}</p>
    <p>Joining: ${employee.joiningDate || "-"}</p>
    <p>Blood Group: ${employee.bloodGroup || "-"}</p>
    <p>Gender: ${employee.gender || "-"}</p>
    <div class="mini-actions">
      <button type="button" class="ghost edit-user-button" data-emp-id="${employee.empId}">Edit User</button>
    </div>
  </article>
`;

const loadEmployees = async () => {
  const cards = adminById("employeeCards");
  cards.innerHTML = '<p class="empty-state">Loading employees...</p>';

  try {
    const response = await fetch(`${adminApi}/admin/employees`, { headers: adminHeaders() });
    const payload = await response.json();

    if (response.status === 401 || response.status === 403) {
      resetAdminSession("Session expired. Please login again.");
      cards.innerHTML = '<p class="empty-state">Please login again to view employee records.</p>';
      return;
    }

    if (!response.ok) {
      throw new Error(payload.message || "Unable to load employees.");
    }

    cards.innerHTML = payload.employees.length
      ? payload.employees.map(renderEmployeeCard).join("")
      : '<p class="empty-state">No employees found.</p>';

    document.querySelectorAll(".edit-user-button").forEach((button) => {
      button.addEventListener("click", () => {
        const employee = payload.employees.find((item) => item.empId === button.dataset.empId);
        if (employee) {
          fillEmployeeForm(employee);
        }
      });
    });
  } catch (error) {
    cards.innerHTML = `<p class="empty-state">${error.message}</p>`;
  }
};

const createOrUpdateEmployee = async (event) => {
  event.preventDefault();
  const message = adminById("employeeFormMessage");
  const originalId = adminById("employeeOriginalId").value.trim();
  const isEditMode = Boolean(originalId);

  const body = {
    empId: adminById("employeeId").value.trim(),
    password: adminById("employeePassword").value,
    name: adminById("employeeName").value.trim(),
    email: adminById("employeeEmail").value.trim(),
    phone: adminById("employeePhone").value.trim(),
    joiningDate: adminById("employeeJoiningDate").value,
    bloodGroup: adminById("employeeBloodGroup").value.trim(),
    gender: adminById("employeeGender").value,
    bankName: adminById("employeeBankName").value.trim(),
    accountNumber: adminById("employeeAccountNumber").value.trim(),
    ifsc: adminById("employeeIfsc").value.trim(),
    designation: adminById("employeeDesignation").value.trim(),
    department: adminById("employeeDepartment").value.trim(),
    dob: adminById("employeeDob").value,
    employmentType: adminById("employeeEmploymentType").value,
    location: adminById("employeeLocation").value.trim(),
    manager: adminById("employeeManager").value.trim(),
    salary: Number(adminById("employeeSalary").value || 0),
    leaveBalance: Number(adminById("employeeLeaveBalance").value || 0),
    presentDays: Number(adminById("employeePresentDays").value || 0),
    lateDays: Number(adminById("employeeLateDays").value || 0),
    pan: adminById("employeePan").value.trim(),
    aadhaar: adminById("employeeAadhaar").value.trim(),
    emergencyContactName: adminById("employeeEmergencyName").value.trim(),
    emergencyContactPhone: adminById("employeeEmergencyPhone").value.trim(),
    address: adminById("employeeAddress").value.trim(),
    notes: adminById("employeeNotes").value.trim()
  };

  message.textContent = isEditMode ? "Updating employee..." : "Saving employee...";

  try {
    const response = await fetch(
      isEditMode ? `${adminApi}/admin/employees/${encodeURIComponent(originalId)}` : `${adminApi}/admin/employees`,
      {
        method: isEditMode ? "PUT" : "POST",
        headers: adminHeaders(),
        body: JSON.stringify(body)
      }
    );
    const payload = await response.json();

    if (response.status === 401 || response.status === 403) {
      resetAdminSession("Session expired. Please login again.");
      message.textContent = "Please login again.";
      return;
    }

    if (!response.ok) {
      throw new Error(payload.message || `Unable to ${isEditMode ? "update" : "add"} employee.`);
    }

    resetEmployeeForm();
    message.textContent = isEditMode ? "Employee updated successfully." : "Employee added successfully.";
  } catch (error) {
    message.textContent = error.message;
  }
};

adminById("adminLoginForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = adminById("adminLoginMessage");
  message.textContent = "Checking credentials...";

  try {
    const response = await fetch(`${adminApi}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: "admin",
        empId: adminById("adminId").value.trim(),
        password: adminById("adminPassword").value
      })
    });
    const payload = await response.json();

    if (!response.ok || !payload.success) {
      message.textContent = payload.message || "Invalid admin login.";
      return;
    }

    localStorage.setItem("employeePortalAuth", JSON.stringify(payload));
    window.location.reload();
  } catch (error) {
    message.textContent = "Server not running. Start backend on port 5000.";
  }
});

viewButtons().forEach((button) => {
  button.addEventListener("click", () => {
    switchView(button.dataset.adminView);
  });
});

adminById("employeeForm")?.addEventListener("submit", createOrUpdateEmployee);
adminById("employeeCancelEditButton")?.addEventListener("click", resetEmployeeForm);
adminById("refreshEmployeesButton")?.addEventListener("click", loadEmployees);
adminById("adminLogoutButton")?.addEventListener("click", async () => {
  try {
    await fetch(`${adminApi}/logout`, { method: "POST", headers: adminHeaders() });
  } catch (error) {
    // Ignore logout errors.
  }
  localStorage.removeItem("employeePortalAuth");
  window.location.reload();
});

renderAdminState();
resetEmployeeForm();
if (adminAuth?.role === "admin") {
  switchView("employee-form");
}
