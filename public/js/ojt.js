/**
 * ojt.js — OJT shift tracker page logic.
 */
const OjtPage = (() => {
  async function load() {
    await Promise.all([loadSummary(), loadShifts()]);
  }

  async function loadSummary() {
    try {
      const res = await API.get('/ojt/summary');
      document.getElementById('ojt-total-hours').textContent  = res.data.totalHours;
      document.getElementById('ojt-total-shifts').textContent = res.data.totalShifts;
    } catch (e) { console.error(e); }
  }

  async function loadShifts() {
    const tbody = document.getElementById('ojt-tbody');
    tbody.innerHTML = '<tr><td colspan="6" class="text-muted">Loading…</td></tr>';
    try {
      const res  = await API.get('/ojt');
      if (!res.data.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-muted">No shifts yet.</td></tr>';
        return;
      }
      tbody.innerHTML = res.data.map((s) => `
        <tr>
          <td>${fmtDate(s.date)}</td>
          <td>${s.timeIn}</td>
          <td>${s.timeOut || '<span class="text-muted">—</span>'}</td>
          <td>${s.hoursRendered} hrs</td>
          <td>${s.reportSlipNo || '—'}</td>
          <td>
            ${!s.timeOut ? `<button class="btn btn-ghost btn-sm" onclick="OjtPage.openTimeout('${s._id}')">Set Time-Out</button>` : ''}
            <button class="btn btn-danger btn-sm" onclick="OjtPage.deleteShift('${s._id}')">Del</button>
          </td>
        </tr>`).join('');
    } catch (e) { tbody.innerHTML = `<tr><td colspan="6" class="text-danger">${e.message}</td></tr>`; }
  }

  // Add shift form
  document.getElementById('ojt-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f   = e.target;
    const btn = f.querySelector('button[type=submit]');
    btn.disabled = true;
    try {
      await API.post('/ojt', {
        date:         f['ojt-date'].value,
        timeIn:       f['ojt-timein'].value,
        reportSlipNo: f['ojt-slip'].value,
        remarks:      f['ojt-remarks'].value,
      });
      f.reset();
      Toast.show('Shift logged!', 'success');
      await load();
    } catch (err) { Toast.show(err.message, 'error'); }
    btn.disabled = false;
  });

  async function openTimeout(id) {
    const time = prompt('Enter time-out (HH:MM in 24-hour format):');
    if (!time) return;
    try {
      await API.put(`/ojt/${id}`, { timeOut: time });
      Toast.show('Time-out saved!', 'success');
      await load();
    } catch (err) { Toast.show(err.message, 'error'); }
  }

  async function deleteShift(id) {
    if (!confirm('Delete this shift?')) return;
    try {
      await API.delete(`/ojt/${id}`);
      Toast.show('Shift deleted', 'info');
      await load();
    } catch (err) { Toast.show(err.message, 'error'); }
  }

  function fmtDate(iso) {
    return new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  return { load, openTimeout, deleteShift };
})();
