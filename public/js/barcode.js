/**
 * barcode.js — barcode generation (JsBarcode) + camera scan (html5-qrcode).
 */
const BarcodePage = (() => {
  let scannerRunning = false;
  let html5QrCode   = null;

  function init() {
    // Nothing to auto-load; user triggers actions.
  }

  // ── Generate ───────────────────────────────────────────────
  document.getElementById('barcode-gen-btn')?.addEventListener('click', () => {
    const val = document.getElementById('barcode-input').value.trim();
    if (!val) { Toast.show('Enter a barcode value first', 'error'); return; }
    try {
      JsBarcode('#barcode-svg', val, {
        format:      'CODE128',
        width:       2,
        height:      80,
        displayValue: true,
        background:  '#fff',
        lineColor:   '#000',
        fontSize:    14,
      });
      document.getElementById('barcode-output').classList.remove('hidden');
    } catch (e) { Toast.show('Invalid barcode value', 'error'); }
  });

  document.getElementById('barcode-print-btn')?.addEventListener('click', () => {
    const svg   = document.getElementById('barcode-svg');
    const win   = window.open('', '_blank');
    win.document.write(`<html><body style="text-align:center;padding:20px;">${svg.outerHTML}<br><script>window.print();<\/script></body></html>`);
    win.document.close();
  });

  // ── Scan ───────────────────────────────────────────────────
  document.getElementById('scan-start-btn')?.addEventListener('click', async () => {
    if (scannerRunning) return;
    html5QrCode   = new Html5Qrcode('scanner-container');
    scannerRunning = true;
    document.getElementById('scan-start-btn').classList.add('hidden');
    document.getElementById('scan-stop-btn').classList.remove('hidden');

    await html5QrCode.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      async (decodedText) => {
        await stopScanner();
        document.getElementById('scan-result').textContent = decodedText;
        document.getElementById('scan-result-box').classList.remove('hidden');
        // Auto-lookup in repair database
        try {
          const res = await API.get(`/repairs/laptops/barcode/${encodeURIComponent(decodedText)}`);
          const l   = res.data;
          document.getElementById('scan-laptop-info').innerHTML = `
            <strong>${l.brand} ${l.model}</strong><br>
            Owner: ${l.ownerName || '—'} · ${l.ownerContact || '—'}<br>
            Serial: ${l.serialNumber || '—'}<br>
            Status: <span class="badge badge-${l.status}">${l.status}</span>
          `;
        } catch {
          document.getElementById('scan-laptop-info').innerHTML = '<span class="text-muted">Not found in database.</span>';
        }
      },
      () => {} // ignore per-frame errors
    );
  });

  document.getElementById('scan-stop-btn')?.addEventListener('click', stopScanner);

  async function stopScanner() {
    if (!scannerRunning || !html5QrCode) return;
    await html5QrCode.stop();
    html5QrCode.clear();
    scannerRunning = false;
    document.getElementById('scan-start-btn').classList.remove('hidden');
    document.getElementById('scan-stop-btn').classList.add('hidden');
  }

  return { init };
})();
