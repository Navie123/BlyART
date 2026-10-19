/**
 * dashboard.js — loads overview stats for the home page.
 */
const Dashboard = (() => {
  async function load() {
    try {
      const [ojtSum, laptopRes, dailyRes] = await Promise.all([
        API.get('/ojt/summary'),
        API.get('/repairs/laptops'),
        API.get('/repairs/daily'),
      ]);

      document.getElementById('dash-ojt-hours').textContent  = ojtSum.data.totalHours;
      document.getElementById('dash-ojt-shifts').textContent = ojtSum.data.totalShifts;
      document.getElementById('dash-laptops').textContent    = laptopRes.count;
      document.getElementById('dash-daily-jobs').textContent = dailyRes.count;
      document.getElementById('dash-revenue').textContent    = '₱' + dailyRes.totalRevenue;

      // Recent laptops
      const tbody = document.getElementById('dash-recent-tbody');
      const recent = laptopRes.data.slice(0, 5);
      if (!recent.length) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-muted">No laptops yet.</td></tr>';
        return;
      }
      tbody.innerHTML = recent.map((l) => `
        <tr>
          <td><code>${l.barcode}</code></td>
          <td>${l.brand} ${l.model}</td>
          <td>${l.ownerName || '—'}</td>
          <td><span class="badge badge-${l.status}">${l.status}</span></td>
        </tr>`).join('');
    } catch (e) { console.error('Dashboard load error:', e); }
  }

  return { load };
})();
