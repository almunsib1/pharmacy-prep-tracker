const API_URL = "https://script.google.com/macros/s/AKfycbw0jSrbe1SM596Kyv0EpB6VTKEXT81c2Cn8Wlc2lEQ_RzbrS9b6w-k4gyrflwPBTgpKSQ/exec";

const els = {
  dateBox: document.getElementById("dateBox"),
  userForm: document.getElementById("userForm"),
  nameInput: document.getElementById("nameInput"),
  usernameInput: document.getElementById("usernameInput"),
  pinInput: document.getElementById("pinInput"),
  usersBody: document.getElementById("usersBody"),
  usersMessage: document.getElementById("usersMessage")
};

document.addEventListener("DOMContentLoaded", initUsers);

function initUsers() {
  renderDate();
  els.userForm.addEventListener("submit", addUser);
  loadUsers();
}

function renderDate() {
  const now = new Date();
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh" }).format(now);
  const dayName = new Intl.DateTimeFormat("ar-SA", {
    timeZone: "Asia/Riyadh",
    weekday: "long"
  }).format(now);

  els.dateBox.textContent = `${dayName} - ${date}`;
}

async function loadUsers() {
  setMessage("");
  try {
    const response = await api("listUsers");
    if (!response.ok) throw new Error(response.message || "تعذر تحميل المستخدمين.");
    renderUsers(response.users || []);
  } catch (error) {
    setMessage(error.message, "error");
  }
}

function renderUsers(users) {
  els.usersBody.innerHTML = "";

  if (!users.length) {
    const row = document.createElement("tr");
    row.innerHTML = `<td colspan="4" class="empty-cell">لا يوجد مستخدمون.</td>`;
    els.usersBody.appendChild(row);
    return;
  }

  users.forEach(user => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td data-label="اسم الموظف">${escapeHtml(user.name)}</td>
      <td data-label="اسم المستخدم">${escapeHtml(user.username)}</td>
      <td data-label="الحالة">${user.active ? "نشط" : "غير نشط"}</td>
      <td data-label="حذف">
        <button class="delete-user-btn" type="button" title="حذف" aria-label="حذف" data-username="${escapeHtml(user.username)}">×</button>
      </td>
    `;
    els.usersBody.appendChild(row);
  });

  els.usersBody.querySelectorAll(".delete-user-btn").forEach(button => {
    button.addEventListener("click", () => deleteUser(button.dataset.username));
  });
}

async function addUser(event) {
  event.preventDefault();

  const payload = {
    name: els.nameInput.value.trim(),
    username: els.usernameInput.value.trim(),
    pin: els.pinInput.value.trim()
  };

  setMessage("جاري إضافة المستخدم...");

  try {
    const response = await api("addUser", payload);
    if (!response.ok) throw new Error(response.message || "تعذر إضافة المستخدم.");
    els.userForm.reset();
    setMessage("تمت إضافة المستخدم.", "success");
    await loadUsers();
  } catch (error) {
    setMessage(error.message, "error");
  }
}

async function deleteUser(username) {
  const confirmed = window.confirm(`حذف المستخدم ${username}؟`);
  if (!confirmed) return;

  setMessage("جاري حذف المستخدم...");

  try {
    const response = await api("deleteUser", { username });
    if (!response.ok) throw new Error(response.message || "تعذر حذف المستخدم.");
    setMessage("تم حذف المستخدم.", "success");
    await loadUsers();
  } catch (error) {
    setMessage(error.message, "error");
  }
}

function setMessage(text, type = "") {
  els.usersMessage.textContent = text;
  els.usersMessage.className = `message ${type}`.trim();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function api(action, payload = {}) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, ...payload })
  });

  if (!response.ok) throw new Error("تعذر الاتصال بالخادم.");
  return response.json();
}
