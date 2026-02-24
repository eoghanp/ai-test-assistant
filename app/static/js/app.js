let outputDiv = null;
let outputContainer = null;
let downloadButtonsContainer = null;
// Guard to prevent concurrent AI calls
let __ai_in_progress = false;

function setInProgress(val) {
  __ai_in_progress = !!val;
  console.debug('[ai] setInProgress ->', __ai_in_progress);
  try {
    const genBtn = document.getElementById('generatePlanBtn');
    if (genBtn) genBtn.disabled = !!val;
    const genCasesBtn = document.querySelector('button[onclick*="generateCases"]');
    if (genCasesBtn) genCasesBtn.disabled = !!val;
    const out = document.getElementById('outputPanel');
    if (out) out.setAttribute('aria-busy', val ? 'true' : 'false');
  } catch (e) { }
}

function toggleTestCases(btn) {
  const testCaseOptions = document.getElementById('testCaseOptions');
  if (!testCaseOptions) return;

  const isHidden = testCaseOptions.style.display === 'none' || testCaseOptions.style.display === '';

  if (isHidden) {
    testCaseOptions.style.display = 'block';
    if (btn && btn.textContent) btn.textContent = 'Hide Test Case Generator';
  } else {
    testCaseOptions.style.display = 'none';
    if (btn && btn.textContent) btn.textContent = 'Show Test Case Generator';
  }
}

function showSpinner(message) {
  const spinner = document.getElementById('spinner');
  const spinnerMsg = document.getElementById('spinnerMessage');
  const outputContainerEl = document.getElementById('outputContainer');
  const outputEl = document.getElementById('output');

  if (outputContainerEl) outputContainerEl.style.display = 'block';
  if (spinner) spinner.style.display = 'flex';
  if (spinnerMsg) spinnerMsg.textContent = message || 'Thinking...';

  if (outputEl) {
    outputEl.style.display = 'none';
  }

  downloadButtonsContainer = downloadButtonsContainer || document.getElementById('downloadButtonsContainer');
  if (downloadButtonsContainer) downloadButtonsContainer.style.display = 'none';
}

function hideSpinner() {
  const spinner = document.getElementById('spinner');
  const spinnerMsg = document.getElementById('spinnerMessage');
  const outputEl = document.getElementById('output');

  if (spinner) spinner.style.display = 'none';
  if (spinnerMsg) spinnerMsg.textContent = '';
  if (outputEl) {
    outputEl.style.display = 'block';
  }
}


function makeAbortController(timeoutMs = 60000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return { signal: controller.signal, cancel: () => clearTimeout(timer) };
}

// Helper to escape HTML when inserting raw response text into the DOM
function escapeHtml(unsafe) {
  if (unsafe === null || unsafe === undefined) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function generatePlan() {
  if (__ai_in_progress) { console.warn('generatePlan called while another request is in progress'); return; }
  console.debug('[ai] generatePlan start');
  setInProgress(true);

  outputDiv = outputDiv || document.getElementById("output");
  outputContainer = outputContainer || document.getElementById("outputContainer");
  downloadButtonsContainer = downloadButtonsContainer || document.getElementById('downloadButtonsContainer');

  showSpinner("Generating Test Plan...");

  const formData = new FormData(document.getElementById("mainForm"));
  const ac = makeAbortController(60000);

  try {
    const response = await fetch("/generate-plan", { method: "POST", body: formData, signal: ac.signal });

    if (!response.ok) {
      let bodyText = '';
      try {
        const ct = response.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const json = await response.json();
          bodyText = JSON.stringify(json, null, 2);
        } else {
          bodyText = await response.text();
        }
      } catch (e) {
        bodyText = `Unable to parse response body: ${e.message}`;
      }

      // Stop spinner and show a professional error message with the returned body
      hideSpinner();
      if (outputContainer) outputContainer.style.display = 'block';
      if (outputDiv) {
        outputDiv.innerHTML = `
            <div class="error-card">
              <h3>Error generating response:</h3>
              <p>Please review the response returned by the model. This typically indicates a problem such as quota limits, rate limiting, or an internal model error. Check billing and usage, then try again.</p>
              <details style="margin-top:12px;"><summary style="cursor:pointer">Model response (click to expand)</summary>
                <pre style="white-space:pre-wrap; margin-top:8px;">${escapeHtml(bodyText)}</pre>
              </details>
            </div>
          `;
      }

      if (downloadButtonsContainer) downloadButtonsContainer.style.display = 'none';
      setInProgress(false);
      return;
    }

    const result = await response.text();
    // render and stop spinner
    renderMarkdown(result);
  } catch (err) {
    console.error('generatePlan error', err);
    hideSpinner();
    outputContainer = outputContainer || document.getElementById("outputContainer");
    outputDiv = outputDiv || document.getElementById("output");
    if (outputContainer) outputContainer.style.display = 'block';
    if (outputDiv) outputDiv.innerHTML = `<div class="thinking">Error generating plan: ${escapeHtml(err.message || String(err))}</div>`;
    if (downloadButtonsContainer) downloadButtonsContainer.style.display = 'none';
    setInProgress(false);
  } finally {
    ac.cancel();
  }
}

async function generateCases() {
  if (__ai_in_progress) { console.warn('generateCases called while another request is in progress'); return; }
  setInProgress(true);

  outputDiv = outputDiv || document.getElementById("output");
  outputContainer = outputContainer || document.getElementById("outputContainer");
  downloadButtonsContainer = downloadButtonsContainer || document.getElementById('downloadButtonsContainer');

  const format = document.getElementById("formatType").value;
  if (format === "json") {
    const isValid = validateJSON();
    if (!isValid) { alert("Please fix the JSON format before generating test cases."); setInProgress(false); return; }
  }

  showSpinner("Generating Test Cases...");

  const form = document.getElementById("mainForm");
  const formData = new FormData();
  formData.append("feature_summary", form.feature_summary.value);
  formData.append("requirements", form.requirements.value);
  formData.append("format_type", format);
  formData.append("json_schema", document.getElementById("jsonSchema")?.value || "");

  const ac = makeAbortController(60000);
  try {
    const response = await fetch("/generate-cases", { method: "POST", body: formData, signal: ac.signal });

    // If non-200, capture the body and display a professional error message (like generatePlan)
    if (!response.ok) {
      let bodyText = '';
      try {
        const ct = response.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const json = await response.json();
          bodyText = JSON.stringify(json, null, 2);
        } else {
          bodyText = await response.text();
        }
      } catch (e) {
        bodyText = `Unable to parse response body: ${e.message}`;
      }

      hideSpinner();
      if (outputContainer) outputContainer.style.display = 'block';
      if (outputDiv) {
        outputDiv.innerHTML = `
            <div class="error-card">
              <h3>Error generating response:</h3>
              <p>Please review the response returned by the model. This typically indicates a problem such as quota limits, rate limiting, or an internal model error. Check billing and usage, then try again.</p>
              <details style="margin-top:12px;"><summary style="cursor:pointer">Model response (click to expand)</summary>
                <pre style="white-space:pre-wrap; margin-top:8px;">${escapeHtml(bodyText)}</pre>
              </details>
            </div>
          `;
      }

      if (downloadButtonsContainer) downloadButtonsContainer.style.display = 'none';
      setInProgress(false);
      return;
    }

    const result = await response.text();
    renderMarkdown(result);
  } catch (err) {
    console.error('generateCases error', err);
    hideSpinner();
    outputContainer = outputContainer || document.getElementById("outputContainer");
    outputDiv = outputDiv || document.getElementById("output");
    if (outputContainer) outputContainer.style.display = 'block';
    if (outputDiv) outputDiv.innerHTML = `<div class="thinking">Error generating cases: ${escapeHtml(err.message || String(err))}</div>`;
    if (downloadButtonsContainer) downloadButtonsContainer.style.display = 'none';
    setInProgress(false);
  } finally {
    ac.cancel();
  }
}

function renderMarkdown(text) {
  outputContainer = outputContainer || document.getElementById("outputContainer");
  outputDiv = outputDiv || document.getElementById("output");

  if (outputContainer) outputContainer.style.display = "block";
  hideSpinner();

  const html = marked.parse(text || '');

  if (outputDiv) outputDiv.innerHTML = html;

  document.querySelectorAll('#output pre code, #output code').forEach((block) => {
    try { hljs.highlightElement(block); } catch (e) { /* ignore */ }
  });

  // Save to locale storage for persistence
  if (text) {
    localStorage.setItem('ai_output_persistence', text);
  }

  // Show download buttons after content is rendered
  downloadButtonsContainer = downloadButtonsContainer || document.getElementById('downloadButtonsContainer');
  if (downloadButtonsContainer) downloadButtonsContainer.style.display = 'block';
  setInProgress(false);
}

function clearOutput() {
  if (!confirm("Are you sure you want to clear the output?")) return;

  localStorage.removeItem('ai_output_persistence');

  outputDiv = outputDiv || document.getElementById("output");
  downloadButtonsContainer = downloadButtonsContainer || document.getElementById('downloadButtonsContainer');

  if (outputDiv) {
    // Restore welcome screen
    outputDiv.innerHTML = `
      <div class="welcome-screen">
          <div class="welcome-icon">✨</div>
          <h3>Ready to generate?</h3>
          <p>Fill in the details on the left to get started. Here is how it works:</p>
          <ul class="steps-box shadow-sm">
              <li><strong>1. Scope:</strong> Define your test period and feature name.</li>
              <li><strong>2. Input:</strong> Provide requirements or user stories.</li>
              <li><strong>3. Build:</strong> Click Generate to see the magic happen.</li>
          </ul>
          <div class="welcome-hint">Your professional test documentation will appear right here.</div>
      </div>
    `;
  }

  if (downloadButtonsContainer) downloadButtonsContainer.style.display = 'none';
}

function showThinking(message) {
  outputContainer = outputContainer || document.getElementById("outputContainer");
  outputDiv = outputDiv || document.getElementById("output");

  if (outputContainer) outputContainer.style.display = "block";

  showSpinner(message);
  // ensure we mark that an AI request is in progress while spinner shows
  if (!__ai_in_progress) setInProgress(true);
}

function toggleExpand(id) {
  const el = document.getElementById(id);
  const overlay = document.getElementById('textareaOverlay');
  if (!el || !overlay) return;

  const isExpanded = el.classList.contains('expanded-textarea');

  if (isExpanded) {
    el.classList.remove('expanded-textarea');
    overlay.style.display = 'none';
    document.body.style.overflow = '';
    document.body.classList.remove('modal-open');
  } else {
    closeExpanded();
    el.classList.add('expanded-textarea');
    overlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');
    el.focus();
  }
}

function closeExpanded() {
  const expanded = document.querySelector('.expanded-textarea');
  const overlay = document.getElementById('textareaOverlay');
  if (expanded) expanded.classList.remove('expanded-textarea');
  if (overlay) overlay.style.display = 'none';
  document.body.style.overflow = '';
  document.body.classList.remove('modal-open');
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeExpanded();
});

function copyOutput(btn) {
  outputDiv = outputDiv || document.getElementById("output");
  const text = outputDiv ? outputDiv.innerText : '';

  navigator.clipboard.writeText(text).then(() => {
    if (btn) {
      const originalText = btn.textContent;
      btn.textContent = 'Copied!';
      btn.classList.add('animate-success');
      setTimeout(() => {
        btn.classList.remove('animate-success');
        btn.textContent = originalText;
      }, 800);
    }
  }).catch((err) => {
    console.error('copyOutput error', err);
  });
}

function handleFormatChange() {
  const format = document.getElementById("formatType").value;
  const jsonContainer = document.getElementById("jsonSchemaContainer");

  if (format === "json") {
    jsonContainer.style.display = "block";
  } else {
    jsonContainer.style.display = "none";
  }
}

function validateJSON() {
  const textarea = document.getElementById("jsonSchema");
  const errorDiv = document.getElementById("jsonError");

  if (!textarea) return true;
  const value = textarea.value.trim();

  // If empty → reset
  if (value === "") {
    textarea.classList.remove("valid-json", "invalid-json");
    if (errorDiv) errorDiv.innerHTML = "";
    return true;
  }

  try {
    JSON.parse(value);

    textarea.classList.remove("invalid-json");
    textarea.classList.add("valid-json");

    if (errorDiv) errorDiv.innerHTML = "<span id='successText'>✓ Valid JSON format</span>";
    return true;

  } catch (error) {

    textarea.classList.remove("valid-json");
    textarea.classList.add("invalid-json");

    if (errorDiv) errorDiv.innerHTML = `<span id='errorText'>Invalid JSON: ${error.message}</span>`;
    return false;
  }
}

async function downloadAsWord() {
  const outputEl = document.getElementById("output");
  if (!outputEl) return;

  const content = outputEl.innerHTML;
  if (!content || content.trim() === "" || content.includes('welcome-screen')) {
    alert("There is no content to export yet. Please generate a plan first!");
    return;
  }

  const container = document.createElement('div');
  container.innerHTML = content;

  container.querySelectorAll('button, .copy-btn, .clear-btn, script').forEach(el => el.remove());

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Arial', sans-serif; }
          h1 { color: #1e293b; font-size: 24pt; margin-bottom: 20px; }
          h2 { color: #334155; font-size: 18pt; margin-top: 25px; border-bottom: 1px solid #ccc; }
          h3 { color: #475569; font-size: 14pt; margin-top: 15px; }
          table { border-collapse: collapse; width: 100%; margin: 15px 0; }
          th, td { border: 1px solid #333; padding: 8px; text-align: left; }
          th { background-color: #f1f5f9; font-weight: bold; }
          pre { background-color: #f8fafc; padding: 10px; border: 1px solid #e2e8f0; font-family: 'Courier New'; font-size: 9pt; }
        </style>
    </head>
    <body>
        ${container.innerHTML}
    </body>
    </html>
  `;

  try {
    const options = {
      orientation: 'portrait',
      margins: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      title: 'AI Test Planner Export'
    };

    const docxBlob = await window.generateDocx(htmlContent, null, options);
    saveAs(docxBlob, 'test_planner_export.docx');
  } catch (err) {
    console.error('Word Export Error:', err);

    // Fallback to legacy method if the modern library fails
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export</title></head><body>`;
    const footer = "</body></html>";
    const source = header + container.innerHTML + footer;
    const blob = new Blob(['\ufeff', source], { type: 'application/msword' });
    saveAs(blob, 'test_planner_export.doc');
  }
}

window.generateDocx = window.htmlToDocx || window['html-to-docx'];


function downloadAsExcel() {
  if (!outputDiv) return;

  // Try to find tables in the output first
  const tables = outputDiv.querySelectorAll('table');
  let wb;

  if (tables.length > 0) {
    // If there ARE tables, create a workbook from them
    wb = XLSX.utils.table_to_book(tables[0], { sheet: "Sheet1" });
    // Add additional tables as separate sheets if they exist
    for (let i = 1; i < tables.length; i++) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.table_to_sheet(tables[i]), `Sheet${i + 1}`);
    }
  } else {
    // Fallback: Just put the text content in cells row by row
    const rows = outputDiv.innerText.split('\n').map(line => [line]);
    const ws = XLSX.utils.aoa_to_sheet(rows);
    wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Test Plan");
  }

  // Generate XLSX file and trigger download
  XLSX.writeFile(wb, 'ai_test_planner_export.xlsx');
}

function downloadAsPDF() {
  if (!outputDiv) return;

  // Create a clean clone for PDF generation to avoid UI elements leaking in
  const element = outputDiv.cloneNode(true);
  element.style.color = '#333';
  element.style.background = '#fff';
  element.style.padding = '20px';

  const opt = {
    margin: [10, 10, 10, 10],
    filename: 'ai_test_planner_export.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(element).save();
}

(function () {
  function init() {
    try {
      if (window.__ai_app_inited) {
        console.debug('app.js init already ran, skipping');
        return;
      }
      window.__ai_app_inited = true;

      console.debug('app.js init starting');

      const form = document.getElementById('mainForm');
      if (!form) {
        console.debug('mainForm not found; skipping form init');
        return;
      }

      let generateBtn = document.getElementById('generatePlanBtn');
      if (!generateBtn) {
        generateBtn = Array.from(form.querySelectorAll('button'))
          .find(b => (b.getAttribute && b.getAttribute('onclick') && b.getAttribute('onclick').includes('generatePlan')) || /generate\s*Test\s*Plan/i.test(b.textContent));
      }

      if (window.__ai_skip_validation) {
        console.warn('Client-side validation skipped via window.__ai_skip_validation; enabling Generate button');
        if (generateBtn) generateBtn.disabled = false;
        if (generateBtn && !generateBtn.__ai_click_attached) {
          generateBtn.addEventListener('click', (e) => {
            if (typeof window.generatePlan === 'function') window.generatePlan();
          });
          generateBtn.__ai_click_attached = true;
        }
        return;
      }

      const startInput = form.querySelector('input[name="start_date"]');
      const endInput = form.querySelector('input[name="end_date"]');
      const featureSummary = form.querySelector('textarea[name="feature_summary"]');
      const requirements = form.querySelector('textarea[name="requirements"]');

      const requiredFields = form ? Array.from(form.querySelectorAll('[required]')) : [];
      const touchedFields = new Set();

      function todayISO() {
        const d = new Date();
        return d.toISOString().split('T')[0];
      }

      function setDateMin() {
        const today = todayISO();
        if (startInput) startInput.min = today;
        if (endInput) endInput.min = today;
      }

      function createOrGetErrorEl(field, id) {
        if (!field) return null;
        let el = field.nextElementSibling;
        if (el && el.classList && el.classList.contains('field-error')) return el;

        el = document.createElement('div');
        el.className = 'field-error';
        if (id) el.id = id;
        field.parentNode && field.parentNode.insertBefore(el, field.nextSibling);
        return el;
      }

      const featureSummaryError = createOrGetErrorEl(featureSummary, 'featureSummaryError');
      const requirementsError = createOrGetErrorEl(requirements, 'requirementsError');
      const startError = createOrGetErrorEl(startInput, 'startDateError');
      const endError = createOrGetErrorEl(endInput, 'endDateError');

      function validateDates() {
        const today = todayISO();

        if (startInput) startInput.setCustomValidity('');
        if (endInput) endInput.setCustomValidity('');

        if (startInput && !startInput.value) {
          startInput.setCustomValidity('Start date is required.');
        } else if (startInput && startInput.value && startInput.value < today) {
          startInput.setCustomValidity('Start date cannot be before today.');
        }

        if (endInput && !endInput.value) {
          endInput.setCustomValidity('End date is required.');
        } else if (endInput && endInput.value && endInput.value < today) {
          endInput.setCustomValidity('End date cannot be before today.');
        }

        // Only check relationship if both have values
        if (startInput && endInput && startInput.value && endInput.value) {
          if (endInput.value < startInput.value) {
            endInput.setCustomValidity('End date must be the same as or after the start date.');
          }
        }
      }

      function validateTextLength(field, minLen) {
        if (!field) return true;
        field.setCustomValidity('');
        const v = (field.value || '').trim();
        if (v.length === 0 && field.hasAttribute('required')) {
          field.setCustomValidity('This field is required.');
          return false;
        }
        if (v.length > 0 && v.length < minLen) {
          field.setCustomValidity(`Please enter at least ${minLen} characters.`);
          return false;
        }
        return true;
      }

      function showFieldErrors(field, errorEl) {
        if (!field || !errorEl) return;
        if (!field.validity.valid) {
          errorEl.textContent = field.validationMessage;
          field.setAttribute('aria-invalid', 'true');
        } else {
          errorEl.textContent = '';
          field.removeAttribute('aria-invalid');
        }
      }

      function saveFormToStorage() {
        const data = {
          start_date: startInput.value,
          end_date: endInput.value,
          feature_summary: featureSummary.value,
          requirements: requirements.value
        };
        localStorage.setItem('ai_planner_form_data', JSON.stringify(data));
      }

      function loadFormFromStorage() {
        const saved = localStorage.getItem('ai_planner_form_data');
        if (!saved) return;
        try {
          const data = JSON.parse(saved);
          if (data.start_date) startInput.value = data.start_date;
          if (data.end_date) endInput.value = data.end_date;
          if (data.feature_summary) featureSummary.value = data.feature_summary;
          if (data.requirements) requirements.value = data.requirements;

          if (data.start_date) touchedFields.add(startInput);
          if (data.end_date) touchedFields.add(endInput);
          if (data.feature_summary) touchedFields.add(featureSummary);
          if (data.requirements) touchedFields.add(requirements);
        } catch (e) {
          console.warn('Failed to load form data', e);
        }
      }

      function attachMutualDateListeners() {
        if (!startInput || !endInput) return;

        startInput.addEventListener('change', () => {
          if (startInput.value) {
            endInput.min = startInput.value;
          } else {
            endInput.min = todayISO();
          }

          scheduleValidate();
        });

        endInput.addEventListener('change', () => {
          if (endInput.value) {
            startInput.max = endInput.value;
          } else {
            startInput.removeAttribute('max');
          }

          scheduleValidate();
        });
      }

      let _lastMessages = { start: null, end: null, feature: null, requirements: null };
      let _validateScheduled = false;
      function validateForm(forceShowAll = false) {
        // Don't validate while an AI request is in progress — avoids event cascades
        if (typeof __ai_in_progress !== 'undefined' && __ai_in_progress) return false;
        setDateMin();

        let startMsg = '';
        let endMsg = '';
        const today = todayISO();

        if (!startInput || !endInput || !featureSummary || !requirements) return false;

        if (!startInput.value) startMsg = 'Start date is required.';
        else if (startInput.value < today) startMsg = 'Start date cannot be before today.';

        if (!endInput.value) endMsg = 'End date is required.';
        else if (endInput.value < today) endMsg = 'End date cannot be before today.';
        else if (startInput.value && endInput.value && endInput.value < startInput.value) endMsg = 'End date must be the same as or after the start date.';

        const featureMsg = (featureSummary.value || '').trim().length === 0 && featureSummary.hasAttribute('required')
          ? 'This field is required.'
          : ((featureSummary.value || '').trim().length > 0 && (featureSummary.value || '').trim().length < 5 ? 'Please enter at least 5 characters.' : '');

        const reqMsg = (requirements.value || '').trim().length === 0 && requirements.hasAttribute('required')
          ? 'This field is required.'
          : ((requirements.value || '').trim().length > 0 && (requirements.value || '').trim().length < 5 ? 'Please enter at least 5 characters.' : '');

        startInput.setCustomValidity(startMsg);
        endInput.setCustomValidity(endMsg);
        featureSummary.setCustomValidity(featureMsg);
        requirements.setCustomValidity(reqMsg);

        if (forceShowAll || touchedFields.has(startInput)) {
          if (_lastMessages.start !== startMsg) { startError.textContent = startMsg; _lastMessages.start = startMsg; }
        }
        if (forceShowAll || touchedFields.has(endInput)) {
          if (_lastMessages.end !== endMsg) { endError.textContent = endMsg; _lastMessages.end = endMsg; }
        }
        if (forceShowAll || touchedFields.has(featureSummary)) {
          if (_lastMessages.feature !== featureMsg) { featureSummaryError.textContent = featureMsg; _lastMessages.feature = featureMsg; }
        }
        if (forceShowAll || touchedFields.has(requirements)) {
          if (_lastMessages.requirements !== reqMsg) { requirementsError.textContent = reqMsg; _lastMessages.requirements = reqMsg; }
        }

        const valid = form.checkValidity();
        if (generateBtn) generateBtn.disabled = !valid;
        return valid;
      }

      function scheduleValidate() {
        if (typeof __ai_in_progress !== 'undefined' && __ai_in_progress) return;
        console.debug('[ai] scheduleValidate requested');
        if (_validateScheduled) return;
        _validateScheduled = true;
        setTimeout(() => {
          try { validateForm(); } catch (err) { console.error('validateForm error', err); }
          _validateScheduled = false;
        }, 120);
      }

      loadFormFromStorage();
      setDateMin();
      if (generateBtn) generateBtn.disabled = true;
      attachMutualDateListeners();

      const watchFields = [startInput, endInput, featureSummary, requirements].filter(Boolean);
      watchFields.forEach(el => {
        el.addEventListener('input', () => {
          touchedFields.add(el);
          saveFormToStorage();
          scheduleValidate();
        });
        el.addEventListener('change', () => {
          touchedFields.add(el);
          saveFormToStorage();
          scheduleValidate();
        });

        el.addEventListener('invalid', (e) => {
          e.preventDefault();
          scheduleValidate();
        });
      });

      if (generateBtn) {
        generateBtn.addEventListener('click', (e) => {
          if (!validateForm(true)) {
            const firstInvalid = form.querySelector(':invalid');
            if (firstInvalid) {
              firstInvalid.focus();
            }
            return;
          }
          if (typeof window.generatePlan === 'function') {
            window.generatePlan();
          } else {
            const onclickAttr = generateBtn.getAttribute && generateBtn.getAttribute('onclick');
            if (onclickAttr && onclickAttr.includes('generatePlan')) {
              try {
                window.generatePlan();
              } catch (err) {
                console.warn('generatePlan() not defined.');
              }
            } else {
              console.warn('generatePlan() not defined.');
            }
          }
        });
      }

      validateForm();

      const persistedOutput = localStorage.getItem('ai_output_persistence');
      if (persistedOutput) {
        console.debug('Restoring persisted AI output');
        renderMarkdown(persistedOutput);
      }

      console.debug('app.js init complete');

    } catch (err) {
      console.error('app.js init error', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // DOM already ready
    init();
  }
})();
