/**
 * repairs.js — laptop registration & repair report page logic.
 */
const RepairsPage = (() => {
  let laptops = [];

  async function load() {
    await Promise.all([loadStats(), loadLaptops()]);
  }

  // ── Stats ──────────────────────────────────────────────────
  async function loadStats() {
    try {
      const [laptopRes, dailyRes] = await Promise.all([
        API.get('/repairs/laptops'),
        API.get('/repairs/daily'),
      ]);
      const counts = { pending: 0, 'in-progress': 0, done: 0, released: 0 };
      laptopRes.data.forEach((l) => counts[l.status]++);
      document.getElementById('r-stat-total').textContent    = laptopRes.count;
      document.getElementById('r-stat-pending').textContent  = counts.pending;
      document.getElementById('r-stat-inprog').textContent   = counts['in-progress'];
      document.getElementById('r-stat-done').textContent     = counts.done + counts.released;
      document.getElementById('r-stat-revenue').textContent  = '₱' + dailyRes.totalRevenue;
    } catch (e) { console.error(e); }
  }

  // ── Laptops table ──────────────────────────────────────────
  async function loadLaptops() {
    const tbody = document.getElementById('laptops-tbody');
    tbody.innerHTML = '<tr><td colspan="6" class="text-muted">Loading…</td></tr>';
    try {
      const res = await API.get('/repairs/laptops');
      laptops   = res.data;
      if (!laptops.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-muted">No laptops registered.</td></tr>';
        return;
      }
      tbody.innerHTML = laptops.map((l) => `
        <tr>
          <td><code>${l.barcode}</code></td>
          <td>${l.brand} ${l.model}</td>
          <td>${l.ownerName || '—'}</td>
          <td>${l.ownerContact || '—'}</td>
          <td><span class="badge badge-${l.status}">${l.status}</span></td>
          <td>
            <button class="btn btn-ghost btn-sm" onclick="RepairsPage.openReportModal('${l._id}','${l.barcode} — ${l.brand} ${l.model}')">+ Report</button>
            <button class="btn btn-danger btn-sm" onclick="RepairsPage.deleteLaptop('${l._id}')">Del</button>
          </td>
        </tr>`).join('');

      // Populate laptop select in report modal
      const sel = document.getElementById('rep-laptop-sel');
      if (sel) sel.innerHTML = laptops.map((l) =>
        `<option value="${l._id}">${l.barcode} — ${l.brand} ${l.model}</option>`
      ).join('');
    } catch (e) { tbody.innerHTML = `<tr><td colspan="6" class="text-danger">${e.message}</td></tr>`; }
  }

  // ── Add laptop form ────────────────────────────────────────
  document.getElementById('laptop-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f   = e.target;
    const btn = f.querySelector('button[type=submit]');
    btn.disabled = true;
    try {
      await API.post('/repairs/laptops', {
        barcode:      f['lap-barcode'].value.trim(),
        brand:        f['lap-brand'].value.trim(),
        model:        f['lap-model'].value.trim(),
        serialNumber: f['lap-serial'].value.trim(),
        ownerName:    f['lap-owner'].value.trim(),
        ownerContact: f['lap-contact'].value.trim(),
      });
      f.reset();
      Toast.show('Laptop registered!', 'success');
      await load();
    } catch (err) { Toast.show(err.message, 'error'); }
    btn.disabled = false;
  });

  // ── Report modal ───────────────────────────────────────────
  function openReportModal(laptopId, label) {
    document.getElementById('rep-modal-title').textContent = label;
    document.getElementById('rep-laptop-id').value = laptopId;
    document.getElementById('rep-modal').classList.add('open');
  }
  function closeReportModal() {
    document.getElementById('rep-modal').classList.remove('open');
    document.getElementById('rep-form').reset();
  }
  document.getElementById('rep-modal-close')?.addEventListener('click', closeReportModal);

  document.getElementById('rep-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f   = e.target;
    const btn = f.querySelector('button[type=submit]');
    btn.disabled = true;
    try {
      const partsRaw  = f['rep-parts'].value.trim();
      const partsUsed = partsRaw
        ? partsRaw.split('\n').map((line) => {
            const [partName, qty, cost] = line.split(',').map((s) => s.trim());
            return { partName, quantity: Number(qty) || 1, cost: Number(cost) || 0 };
          })
        : [];

      await API.post('/repairs/reports', {
        laptop:             document.getElementById('rep-laptop-sel').value || f['rep-laptop-id'].value,
        problemDescription: f['rep-problem'].value,
        actionsTaken:       f['rep-actions'].value,
        partsUsed,
        laborCost:  Number(f['rep-labor'].value) || 0,
        status:     f['rep-status'].value,
        remarks:    f['rep-remarks'].value,
      });
      closeReportModal();
      Toast.show('Repair report filed!', 'success');
      await load();
    } catch (err) { Toast.show(err.message, 'error'); }
    btn.disabled = false;
  });

  async function deleteLaptop(id) {
    if (!confirm('Delete this laptop and ALL its repair reports?')) return;
    try {
      await API.delete(`/repairs/laptops/${id}`);
      Toast.show('Deleted', 'info');
      await load();
    } catch (err) { Toast.show(err.message, 'error'); }
  }

  return { load, openReportModal, deleteLaptop };
})();
