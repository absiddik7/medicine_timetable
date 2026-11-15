/**
 * সহজ প্রেসক্রিপশন ও ওষুধের সময়সূচী (Easy Medicine Timetable)
 * Application Logic & Live Reactive Rendering
 * Optimized for Strict 1-Page A4 Output, Clean Bengali Minimalist UI
 */

// Initial Default Dataset based on user's father's prescription
const DEFAULT_PRESCRIPTION = {
  patientName: "আব্দুল ওয়াহাব",
  prescriptionDate: "19 Oct, 2025",
  morning: [
    { id: "m1", name: "র‍্যাবেকন 20", dose: "১ টা", timing: "খাবার আগে", note: "" },
    { id: "m2", name: "পেরিটপ 50", dose: "১ টা", timing: "খাবার আগে", note: "" },
    { id: "m3", name: "ফুসিন 40", dose: "১ টা", timing: "খাবার পরে", note: "" },
    { id: "m4", name: "মিগ ২.৫", dose: "১ টা", timing: "", note: "" },
    { id: "m5", name: "সিলোস্টা", dose: "১/২ টা", timing: "", note: "" },
    { id: "m6", name: "ভেরিগাট ২.৫", dose: "১ টা", timing: "", note: "" },
    { id: "m7", name: "কারভা ৭৫", dose: "১ টা", timing: "", note: "" },
    { id: "m8", name: "ভেরিগাট ২.৫", dose: "১ টা", timing: "", note: "" }
  ],
  noon: [
    { id: "n1", name: "পেরিটপ 50", dose: "১ টা", timing: "খাবার আগে", note: "" }
  ],
  night: [
    { id: "e1", name: "র‍্যাবেকন 20", dose: "১ টা", timing: "খাবার আগে", note: "" },
    { id: "e2", name: "পেরিটপ 50", dose: "১ টা", timing: "খাবার আগে", note: "" },
    { id: "e3", name: "কারভিসটা ১২.৫", dose: "১ টা", timing: "", note: "" },
    { id: "e4", name: "মিগ ২.৫", dose: "১ টা", timing: "", note: "" },
    { id: "e5", name: "সিলোস্টা", dose: "১/২ টা", timing: "", note: "" },
    { id: "e6", name: "এনজিটর ১০", dose: "১ টা", timing: "", note: "" },
    { id: "e7", name: "ফিনেরন", dose: "১ টা", timing: "", note: "" },
    { id: "e8", name: "ইউরোম্যাক্স D", dose: "১ টা", timing: "", note: "" },
    { id: "e9", name: "ডিক্যালট্রল", dose: "১ টা", timing: "", note: "" }
  ],
  other: [
    { id: "o1", name: "রোক্সাটাট", dose: "১ টা", timing: "", days: "রবিবার ও মঙ্গলবার", note: "" }
  ]
};

// Global App State
let appState = {
  data: JSON.parse(JSON.stringify(DEFAULT_PRESCRIPTION)),
  settings: {
    fontSize: "font-size-xl",
    theme: "theme-friendly",
    numFormat: "bn",
    showIcons: true,
    showCheckboxes: false,
    pageOrientation: "landscape",
    sheetScale: 1
  }
};

// Storage Key
const STORAGE_KEY = "EASY_MED_TIME_SHEET_DATA_V3";

// Convert English digits to Bengali digits
function toBengaliNum(num) {
  if (appState.settings.numFormat === "en") return num.toString();
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().replace(/\d/g, d => bnDigits[d]);
}

// Generate unique ID
function uid() {
  return 'med_' + Math.random().toString(36).substr(2, 9);
}

// Save state to LocalStorage
function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  } catch (e) {
    console.warn("LocalStorage save error:", e);
  }
}

// Load state from LocalStorage
function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.data && parsed.settings) {
        appState = parsed;
      }
    }
  } catch (e) {
    console.warn("LocalStorage load error:", e);
  }
}

// ==========================================================================
// RENDER FUNCTIONS (REAL-TIME PREVIEW & MANAGE LIST)
// ==========================================================================

function renderAll() {
  renderPreview();
  renderManageLists();
  saveState();
}

// Render the Live Preview Sheet
function renderPreview() {
  const d = appState.data;

  // Header Patient info
  document.getElementById("dispPatientName").textContent = d.patientName || "রোগীর নাম";
  document.getElementById("dispPrescriptionDate").textContent = d.prescriptionDate || "-";

  // Render Columns
  renderColumn("previewMorning", d.morning);
  renderColumn("previewNoon", d.noon);
  renderColumn("previewNight", d.night);
  renderOtherSection("previewOther", d.other);

  // Update Settings UI Classes & Orientation
  document.body.className = `${appState.settings.theme} ${appState.settings.fontSize} orientation-${appState.settings.pageOrientation}`;

  // Apply custom sheet scale if any
  const sheet = document.getElementById("medicineSheet");
  if (sheet && appState.settings.sheetScale) {
    sheet.style.transform = `scale(${appState.settings.sheetScale})`;
    if (appState.settings.sheetScale < 1) {
      sheet.style.marginBottom = `-${(1 - appState.settings.sheetScale) * 100}%`;
    } else {
      sheet.style.marginBottom = "0";
    }
  }
}

// Render individual time column (Morning / Noon / Night)
// Line 1: Serial + Name + Dose
// Line 2: (খাবার আগে / খাবার পরে) in minimal size without icons
function renderColumn(tbodyId, items) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;

  if (!items || items.length === 0) {
    tbody.innerHTML = `<tr><td class="empty-col-message">এই সময়ে কোনো ওষুধ নেই</td></tr>`;
    return;
  }

  tbody.innerHTML = items.map((item, idx) => {
    const serial = toBengaliNum(idx + 1) + ".";
    
    // Checkbox if enabled
    const checkboxHtml = appState.settings.showCheckboxes 
      ? `<span class="med-tick-box"></span>` 
      : "";

    // Meal timing minimal text on 2nd line, NO ICON
    let mealTimingHtml = "";
    if (item.timing) {
      let timingClass = "timing-neutral";
      if (item.timing.includes("আগে") || item.timing.includes("খালি")) {
        timingClass = "timing-before";
      } else if (item.timing.includes("পরে")) {
        timingClass = "timing-after";
      }
      mealTimingHtml = `
        <span class="med-timing-subline ${timingClass}">
          (${escapeHtml(item.timing)})
        </span>
      `;
    }

    // Special day note for this item if any
    const dayNoteHtml = item.days ? `<span class="days-badge"><i class="fa-solid fa-calendar"></i> ${escapeHtml(item.days)}</span>` : "";

    return `
      <tr>
        <td class="med-row-cell">
          <div class="med-row-wrap">
            <div class="med-line-1">
              <div class="med-left">
                ${checkboxHtml}
                <span class="med-serial">${serial}</span>
                <span class="med-name-text" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</span>
              </div>
              <span class="med-dose-pill">${escapeHtml(item.dose || '১ টা')}</span>
            </div>
            ${(mealTimingHtml || dayNoteHtml) ? `
              <div class="med-line-2">
                ${mealTimingHtml}
                ${dayNoteHtml}
              </div>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

// Render "Other" section
function renderOtherSection(tbodyId, items) {
  const otherSec = document.getElementById("otherSection");
  const tbody = document.getElementById(tbodyId);
  if (!tbody || !otherSec) return;

  if (!items || items.length === 0) {
    otherSec.style.display = "none";
    tbody.innerHTML = "";
    return;
  }

  otherSec.style.display = "block";
  tbody.innerHTML = items.map((item, idx) => {
    const serial = toBengaliNum(idx + 1) + ".";
    return `
      <tr>
        <td style="font-weight: 800; color: #334155; text-align: center; width: 6%;">${serial}</td>
        <td style="width: 44%;">
          <strong style="color: #0f172a;">${escapeHtml(item.name)}</strong>
          ${item.timing ? `<span class="med-timing-subline timing-neutral" style="margin-left: 0.4rem;">(${item.timing})</span>` : ''}
        </td>
        <td style="width: 20%;"><span class="med-dose-pill">${escapeHtml(item.dose || '১ টা')}</span></td>
        <td style="width: 30%;"><span class="days-badge"><i class="fa-solid fa-calendar-check"></i> ${escapeHtml(item.days || 'প্রয়োজনমত')}</span></td>
      </tr>
    `;
  }).join("");
}

// Render Manage & Reorder list inside Tab 2
function renderManageLists() {
  const d = appState.data;

  // Counts
  document.getElementById("morningCount").textContent = `${toBengaliNum(d.morning.length)} টি`;
  document.getElementById("noonCount").textContent = `${toBengaliNum(d.noon.length)} টি`;
  document.getElementById("nightCount").textContent = `${toBengaliNum(d.night.length)} টি`;
  document.getElementById("otherCount").textContent = `${toBengaliNum(d.other.length)} টি`;

  renderManageSlotList("listMorning", d.morning, "morning");
  renderManageSlotList("listNoon", d.noon, "noon");
  renderManageSlotList("listNight", d.night, "night");
  renderManageSlotList("listOther", d.other, "other");
}

function renderManageSlotList(containerId, list, slotKey) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!list || list.length === 0) {
    container.innerHTML = `<li style="padding: 0.4rem; color: #94a3b8; font-style: italic; font-size: 0.85rem;">কোনো ওষুধ নেই</li>`;
    return;
  }

  container.innerHTML = list.map((item, idx) => {
    const isFirst = idx === 0;
    const isLast = idx === list.length - 1;
    return `
      <li class="med-item-row" data-id="${item.id}">
        <div class="med-item-info">
          <span class="med-item-name">${toBengaliNum(idx + 1)}. ${escapeHtml(item.name)}</span>
          <div class="med-item-meta">
            <span><strong>ডোজ:</strong> ${escapeHtml(item.dose || '১ টা')}</span>
            ${item.timing ? `<span>• <strong>নিয়ম:</strong> (${item.timing})</span>` : ''}
            ${item.days ? `<span>• <strong>দিন:</strong> ${item.days}</span>` : ''}
          </div>
        </div>
        <div class="med-item-actions">
          <button class="btn-icon" title="উপরে তুলুন" onclick="moveItem('${slotKey}', ${idx}, -1)" ${isFirst ? 'disabled style="opacity:0.3"' : ''}>
            <i class="fa-solid fa-arrow-up"></i>
          </button>
          <button class="btn-icon" title="নিচে নামান" onclick="moveItem('${slotKey}', ${idx}, 1)" ${isLast ? 'disabled style="opacity:0.3"' : ''}>
            <i class="fa-solid fa-arrow-down"></i>
          </button>
          <button class="btn-icon" title="সম্পাদনা করুন" onclick="openEditModal('${slotKey}', ${idx})">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="btn-icon delete" title="মুছে ফেলুন" onclick="deleteItem('${slotKey}', ${idx})">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </li>
    `;
  }).join("");
}

// Helper: Escape HTML
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ==========================================================================
// ACTIONS (ADD, EDIT, DELETE, MOVE)
// ==========================================================================

// Add Medicine from Tab 1 Form
function handleAddMedicine() {
  const nameInput = document.getElementById("medName");
  const doseInput = document.getElementById("medDose");
  const daysInput = document.getElementById("medDays");
  const timingRadio = document.querySelector('input[name="mealTiming"]:checked');

  const name = nameInput.value.trim();
  if (!name) {
    alert("অনুগ্রহ করে ওষুধের নাম লিখুন!");
    nameInput.focus();
    return;
  }

  const dose = doseInput.value.trim() || "১ টা";
  const timing = timingRadio ? timingRadio.value : "";
  const days = daysInput.value.trim();

  // Check selected slots
  const slots = [];
  if (document.getElementById("slotMorning").checked) slots.push("morning");
  if (document.getElementById("slotNoon").checked) slots.push("noon");
  if (document.getElementById("slotNight").checked) slots.push("night");
  if (document.getElementById("slotOther").checked) slots.push("other");

  if (slots.length === 0) {
    alert("অনুগ্রহ করে অন্তত একটি সময় (সকাল, দুপুর, রাত বা অন্যান্য) নির্বাচন করুন!");
    return;
  }

  // Add item into each selected slot
  slots.forEach(slotKey => {
    appState.data[slotKey].push({
      id: uid(),
      name: name,
      dose: dose,
      timing: timing,
      days: (slotKey === "other" && !days) ? "বিশেষ দিন" : days,
      note: ""
    });
  });

  // Reset form
  nameInput.value = "";
  daysInput.value = "";
  nameInput.focus();

  renderAll();

  // Show small visual feedback
  const addBtn = document.getElementById("addMedicineBtn");
  const origText = addBtn.innerHTML;
  addBtn.innerHTML = `<i class="fa-solid fa-check"></i> ওষুধ যোগ হয়েছে!`;
  addBtn.style.background = "#16a34a";
  setTimeout(() => {
    addBtn.innerHTML = origText;
    addBtn.style.background = "";
  }, 1200);
}

// Delete item
window.deleteItem = function(slotKey, index) {
  if (confirm(`আপনি কি এই ওষুধটি তালিকা থেকে মুছে ফেলতে চান?`)) {
    appState.data[slotKey].splice(index, 1);
    renderAll();
  }
};

// Move item up / down
window.moveItem = function(slotKey, index, direction) {
  const targetIndex = index + direction;
  const list = appState.data[slotKey];
  if (targetIndex < 0 || targetIndex >= list.length) return;

  const temp = list[index];
  list[index] = list[targetIndex];
  list[targetIndex] = temp;

  renderAll();
};

// Edit item in Modal
window.openEditModal = function(slotKey, index) {
  const item = appState.data[slotKey][index];
  if (!item) return;

  document.getElementById("editSlot").value = slotKey;
  document.getElementById("editIndex").value = index;
  document.getElementById("editMedName").value = item.name || "";
  document.getElementById("editMedDose").value = item.dose || "";
  document.getElementById("editMealTiming").value = item.timing || "";
  document.getElementById("editMedDays").value = item.days || "";

  document.getElementById("editModal").classList.add("active");
};

function handleSaveEdit() {
  const slotKey = document.getElementById("editSlot").value;
  const index = parseInt(document.getElementById("editIndex").value, 10);
  const item = appState.data[slotKey][index];
  if (!item) return;

  item.name = document.getElementById("editMedName").value.trim();
  item.dose = document.getElementById("editMedDose").value.trim();
  item.timing = document.getElementById("editMealTiming").value;
  item.days = document.getElementById("editMedDays").value.trim();

  document.getElementById("editModal").classList.remove("active");
  renderAll();
}

// ==========================================================================
// EXPORT HANDLERS (PRINT, PDF, DOCX/WORD, IMAGE)
// ==========================================================================

// 1. Direct Browser Print - GOLD STANDARD for 1-Page Vector PDF
window.printChart = function() {
  window.print();
};

// 2. Export to PDF file using html2pdf with font pre-warming & strict 1-page bounds
window.exportToPdf = async function() {
  const element = document.getElementById("medicineSheet");
  const patientName = appState.data.patientName || "Medicine_Schedule";
  const cleanName = patientName.replace(/[^a-zA-Z0-9\u0980-\u09FF]/g, '_');
  
  // Wait for all fonts to finish loading
  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch (e) {
      console.warn("Font ready check error:", e);
    }
  }

  const opt = {
    margin: [3, 4, 3, 4],
    filename: `${cleanName}_Med_Chart_1Page.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 2.5, 
      useCORS: true, 
      letterRendering: false,
      logging: false,
      scrollY: 0,
      scrollX: 0
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: appState.settings.pageOrientation }
  };

  const btn = event?.currentTarget || document.getElementById("downloadPdfBtn");
  const origText = btn ? btn.innerHTML : "";
  if (btn) btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> প্রস্তুত হচ্ছে...`;

  try {
    await html2pdf().set(opt).from(element).save();
    if (btn) btn.innerHTML = origText;
  } catch (err) {
    console.error("PDF generation error:", err);
    alert("টিপস: ব্রাউজারের প্রিন্ট ডায়ালগ (Print / Save as PDF) ব্যবহার করলে ১০০% নিখুঁত ভেক্টর ফন্টে ১ পৃষ্ঠায় সেভ হয়।");
    if (btn) btn.innerHTML = origText;
    window.print();
  }
};

// 3. Export to Word (.doc compatible HTML)
window.exportToWord = function() {
  const d = appState.data;

  // Build clean HTML table format with native Windows Nirmala UI font for Microsoft Word
  let docContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${d.patientName}</title>
      <style>
        body { font-family: 'Nirmala UI', 'Kalpurush', 'SolaimanLipi', 'Vrinda', Arial, sans-serif; margin: 15pt; }
        h1 { color: #0f172a; font-size: 20pt; margin-bottom: 2pt; }
        .meta { color: #334155; font-size: 11pt; margin-bottom: 12pt; border-bottom: 2pt solid #0f172a; padding-bottom: 5pt; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 10pt; page-break-inside: avoid; }
        th { background-color: #f1f5f9; border: 1.5pt solid #64748b; padding: 6pt; font-size: 12pt; text-align: left; }
        td { border: 1pt solid #cbd5e1; padding: 5pt 7pt; font-size: 10.5pt; vertical-align: top; }
        .dose-pill { font-weight: bold; color: #1e40af; }
        .timing-subline { font-size: 8.5pt; color: #b45309; padding-left: 12pt; margin-top: 1pt; }
      </style>
    </head>
    <body>
      <h1>${d.patientName}</h1>
      <div class="meta">
        <strong>তারিখ:</strong> ${d.prescriptionDate || '-'}
      </div>

      <table>
        <thead>
          <tr style="background-color: #e2e8f0;">
            <th style="width: 34%; color: #b45309;">সকাল (Morning)</th>
            <th style="width: 32%; color: #0369a1;">দুপুর (Noon)</th>
            <th style="width: 34%; color: #6d28d9;">রাত (Night)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <!-- MORNING -->
            <td>
              ${d.morning.map((m, i) => `
                <div style="margin-bottom: 5pt;">
                  <div style="display: flex; justify-content: space-between;">
                    <strong>${toBengaliNum(i + 1)}. ${m.name}</strong> — <span class="dose-pill">${m.dose}</span>
                  </div>
                  ${m.timing ? `<div class="timing-subline">(${m.timing})</div>` : ''}
                </div>
              `).join('') || '<em>কোনো ওষুধ নেই</em>'}
            </td>

            <!-- NOON -->
            <td>
              ${d.noon.map((m, i) => `
                <div style="margin-bottom: 5pt;">
                  <div style="display: flex; justify-content: space-between;">
                    <strong>${toBengaliNum(i + 1)}. ${m.name}</strong> — <span class="dose-pill">${m.dose}</span>
                  </div>
                  ${m.timing ? `<div class="timing-subline">(${m.timing})</div>` : ''}
                </div>
              `).join('') || '<em>কোনো ওষুধ নেই</em>'}
            </td>

            <!-- NIGHT -->
            <td>
              ${d.night.map((m, i) => `
                <div style="margin-bottom: 5pt;">
                  <div style="display: flex; justify-content: space-between;">
                    <strong>${toBengaliNum(i + 1)}. ${m.name}</strong> — <span class="dose-pill">${m.dose}</span>
                  </div>
                  ${m.timing ? `<div class="timing-subline">(${m.timing})</div>` : ''}
                </div>
              `).join('') || '<em>কোনো ওষুধ নেই</em>'}
            </td>
          </tr>
        </tbody>
      </table>

      ${d.other && d.other.length > 0 ? `
        <h3 style="margin-top: 8pt; margin-bottom: 4pt; font-size: 11pt;">অন্যান্য ওষুধ ও বিশেষ দিন (Others / Weekly)</h3>
        <table>
          <thead>
            <tr style="background-color: #f0fdf4;">
              <th style="width: 8%;">ক্রম</th>
              <th style="width: 47%;">ওষুধের নাম</th>
              <th style="width: 20%;">ডোজ</th>
              <th style="width: 25%;">দিন / নিয়ম</th>
            </tr>
          </thead>
          <tbody>
            ${d.other.map((m, i) => `
              <tr>
                <td>${toBengaliNum(i + 1)}.</td>
                <td><strong>${m.name}</strong></td>
                <td>${m.dose}</td>
                <td><strong>${m.days || 'প্রয়োজনমত'}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : ''}
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff' + docContent], {
    type: 'application/msword;charset=utf-8'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const cleanName = (d.patientName || "Medicine_Schedule").replace(/[^a-zA-Z0-9\u0980-\u09FF]/g, '_');
  link.download = `${cleanName}_Med_Chart_1Page.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// 4. Export as PNG Image using html2canvas
window.exportToImage = async function() {
  const element = document.getElementById("medicineSheet");
  const patientName = appState.data.patientName || "Medicine_Schedule";
  const cleanName = patientName.replace(/[^a-zA-Z0-9\u0980-\u09FF]/g, '_');

  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch (e) {}
  }

  html2canvas(element, { scale: 2.5, useCORS: true, letterRendering: false }).then(canvas => {
    const link = document.createElement('a');
    link.download = `${cleanName}_Med_Chart_1Page.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }).catch(err => {
    console.error("Image generation error:", err);
    alert("ছবি তৈরিতে সমস্যা হয়েছে। অনুগ্রহ করে ব্রাউজারের প্রিন্ট অপশন ব্যবহার করুন।");
  });
};

// ==========================================================================
// EVENT LISTENERS & SETUP
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
  loadState();

  // Populate inputs with current state
  document.getElementById("patientName").value = appState.data.patientName;
  document.getElementById("prescriptionDate").value = appState.data.prescriptionDate;

  // Patient Info Realtime Listeners
  document.getElementById("patientName").addEventListener("input", (e) => {
    appState.data.patientName = e.target.value;
    renderAll();
  });
  document.getElementById("prescriptionDate").addEventListener("input", (e) => {
    appState.data.prescriptionDate = e.target.value;
    renderAll();
  });

  // Tab switching
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
      btn.classList.add("active");
      const targetId = btn.getAttribute("data-tab");
      document.getElementById(targetId)?.classList.add("active");
    });
  });

  // Add Medicine Form Submission
  document.getElementById("addMedicineBtn").addEventListener("click", handleAddMedicine);

  // Quick Medicine Suggestion Chips
  document.querySelectorAll(".suggestion-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      document.getElementById("medName").value = chip.textContent.trim();
    });
  });

  // Quick Dose Chips
  document.querySelectorAll(".dose-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      document.getElementById("medDose").value = chip.getAttribute("data-dose");
    });
  });

  // Quick Day Chips
  document.querySelectorAll(".day-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      document.getElementById("medDays").value = chip.getAttribute("data-day");
    });
  });

  // Accordion Toggles in Tab 2
  document.querySelectorAll(".accordion-header").forEach(header => {
    header.addEventListener("click", () => {
      const item = header.parentElement;
      const body = item.querySelector(".accordion-body");
      const icon = header.querySelector(".toggle-icon");
      if (body.style.display === "none") {
        body.style.display = "block";
        icon.className = "fa-solid fa-chevron-down toggle-icon";
      } else {
        body.style.display = "none";
        icon.className = "fa-solid fa-chevron-right toggle-icon";
      }
    });
  });

  // Font Size Selection
  document.querySelectorAll(".size-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".size-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      appState.settings.fontSize = btn.getAttribute("data-size");
      renderAll();
    });
  });

  // Theme Selection
  document.querySelectorAll('input[name="appTheme"]').forEach(radio => {
    radio.addEventListener("change", (e) => {
      appState.settings.theme = e.target.value;
      renderAll();
    });
  });

  // Number Format Selection
  document.querySelectorAll('input[name="numFormat"]').forEach(radio => {
    radio.addEventListener("change", (e) => {
      appState.settings.numFormat = e.target.value;
      renderAll();
    });
  });

  // Toggle Checkboxes
  document.getElementById("toggleIcons").addEventListener("change", (e) => {
    appState.settings.showIcons = e.target.checked;
    renderAll();
  });
  document.getElementById("toggleCheckboxes").addEventListener("change", (e) => {
    appState.settings.showCheckboxes = e.target.checked;
    renderAll();
  });

  // Page Orientation
  document.querySelectorAll('input[name="pageOrientation"]').forEach(radio => {
    radio.addEventListener("change", (e) => {
      appState.settings.pageOrientation = e.target.value;
      renderAll();
    });
  });

  // Page Scaling Buttons
  document.querySelectorAll(".scale-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".scale-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      appState.settings.sheetScale = parseFloat(btn.getAttribute("data-scale"));
      renderAll();
    });
  });

  // Export Dropdown
  const downloadMenuBtn = document.getElementById("downloadMenuBtn");
  const exportDropdown = document.getElementById("exportDropdown");
  downloadMenuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    exportDropdown.classList.toggle("show");
  });
  document.addEventListener("click", () => {
    exportDropdown.classList.remove("show");
  });

  // Load Preset Button
  document.getElementById("loadPresetBtn").addEventListener("click", () => {
    if (confirm("নমুনা প্রেসক্রিপশন (আব্দুল ওয়াহাব) লোড করবেন? বর্তমান পরিবর্তনগুলো প্রতিস্থাপিত হবে।")) {
      appState.data = JSON.parse(JSON.stringify(DEFAULT_PRESCRIPTION));
      document.getElementById("patientName").value = appState.data.patientName;
      document.getElementById("prescriptionDate").value = appState.data.prescriptionDate;
      renderAll();
    }
  });

  // Clear All Button
  document.getElementById("clearAllBtn").addEventListener("click", () => {
    if (confirm("আপনি কি সব ওষুধ মুছে সম্পূর্ণ নতুন একটি তালিকা তৈরি করতে চান?")) {
      appState.data = {
        patientName: "",
        prescriptionDate: "",
        morning: [],
        noon: [],
        night: [],
        other: []
      };
      document.getElementById("patientName").value = "";
      document.getElementById("prescriptionDate").value = "";
      renderAll();
    }
  });

  // Edit Modal Event Handlers
  document.getElementById("closeEditModal").addEventListener("click", () => {
    document.getElementById("editModal").classList.remove("active");
  });
  document.getElementById("cancelEditBtn").addEventListener("click", () => {
    document.getElementById("editModal").classList.remove("active");
  });
  document.getElementById("saveEditBtn").addEventListener("click", handleSaveEdit);

  // Initial Render
  renderAll();
});
