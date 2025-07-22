
const form = document.getElementById('expenseForm');
const table = document.getElementById('expensesTable').querySelector('tbody');

function saveExpenses(expenses) {
  localStorage.setItem('expenses', JSON.stringify(expenses));
}

function getExpenses() {
  return JSON.parse(localStorage.getItem('expenses')) || [];
}

function formatDateTime(date) {
  return date.toLocaleString('ar-EG', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function addExpenseToTable({ datetime, amount, note }) {
  const row = table.insertRow();
  row.innerHTML = `<td>${datetime}</td><td>${amount.toFixed(2)}</td><td>${note}</td>`;
}

function isSameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}

function updateDailyTotal(expenses) {
  const today = new Date();
  const totalToday = expenses.reduce((sum, exp) => {
    const expDate = new Date(exp.timestamp);
    return isSameDay(today, expDate) ? sum + exp.amount : sum;
  }, 0);

  document.getElementById('dailyTotal').textContent =
    `💰 إجمالي مصروفات اليوم: ${totalToday.toFixed(2)} ريال`;
}

function updateAllTimeTotal(expenses) {
  const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  document.getElementById('totalAllTime').textContent =
    `📊 إجمالي المصروفات الكلي: ${total.toFixed(2)} ريال`;
}

form.onsubmit = function (e) {
  e.preventDefault();
  const amount = parseFloat(document.getElementById('amount').value);
  const note = document.getElementById('note').value;
  const now = new Date();

  const datetime = formatDateTime(now);
  const expense = {
    datetime,
    timestamp: now.toISOString(),
    amount,
    note
  };

  const expenses = getExpenses();
  expenses.push(expense);
  saveExpenses(expenses);
  addExpenseToTable(expense);
  updateChart(expenses);
  updateDailyTotal(expenses);
  updateAllTimeTotal(expenses);

  form.reset();
};

window.onload = function () {
  const expenses = getExpenses();
  expenses.forEach(addExpenseToTable);
  updateChart(expenses);
  updateDailyTotal(expenses);
  updateAllTimeTotal(expenses);
};

function printExpenses() {
  const style = document.createElement('style');
  style.innerHTML = `
    body * { visibility: hidden; }
    .print-section, .print-section * { visibility: visible; }
    .print-section {
      position: absolute;
      top: 20px;
      left: 20px;
      width: 90%;
    }
  `;
  document.head.appendChild(style);
  window.print();
  document.head.removeChild(style);
}

function resetExpenses() {
  const confirmReset = confirm("هل أنت متأكد من تصفير جميع البيانات؟");
  if (confirmReset) {
    localStorage.removeItem('expenses');
    location.reload();
  }
}

let chart;

function updateChart(expenses) {
  const dailyTotals = {};

  expenses.forEach(exp => {
    const date = exp.datetime.split(",")[0];
    if (!dailyTotals[date]) dailyTotals[date] = 0;
    dailyTotals[date] += exp.amount;
  });

  const labels = Object.keys(dailyTotals);
  const data = Object.values(dailyTotals);

  const ctx = document.getElementById('expensesChart').getContext('2d');

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'إجمالي المصروفات اليومية',
        data: data,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}


function updatePieChart(expenses) {
  const categoryTotals = {};

  expenses.forEach(exp => {
    const note = exp.note.trim() || 'غير مصنف';
    if (!categoryTotals[note]) categoryTotals[note] = 0;
    categoryTotals[note] += exp.amount;
  });

  const labels = Object.keys(categoryTotals);
  const data = Object.values(categoryTotals);

  const ctx = document.getElementById('expensesPieChart').getContext('2d');

  if (window.pieChart) window.pieChart.destroy();

  window.pieChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        label: 'نسبة المصروفات حسب الملاحظات',
        data: data,
        backgroundColor: [
          '#3498db', '#e74c3c', '#2ecc71', '#9b59b6', '#f1c40f',
          '#1abc9c', '#e67e22', '#34495e', '#95a5a6', '#ff6384'
        ]
      }]
    },
    options: {
      responsive: true
    }
  });
}

// تعديل على الأماكن التي تستدعي تحديث المخططات
function updateAllCharts(expenses) {
  updateChart(expenses);
  updatePieChart(expenses);
}

// تعديل أماكن الاستدعاء
form.onsubmit = function (e) {
  e.preventDefault();
  const amount = parseFloat(document.getElementById('amount').value);
  const note = document.getElementById('note').value;
  const now = new Date();

  const datetime = formatDateTime(now);
  const expense = {
    datetime,
    timestamp: now.toISOString(),
    amount,
    note
  };

  const expenses = getExpenses();
  expenses.push(expense);
  saveExpenses(expenses);
  addExpenseToTable(expense);
  updateAllCharts(expenses);
  updateDailyTotal(expenses);
  updateAllTimeTotal(expenses);

  form.reset();
};

window.onload = function () {
  const expenses = getExpenses();
  expenses.forEach(addExpenseToTable);
  updateAllCharts(expenses);
  updateDailyTotal(expenses);
  updateAllTimeTotal(expenses);
};


function updateCategoryTable(categoryTotals) {
  const total = Object.values(categoryTotals).reduce((a, b) => a + b, 0);
  let html = '<table style="margin: 0 auto; border-collapse: collapse;"><thead><tr><th style="border:1px solid #ccc; padding:5px;">الفئة</th><th style="border:1px solid #ccc; padding:5px;">النسبة</th></tr></thead><tbody>';

  for (const [category, value] of Object.entries(categoryTotals)) {
    const percentage = ((value / total) * 100).toFixed(1);
    html += `<tr><td style="border:1px solid #ccc; padding:5px;">${category}</td><td style="border:1px solid #ccc; padding:5px;">${percentage}%</td></tr>`;
  }

  html += '</tbody></table>';
  document.getElementById('categoryTable').innerHTML = html;
}

// نعدل دالة الرسم الدائري لتستدعي عرض الجدول
function updatePieChart(expenses) {
  const categoryTotals = {};

  expenses.forEach(exp => {
    const note = exp.note.trim() || 'غير مصنف';
    if (!categoryTotals[note]) categoryTotals[note] = 0;
    categoryTotals[note] += exp.amount;
  });

  const labels = Object.keys(categoryTotals);
  const data = Object.values(categoryTotals);

  const ctx = document.getElementById('expensesPieChart').getContext('2d');

  if (window.pieChart) window.pieChart.destroy();

  window.pieChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        label: 'نسبة المصروفات حسب الملاحظات',
        data: data,
        backgroundColor: [
          '#3498db', '#e74c3c', '#2ecc71', '#9b59b6', '#f1c40f',
          '#1abc9c', '#e67e22', '#34495e', '#95a5a6', '#ff6384'
        ]
      }]
    },
    options: {
      responsive: true
    }
  });

  updateCategoryTable(categoryTotals);
}
