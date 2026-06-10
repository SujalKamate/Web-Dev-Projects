(function () {
  /* ---- Elements ---- */
  var telIntegrity = document.getElementById('telIntegrity');
  var telEngine = document.getElementById('telEngine');
  var telTime = document.getElementById('telTime');
  var dOS = document.getElementById('dOS');
  var dBrowser = document.getElementById('dBrowser');
  var dCPU = document.getElementById('dCPU');
  var dScreen = document.getElementById('dScreen');
  var dViewport = document.getElementById('dViewport');
  var dDPR = document.getElementById('dDPR');
  var dColor = document.getElementById('dColor');
  var dOrientation = document.getElementById('dOrientation');
  var bLevel = document.getElementById('bLevel');
  var bFill = document.getElementById('bFill');
  var bCharging = document.getElementById('bCharging');
  var bDischarge = document.getElementById('bDischarge');
  var dNetType = document.getElementById('dNetType');
  var dNetSpeed = document.getElementById('dNetSpeed');
  var dArch = document.getElementById('dArch');
  var refreshBtn = document.getElementById('refreshBtn');
  var copyBtn = document.getElementById('copyBtn');
  var toast = document.getElementById('toast');

  /* ---- Clock ---- */
  function updateClock() {
    telTime.textContent = new Date().toLocaleTimeString();
  }

  /* ---- UA parsing ---- */
  function parseOS(ua) {
    ua = ua.toLowerCase();
    if (ua.indexOf('windows nt 10') !== -1) return 'Windows 10/11';
    if (ua.indexOf('windows nt 6.3') !== -1) return 'Windows 8.1';
    if (ua.indexOf('windows nt 6.1') !== -1) return 'Windows 7';
    if (ua.indexOf('windows') !== -1) return 'Windows';
    if (ua.indexOf('mac os x') !== -1) {
      var m = ua.match(/mac os x ([\d_]+)/);
      return 'macOS ' + (m ? m[1].replace(/_/g, '.') : '');
    }
    if (ua.indexOf('android') !== -1) return 'Android';
    if (ua.indexOf('linux') !== -1) return 'Linux';
    if (ua.indexOf('iphone') !== -1 || ua.indexOf('ipad') !== -1) return 'iOS';
    return 'Unknown';
  }

  function parseBrowser(ua) {
    ua = ua.toLowerCase();
    if (ua.indexOf('edg/') !== -1 || ua.indexOf('edge/') !== -1) return 'Edge';
    if (ua.indexOf('opr/') !== -1 || ua.indexOf('opera') !== -1) return 'Opera';
    if (ua.indexOf('chrome/') !== -1 && ua.indexOf('safari') !== -1) return 'Chrome';
    if (ua.indexOf('firefox/') !== -1) return 'Firefox';
    if (ua.indexOf('safari/') !== -1 && ua.indexOf('chrome') === -1) return 'Safari';
    return 'Unknown';
  }

  function getEngine() {
    var ua = navigator.userAgent.toLowerCase();
    if (ua.indexOf('edg/') !== -1) return 'EdgeHTML/Blink';
    if (ua.indexOf('chrome/') !== -1) return 'Blink/V8';
    if (ua.indexOf('firefox/') !== -1) return 'Gecko/SpiderMonkey';
    if (ua.indexOf('safari/') !== -1 && ua.indexOf('chrome') === -1) return 'WebKit/JavaScriptCore';
    return 'Unknown';
  }

  function getArch() {
    var ua = navigator.userAgent.toLowerCase();
    if (ua.indexOf('x64') !== -1 || ua.indexOf('wow64') !== -1) return 'x86-64';
    if (ua.indexOf('arm64') !== -1 || ua.indexOf('aarch64') !== -1) return 'ARM64';
    if (ua.indexOf('arm') !== -1) return 'ARM';
    if (navigator.platform) {
      if (navigator.platform.indexOf('Win64') !== -1) return 'x86-64';
      if (navigator.platform.indexOf('Win32') !== -1) return 'x86';
    }
    return 'Unknown';
  }

  /* ---- Screen ---- */
  function updateScreen() {
    dScreen.textContent = screen.width + '\u00D7' + screen.height;
    dViewport.textContent = window.innerWidth + '\u00D7' + window.innerHeight;
    dDPR.textContent = window.devicePixelRatio.toFixed(2);
    dColor.textContent = screen.colorDepth + '-bit';
    var orient = screen.orientation ? screen.orientation.type : (window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');
    dOrientation.textContent = orient;
  }

  /* ---- Battery ---- */
  function setupBattery() {
    if (!navigator.getBattery) {
      bLevel.textContent = 'N/A'; bFill.style.width = '0%';
      bCharging.textContent = 'API unavailable'; return;
    }
    navigator.getBattery().then(function (bat) {
      function update() {
        var lvl = Math.round(bat.level * 100);
        bLevel.textContent = lvl + '%';
        bFill.style.width = lvl + '%';
        bFill.style.background = lvl < 20 ? '#ef4444' : lvl < 50 ? '#f59e0b' : '#10b981';
        bCharging.textContent = bat.charging ? '\u26A1 Charging' : '\uD83D\uDD0B Discharging';
        bDischarge.textContent = bat.charging
          ? (bat.chargingTime === Infinity ? 'calculating\u2026' : Math.round(bat.chargingTime / 60) + ' min to full')
          : (bat.dischargingTime === Infinity ? 'not discharging' : Math.round(bat.dischargingTime / 60) + ' min remaining');
      }
      update();
      bat.addEventListener('chargingchange', update);
      bat.addEventListener('levelchange', update);
    });
  }

  /* ---- Network ---- */
  function updateNetwork() {
    var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn) {
      dNetType.textContent = conn.effectiveType ? conn.effectiveType.toUpperCase() : 'Unknown';
      dNetSpeed.textContent = (conn.downlink || '?') + ' Mbps';
      conn.addEventListener('change', function () {
        dNetType.textContent = conn.effectiveType ? conn.effectiveType.toUpperCase() : 'Unknown';
        dNetSpeed.textContent = (conn.downlink || '?') + ' Mbps';
      });
    } else {
      dNetType.textContent = 'API unavailable';
      dNetSpeed.textContent = '';
    }
  }

  /* ---- Full probe ---- */
  function probe() {
    var ua = navigator.userAgent;
    dOS.textContent = parseOS(ua);
    dBrowser.textContent = parseBrowser(ua);
    dCPU.textContent = (navigator.hardwareConcurrency || '?') + ' logical cores';
    dArch.textContent = getArch();
    telEngine.textContent = getEngine();
    updateScreen();
    updateNetwork();
    updateClock();
    telIntegrity.textContent = 'Nominal';
    telIntegrity.className = 'tel-value status-ok';
  }

  /* ---- Copy JSON ---- */
  function copyDigest() {
    var digest = {
      os: dOS.textContent,
      browser: dBrowser.textContent,
      engine: telEngine.textContent,
      cpu: dCPU.textContent,
      architecture: dArch.textContent,
      screen: dScreen.textContent,
      viewport: dViewport.textContent,
      pixelRatio: dDPR.textContent,
      colorDepth: dColor.textContent,
      orientation: dOrientation.textContent,
      battery: bLevel.textContent,
      charging: bCharging.textContent,
      networkType: dNetType.textContent,
      networkSpeed: dNetSpeed.textContent,
      timestamp: new Date().toISOString(),
    };

    var text = JSON.stringify(digest, null, 2);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        showToast('\u2705 Diagnostic JSON copied to clipboard');
      }).catch(function () {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); showToast('\u2705 Diagnostic JSON copied to clipboard'); } catch (e) { showToast('\u274C Failed to copy'); }
    document.body.removeChild(ta);
  }

  function showToast(msg) {
    toast.textContent = msg;
    toast.className = 'show';
    setTimeout(function () { toast.className = 'hidden'; }, 2500);
  }

  /* ---- Events ---- */
  window.addEventListener('resize', function () {
    updateScreen();
    /* subtle flash: add/remove a class */
    dViewport.style.transition = 'color 0.15s';
    dViewport.style.color = '#ff2a5f';
    setTimeout(function () { dViewport.style.color = ''; }, 200);
  });

  window.addEventListener('orientationchange', function () {
    setTimeout(updateScreen, 300);
  });

  refreshBtn.addEventListener('click', function () {
    probe();
    setupBattery();
  });

  copyBtn.addEventListener('click', copyDigest);

  /* ---- Boot ---- */
  probe();
  setupBattery();
  setInterval(updateClock, 1000);
})();
