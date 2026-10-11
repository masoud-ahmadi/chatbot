/*! Coco Chat Widget v1.0.0
 *  Single file, zero dependencies, isolated inside a Shadow DOM.
 *  Install:  <script src="https://example.com/coco-chat.js" data-agent="AGENT_ID"></script>
 *
 *  Layers (top to bottom of this file):
 *   1. Utils            2. Config           3. Store (state machine)
 *   4. Api (+Mock/Http adapters)             5. MessageManager
 *   6. StreamManager    7. ScenarioManager   8. NetworkManager / EventManager
 *   9. UI               10. Widget (lifecycle + orchestration)   11. Public API
 */
(function () {
  'use strict';

  var SCRIPT = document.currentScript;
  if (window.CocoChat && window.CocoChat.__coco) return;
  var VERSION = '1.0.0';

  /* =====================================================================
   * 1. UTILS
   * ===================================================================== */
  var T = {
    brand: 'کوکو چت',
    welcomeTitle: 'به کوکو چت خوش آمدید',
    welcomeSub: 'برای شروع گفتگو با دستیار هوشمند، اطلاعات خود را وارد کنید.',
    name: 'نام و نام خانوادگی',
    namePh: 'مثلاً علی رضایی',
    mobile: 'شماره موبایل',
    mobilePh: '09123456789',
    getCode: 'دریافت کد',
    otpTitle: 'کد تأیید',
    otpSub: 'کدی که برای شماره‌ی',
    otpSub2: 'ارسال شد را وارد کنید.',
    verify: 'تأیید',
    resend: 'ارسال مجدد کد',
    resendIn: 'ارسال مجدد تا',
    editNumber: 'ویرایش شماره',
    sec: 'ثانیه',
    mockHint: 'نسخه آزمایشی: کد تأیید ۱۲۳۴۵۶ است.',
    bootText: 'در حال آماده‌سازی…',
    retry: 'تلاش مجدد',
    expiredTitle: 'نشست شما به پایان رسید',
    expiredSub: 'برای ادامه‌ی گفتگو دوباره وارد شوید.',
    loginAgain: 'ورود دوباره',
    msgPh: 'پیام خود را بنویسید…',
    editPh: 'ویرایش پیام…',
    offPh: 'خارج از ساعت کاری',
    netPh: 'در انتظار اتصال…',
    you: 'شما',
    replyTo: 'پاسخ به',
    editing: 'ویرایش پیام',
    cancel: 'انصراف',
    close: 'بستن',
    profile: 'اطلاعات و ارتباط با ما',
    profileBack: 'بازگشت به گفتگو',
    profileMessage: 'ارسال پیام',
    profileCall: 'تماس با ما',
    profileWebsite: 'وب‌سایت',
    profileAbout: 'درباره ما',
    profileContact: 'اطلاعات تماس',
    profilePhone: 'شماره تماس',
    profileEmail: 'ایمیل',
    profileHours: 'ساعت پاسخ‌گویی',
    profileAddress: 'آدرس',
    profileMissing: 'هنوز ثبت نشده',
    open: 'گفتگو با ما',
    reply: 'پاسخ',
    copy: 'کپی',
    edit: 'ویرایش',
    edited: 'ویرایش‌شده',
    copied: 'کپی شد',
    emoji: 'ایموجی',
    send: 'ارسال',
    stop: 'توقف',
    today: 'امروز',
    yesterday: 'دیروز',
    scrollDown: 'رفتن به آخرین پیام',
    online: 'آنلاین',
    thinking: 'در حال فکر کردن…',
    reading: 'در حال مطالعه…',
    writing: 'در حال نوشتن…',
    offHours: 'خارج از ساعت کاری',
    sendFail: 'ارسال ناموفق',
    reconnecting: 'در حال اتصال…',
    waitNet: 'در انتظار شبکه…',
    connected: 'اتصال برقرار شد',
    viewChat: 'مشاهده گفتگو',
    stopped: 'پاسخ متوقف شد',
    nameErr: 'نام کامل را وارد کنید.',
    mobileErr: 'شماره معتبر نیست.',
    otpIncomplete: 'کد تأیید را کامل وارد کنید.',
    e_otp_invalid: 'کد واردشده درست نیست. دوباره بررسی کنید.',
    e_otp_expired: 'کد منقضی شده است. کد جدید دریافت کنید.',
    e_rate_limited: 'تعداد درخواست‌ها زیاد است. کمی بعد دوباره تلاش کنید.',
    e_network: 'ارتباط با اینترنت برقرار نیست.',
    e_session_expired: 'نشست شما به پایان رسیده است.',
    e_send_failed: 'پیام ارسال نشد. دوباره تلاش کنید.',
    e_edit_failed: 'ویرایش پیام انجام نشد.',
    e_invalid_response: 'پاسخ نامعتبر از سرویس دریافت شد.',
    e_not_configured: 'سرویس هنوز پیکربندی نشده است.',
    e_unknown: 'مشکلی پیش آمد. لطفاً دوباره تلاش کنید.',
  };

  var FA = '۰۱۲۳۴۵۶۷۸۹',
    AR = '٠١٢٣٤٥٦٧٨٩';
  function latin(s) {
    return String(s)
      .replace(/[۰-۹]/g, function (d) {
        return FA.indexOf(d);
      })
      .replace(/[٠-٩]/g, function (d) {
        return AR.indexOf(d);
      });
  }
  function mkFmt(o) {
    try {
      return new Intl.DateTimeFormat('fa-IR', o);
    } catch (e) {
      return new Intl.DateTimeFormat(undefined, o);
    }
  }
  var timeFmt = mkFmt({ hour: '2-digit', minute: '2-digit' });
  var dateFmt = mkFmt({ year: 'numeric', month: 'long', day: 'numeric' });
  function dayKey(ts) {
    return new Date(ts).toDateString();
  }
  function dayLabel(ts) {
    var d = new Date(ts),
      n = new Date();
    if (dayKey(d) === dayKey(n)) return T.today;
    if (dayKey(d) === dayKey(n.getTime() - 864e5)) return T.yesterday;
    return dateFmt.format(d);
  }
  function uid() {
    return Math.random().toString(36).slice(2, 10);
  }
  function safeUrl(u, base, allowData) {
    if (!u || typeof u !== 'string') return null;
    if (allowData && /^data:image\/(png|jpe?g|gif|webp|svg\+xml)[;,]/i.test(u))
      return u;
    try {
      var x = new URL(u, base || location.href);
      return x.protocol === 'https:' || x.protocol === 'http:' ? x.href : null;
    } catch (e) {
      return null;
    }
  }
  function normalizeMobile(raw) {
    var s = latin(raw).replace(/[\s\-()]/g, '');
    if (/^\+98/.test(s)) s = '0' + s.slice(3);
    else if (/^0098/.test(s)) s = '0' + s.slice(4);
    else if (/^98\d{10}$/.test(s)) s = '0' + s.slice(2);
    else if (/^9\d{9}$/.test(s)) s = '0' + s;
    return s;
  }

  // Agent details may be nested under profile or supplied directly by the backend.
  function readAgentProfile(agent) {
    agent = agent || {};
    var source =
      agent.profile && typeof agent.profile === 'object'
        ? agent.profile
        : agent;
    var limits = {
      description: 600,
      phone: 50,
      email: 160,
      website: 500,
      businessHours: 200,
      address: 300,
    };
    var profile = {};
    Object.keys(limits).forEach(function (key) {
      profile[key] =
        typeof source[key] === 'string'
          ? source[key].trim().slice(0, limits[key])
          : '';
    });
    return profile;
  }

  var SVG_NS = { tpl: null };
  var ICONS = {
    chat: 'M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z',
    close:
      'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
    send: 'M2.01 21L23 12 2.01 3 2 10l15 2-15 2z',
    stop: 'M7 7h10v10H7z',
    smile:
      'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z',
    reply: 'M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z',
    edit: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
    copy: 'M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z',
    check: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
    checks:
      'M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z',
    clock:
      'M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z',
    alert: 'M12 2L1 21h22L12 2zm1 15h-2v-2h2v2zm0-4h-2V9h2v4z',
    retry:
      'M17.65 6.35A7.96 7.96 0 0012 4a8 8 0 108 8h-2a6 6 0 11-1.76-4.24L13 11h7V4l-2.35 2.35z',
    down: 'M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z',
    more: 'M12 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm0 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
    chatBack: 'M4 11h12.17l-5.59-5.59L12 4l8 8-8 8-1.41-1.41L16.17 13H4v-2z',
    phone:
      'M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1C10.61 21 3 13.39 3 4c0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z',
    mail: 'M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z',
    globe:
      'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.92 6h-3.04a15.65 15.65 0 0 0-1.38-3.56A8.03 8.03 0 0 1 18.92 8zM12 4c.83 1.2 1.46 2.54 1.86 4h-3.72A13.58 13.58 0 0 1 12 4zM4.26 10h3.92a16.56 16.56 0 0 0 0 4H4.26a8.12 8.12 0 0 1 0-4zM5.08 16h3.04c.3 1.26.77 2.46 1.38 3.56A8.03 8.03 0 0 1 5.08 16zm3.04-8H5.08A8.03 8.03 0 0 1 9.5 4.44 15.65 15.65 0 0 0 8.12 8zM12 20a13.58 13.58 0 0 1-1.86-4h3.72A13.58 13.58 0 0 1 12 20zm2.28-6H9.72a14.64 14.64 0 0 1 0-4h4.56a14.64 14.64 0 0 1 0 4zm.22 5.56A15.65 15.65 0 0 0 15.88 16h3.04a8.03 8.03 0 0 1-4.42 3.56zM15.82 14a16.56 16.56 0 0 0 0-4h3.92a8.12 8.12 0 0 1 0 4h-3.92z',
    location:
      'M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z',
    back: 'M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z',
  };
  /* Icons are static, trusted constants (never user data). */
  function icon(name, cls) {
    if (!SVG_NS.tpl) SVG_NS.tpl = document.createElement('template');
    SVG_NS.tpl.innerHTML =
      '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false" fill="currentColor"><path d="' +
      ICONS[name] +
      '"/></svg>';
    var el = SVG_NS.tpl.content.firstChild;
    if (cls) el.setAttribute('class', cls);
    return el;
  }

  /* Tiny, safe DOM builder: text always goes through text nodes. */
  function h(tag, props) {
    var el = document.createElement(tag);
    if (props) {
      for (var k in props) {
        var v = props[k];
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'text') el.textContent = v;
        else if (k === 'on') {
          for (var ev in v) el.addEventListener(ev, v[ev]);
        } else if (k === 'value' || k === 'disabled' || k === 'hidden')
          el[k] = v;
        else el.setAttribute(k, v === true ? '' : v);
      }
    }
    for (var i = 2; i < arguments.length; i++) append(el, arguments[i]);
    return el;
  }
  function append(el, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) {
      c.forEach(function (x) {
        append(el, x);
      });
      return;
    }
    el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  function Emitter() {
    this._h = {};
  }
  Emitter.prototype.on = function (t, fn) {
    var self = this;
    (this._h[t] = this._h[t] || []).push(fn);
    return function () {
      self._h[t] = (self._h[t] || []).filter(function (f) {
        return f !== fn;
      });
    };
  };
  Emitter.prototype.emit = function (t) {
    var a = [].slice.call(arguments, 1);
    (this._h[t] || []).slice().forEach(function (fn) {
      try {
        fn.apply(null, a);
      } catch (e) {
        console.error('[CocoChat]', e);
      }
    });
  };
  Emitter.prototype.clear = function () {
    this._h = {};
  };

  function ApiError(code, message, status) {
    var e = new Error(message || code);
    e.name = 'ApiError';
    e.code = code;
    e.status = status || 0;
    return e;
  }
  function friendly(err) {
    var c = err && err.code;
    if (c && T['e_' + c]) return T['e_' + c];
    return T.e_unknown;
  }

  /* =====================================================================
   * 2. CONFIG
   * ===================================================================== */
  var COCO_POSITIONS = [
    'bottom-left',
    'bottom-right',
    'middle-left',
    'middle-right',
    'top-left',
    'top-right',
  ];

  function normalizePosition(value) {
    var p = String(value == null ? '' : value)
      .trim()
      .toLowerCase();

    // پشتیبانی از تنظیمات قدیمی
    if (p === 'left') return 'bottom-left';
    if (p === 'right') return 'bottom-right';

    return COCO_POSITIONS.indexOf(p) >= 0 ? p : null;
  }

  function parseOffset(value) {
    if (typeof value === 'number') {
      return isFinite(value) && value >= 0 ? value : null;
    }

    if (value == null) return null;

    var match = String(value)
      .trim()
      .match(/^(\d+(?:\.\d+)?|\.\d+)(?:px)?$/i);

    if (!match) return null;

    var n = Number(match[1]);

    return isFinite(n) && n >= 0 ? n : null;
  }

  function readConfig(o) {
    o = o || {};

    var ds = (SCRIPT && SCRIPT.dataset) || {};
    var base = '';

    try {
      if (SCRIPT && SCRIPT.src) {
        base = new URL(SCRIPT.src, location.href).href.replace(/[^/]*$/, '');
      }
    } catch (e) {
      /* noop */
    }

    var apiBase = o.apiBaseUrl || ds.apiBase || '';

    var mockFlag = o.mock !== undefined ? o.mock : ds.mock;

    var accent = o.accent || ds.accent;

    if (typeof accent !== 'string' || !/^#[0-9a-f]{6}$/i.test(accent)) {
      accent = null;
    }

    var text = o.text || ds.text;

    if (typeof text !== 'string' || !/^#[0-9a-f]{6}$/i.test(text)) {
      text = null;
    }

    var rawPosition =
      o.position != null && o.position !== '' ? o.position : ds.position;

    var position = normalizePosition(rawPosition) || 'bottom-left';

    var rawOffsetX = o.offsetX !== undefined ? o.offsetX : ds.offsetX;

    var rawOffsetY = o.offsetY !== undefined ? o.offsetY : ds.offsetY;

    var rawMobileOffsetY =
      o.mobileOffsetY !== undefined ? o.mobileOffsetY : ds.mobileOffsetY;

    var offsetX = parseOffset(rawOffsetX);
    var offsetY = parseOffset(rawOffsetY);
    var mobileOffsetY = parseOffset(rawMobileOffsetY);

    // حفظ رفتار پیش‌فرض نسخه قبلی
    if (offsetX == null) offsetX = 20;
    if (offsetY == null) offsetY = 20;

    var theme = o.theme || ds.theme || 'auto';

    if (['light', 'dark', 'auto'].indexOf(theme) < 0) {
      theme = 'auto';
    }

    var useMock =
      mockFlag === undefined || mockFlag === ''
        ? !apiBase
        : mockFlag !== false && mockFlag !== 'false';

    return {
      agent: o.agent || ds.agent || (useMock ? 'demo-agent' : ''),

      apiBaseUrl: apiBase.replace(/\/+$/, ''),
      assetsBase: o.assetsBase || ds.assetsBase || base,

      theme: theme,
      launcher:
        (o.launcher !== undefined ? o.launcher : ds.launcher) === 'hidden'
          ? 'hidden'
          : 'visible',

      position: position,
      offsetX: offsetX,
      offsetY: offsetY,
      mobileOffsetY: mobileOffsetY,

      accent: accent,
      text: text,

      open: o.open !== undefined ? !!o.open : ds.open === 'true',

      mock: useMock
        ? typeof mockFlag === 'object' && mockFlag
          ? mockFlag
          : {}
        : null,

      waitingAfterMs: o.waitingAfterMs || 45000,
      chatLoadingMinMs: o.chatLoadingMinMs || 2200,
      maxLength:
        typeof o.maxLength === 'number' &&
        Number.isInteger(o.maxLength) &&
        o.maxLength > 0
          ? o.maxLength
          : 2000,
    };
  }

  /* =====================================================================
   * 3. STORE  (single source of truth for widget state)
   * ===================================================================== */
  var STATES = [
    'INITIALIZING',
    'LOGIN',
    'OTP',
    'AUTHENTICATING',
    'BOOTSTRAPPING',
    'CHAT_LOADING',
    'READY',
    'THINKING',
    'READING',
    'STREAMING',
    'WAITING',
    'SEND_ERROR',
    'NETWORK_ERROR',
    'OFF_HOURS',
    'SESSION_EXPIRED',
  ];
  var CHAT_STATES = [
    'CHAT_LOADING',
    'READY',
    'THINKING',
    'READING',
    'STREAMING',
    'WAITING',
    'SEND_ERROR',
    'NETWORK_ERROR',
    'OFF_HOURS',
  ];
  var BUSY_STATES = ['THINKING', 'READING', 'STREAMING'];

  function Store() {
    Emitter.call(this);
    this.state = 'INITIALIZING';
    this.data = {
      name: '',
      mobile: '',
      user: null,
      agent: { name: T.brand, avatarUrl: null, status: T.online },
      settings: {},
      offHours: false,
    };
  }
  Store.prototype = Object.create(Emitter.prototype);
  Store.prototype.set = function (next) {
    if (STATES.indexOf(next) < 0 || next === this.state) return;
    var prev = this.state;
    this.state = next;
    this.emit('state', next, prev);
  };

  /* =====================================================================
   * 4. API LAYER
   *  The widget only talks to an "adapter" with this normalized contract:
   *    requestOtp({name,mobile})      -> {resendAfter, otpLength}
   *    verifyOtp({mobile,otp})        -> {token, user}
   *    bootstrap()                    -> {agent, settings, scenarios, history, offHours}
   *    chat({text,replyTo,clientId,retryOf,signal})  -> async iterator of events:
   *        {type:'ack', id}                     server id of the user's message
   *        {type:'phase', phase:'thinking'|'reading'}
   *        {type:'start', id}                   AI message begins
   *        {type:'chunk', text}                 streamed text
   *        {type:'done'}                        finished
   *        {type:'error', code, message}
   *    editMessage({id,text})         -> {ok:true}
   *  Swap MockAdapter for HttpAdapter when the real backend is ready:
   *  the UI and managers need no change.
   * ===================================================================== */
  function MockAdapter(cfg) {
    var mock = cfg.mock;
    mock.otp = mock.otp || '123456';
    mock.failNext = false;
    mock.failMidStream = false;
    mock.expireNext = false;
    var seq = 0;
    function sleep(ms, signal) {
      return new Promise(function (res, rej) {
        var t = setTimeout(res, ms);
        if (signal) {
          if (signal.aborted) {
            clearTimeout(t);
            return rej(new DOMException('Aborted', 'AbortError'));
          }
          signal.addEventListener(
            'abort',
            function () {
              clearTimeout(t);
              rej(new DOMException('Aborted', 'AbortError'));
            },
            { once: true }
          );
        }
      });
    }
    function avatar() {
      return (
        'data:image/svg+xml;utf8,' +
        encodeURIComponent(
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5cc4e8"/><stop offset="1" stop-color="' +
            (cfg.accent || cfg.resolvedAccent) +
            '"/></linearGradient></defs><circle cx="32" cy="32" r="32" fill="url(#g)"/><circle cx="24" cy="28" r="4" fill="#fff"/><circle cx="40" cy="28" r="4" fill="#fff"/><path d="M21 40q11 10 22 0" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/></svg>'
        )
      );
    }
    var replies = [
      'سلام! خوشحالم که اینجایید 😊 من دستیار هوشمند کوکو هستم. هر سؤالی دارید بپرسید، سعی می‌کنم سریع و دقیق کمکتان کنم.',
      'حتماً. برای اینکه بهتر راهنمایی‌تان کنم، چند نکته را مرور کردم:\n\nاول اینکه اطلاعات بیشتر در https://example.com/docs موجود است.\nدوم اینکه اگر مورد خاصی مدنظر دارید، دقیق‌تر بنویسید.\n\nمنتظر پیام بعدی شما هستم 🙌',
      'نکته‌ی جالبی بود! به نظرم بهترین مسیر این است که قدم‌به‌قدم جلو برویم. اگر خواستید، همین حالا شروع کنیم؟ 🧡',
      'متوجه شدم. این مورد معمولاً در چند مرحله انجام می‌شود و بعد از آن نتیجه را می‌بینید. اگر جزئیات بیشتری لازم دارید بفرمایید 😍',
    ];
    var history = [
      {
        id: 'srv_welcome',
        role: 'assistant',
        content:
          'سلام! من دستیار هوشمند کوکو هستم 👋\nچطور می‌توانم کمکتان کنم؟',
        timestamp: Date.now() - 60000,
      },
    ];
    return {
      requestOtp: function (p) {
        return sleep(700).then(function () {
          return { resendAfter: 60, otpLength: 6, name: p.name };
        });
      },
      verifyOtp: function (p) {
        return sleep(800).then(function () {
          if (latin(p.otp) !== mock.otp) throw ApiError('otp_invalid');
          return { token: 'mock-' + uid() + uid(), user: { mobile: p.mobile } };
        });
      },
      bootstrap: function () {
        return sleep(900).then(function () {
          var vids = mock.videos || {};
          var sc = {};
          [
            'chat-loading',
            'thinking',
            'reading',
            'off-hours',
            'waiting',
            'send-error',
            'network-error',
          ].forEach(function (k) {
            sc[k] = { videoUrl: vids[k] || null };
          });
          return {
            agent: {
              id: cfg.agent,
              name: 'کوکو',
              avatarUrl: avatar(),
              status: T.online,
              profile: Object.assign(
                {
                  description:
                    'کوکو، همراه شما برای پاسخ به سؤال‌ها و راهنمایی در گفتگو. این اطلاعات برای نمایش نمونه هستند.',
                  phone: '02100000000',
                  email: 'support@example.com',
                  website: 'https://example.com',
                  businessHours: 'شنبه تا چهارشنبه، ساعت ۹ تا ۱۸',
                  address: 'آدرس نمونه: تهران، خیابان نمونه، پلاک ۱',
                },
                mock.profile || {}
              ),
            },
            settings: { maxLength: 2000 },
            scenarios: sc,
            history: history,
            offHours: !!mock.offHours,
          };
        });
      },
      chat: function (p) {
        return (async function* () {
          await sleep(250, p.signal);
          if (mock.expireNext) {
            mock.expireNext = false;
            throw ApiError('session_expired', '', 401);
          }
          if (mock.failNext) {
            mock.failNext = false;
            throw ApiError('send_failed');
          }
          yield { type: 'ack', id: 'srv_u' + ++seq };
          yield { type: 'phase', phase: 'thinking' };
          await sleep(1600, p.signal);
          var text = /سلام/.test(p.text)
            ? replies[0]
            : replies[1 + (p.text.length % 3)];
          if (/\?|؟|چطور|چرا|کجا|چیست/.test(p.text)) {
            yield { type: 'phase', phase: 'reading' };
            await sleep(1800, p.signal);
          }
          yield { type: 'start', id: 'srv_a' + ++seq };
          var toks = text.match(/\S+\s*/g) || [text];
          for (var i = 0; i < toks.length; i++) {
            await sleep(30 + Math.random() * 70, p.signal);
            if (mock.failMidStream && i === 6) {
              mock.failMidStream = false;
              throw ApiError('send_failed');
            }
            yield { type: 'chunk', text: toks[i] };
          }
          yield { type: 'done' };
        })();
      },
      editMessage: function () {
        return sleep(450).then(function () {
          if (mock.failNext) {
            mock.failNext = false;
            throw ApiError('edit_failed');
          }
          return { ok: true };
        });
      },
    };
  }

  /* Real backend: fill the marked integration points. Nothing here is invented. */
  function HttpAdapter(cfg, ctx) {
    function nope() {
      return Promise.reject(ApiError('not_configured'));
    }
    return {
      // API integration point: API 1 -- send name + mobile, backend sends OTP
      requestOtp: nope,
      // API integration point: API 2 -- verify OTP, return token/session
      verifyOtp: nope,
      // API integration point: API 3 -- agent info, scenarios+video URLs, history, off-hours
      bootstrap: nope,
      // API integration point: API 4 -- send/reply + streaming. Map the backend stream
      // (SSE / NDJSON / WebSocket) to the normalized events documented above.
      chat: function () {
        return (async function* () {
          throw ApiError('not_configured');
        })();
      },
      // API integration point: API 4 -- edit message
      editMessage: nope,
    };
  }

  function ApiClient(cfg) {
    var token = null;
    var ctx = {
      token: function () {
        return token;
      },
    };
    var adapter = cfg.mock ? MockAdapter(cfg) : HttpAdapter(cfg, ctx);
    function wrap(p) {
      return Promise.resolve(p).catch(function (e) {
        if (e && e.name === 'ApiError') throw e;
        if (e && e.name === 'AbortError') throw e;
        throw ApiError(
          e instanceof TypeError ? 'network' : 'unknown',
          e && e.message
        );
      });
    }
    this.requestOtp = function (p) {
      return wrap(adapter.requestOtp(p));
    };
    this.verifyOtp = function (p) {
      return wrap(adapter.verifyOtp(p)).then(function (r) {
        if (!r || !r.token) throw ApiError('invalid_response');
        token = r.token;
        return { user: r.user || {} };
      });
    };
    this.bootstrap = function () {
      return wrap(adapter.bootstrap());
    };
    this.chat = function (p) {
      return adapter.chat(p);
    };
    this.editMessage = function (p) {
      return wrap(adapter.editMessage(p));
    };
    this.clear = function () {
      token = null;
    };
    this.hasSession = function () {
      return !!token;
    };
  }

  /* =====================================================================
   * 5. MESSAGE MANAGER
   * ===================================================================== */
  function MessageManager() {
    Emitter.call(this);
    this.list = [];
    this.map = {};
    this.seq = 0;
  }
  MessageManager.prototype = Object.create(Emitter.prototype);
  MessageManager.prototype.tmpId = function () {
    return 'tmp_' + Date.now().toString(36) + ++this.seq;
  };
  MessageManager.prototype.normalize = function (r) {
    var ts = r.timestamp ? new Date(r.timestamp).getTime() : Date.now();
    return {
      id: r.id != null ? String(r.id) : this.tmpId(),
      role:
        r.role === 'user'
          ? 'user'
          : r.role === 'system'
            ? 'system'
            : 'assistant',
      content: String(r.content == null ? '' : r.content),
      timestamp: isNaN(ts) ? Date.now() : ts,
      status: r.status || 'sent', // sending | sent | streaming | done | error
      replyTo: r.replyTo ? String(r.replyTo) : null,
      editable: r.editable != null ? !!r.editable : r.role === 'user',
      streaming: !!r.streaming,
      edited: !!r.edited,
      type: r.type || 'text',
      attachments: [],
      metadata: r.metadata || {},
    };
  };
  MessageManager.prototype.add = function (raw) {
    var m = this.normalize(raw);
    this.list.push(m);
    this.map[m.id] = m;
    this.emit('add', m);
    return m;
  };
  MessageManager.prototype.get = function (id) {
    return this.map[id] || null;
  };
  MessageManager.prototype.update = function (id, patch) {
    var m = this.get(id);
    if (!m) return null;
    for (var k in patch) m[k] = patch[k];
    this.emit('update', m);
    return m;
  };
  MessageManager.prototype.setStatus = function (id, status) {
    return this.update(id, { status: status });
  };
  MessageManager.prototype.edit = function (id, text) {
    return this.update(id, { content: text, edited: true });
  };
  MessageManager.prototype.replaceId = function (oldId, newId) {
    var m = this.get(oldId);
    if (!m || oldId === newId) return;
    delete this.map[oldId];
    m.id = String(newId);
    this.map[m.id] = m;
    this.list.forEach(function (x) {
      if (x.replyTo === oldId) x.replyTo = m.id;
    });
    this.emit('idchange', m, oldId);
  };
  MessageManager.prototype.remove = function (id) {
    var m = this.get(id);
    if (!m) return;
    this.list = this.list.filter(function (x) {
      return x !== m;
    });
    delete this.map[id];
    this.emit('remove', m);
  };
  MessageManager.prototype.appendStream = function (id, text) {
    var m = this.get(id);
    if (!m) return;
    m.content += text;
    this.emit('stream', m);
  };
  MessageManager.prototype.replySnippet = function (id) {
    var m = this.get(id);
    if (!m) return null;
    return {
      id: m.id,
      role: m.role,
      text: m.content.length > 140 ? m.content.slice(0, 140) + '…' : m.content,
    };
  };
  MessageManager.prototype.reset = function (history) {
    this.list = [];
    this.map = {};
    this.emit('reset');
    var self = this;
    (history || []).forEach(function (r) {
      self.add(r);
    });
  };

  /* =====================================================================
   * 6. STREAM MANAGER  (batches chunks to one DOM update per frame)
   * ===================================================================== */
  function StreamManager(api, mm) {
    this.api = api;
    this.mm = mm;
    this.ctrl = null;
    this.raf = 0;
    this.buf = '';
    this.aiId = null;
  }
  StreamManager.prototype.abort = function () {
    if (this.ctrl) this.ctrl.abort();
  };
  Object.defineProperty(StreamManager.prototype, 'active', {
    get: function () {
      return !!this.ctrl;
    },
  });
  StreamManager.prototype._flush = function () {
    this.raf = 0;
    if (this.aiId && this.buf) {
      var t = this.buf;
      this.buf = '';
      this.mm.appendStream(this.aiId, t);
    }
  };
  StreamManager.prototype._schedule = function () {
    var self = this;
    if (this.raf) return;
    var run = function () {
      self._flush();
    };
    this.raf =
      typeof requestAnimationFrame === 'function'
        ? requestAnimationFrame(run)
        : setTimeout(run, 32);
  };
  StreamManager.prototype._cancelRaf = function () {
    if (!this.raf) return;
    if (typeof cancelAnimationFrame === 'function')
      cancelAnimationFrame(this.raf);
    clearTimeout(this.raf);
    this.raf = 0;
  };
  /* Returns {status:'done'|'aborted'|'error', error, aiId} and never throws. */
  StreamManager.prototype.run = async function (params, hooks) {
    var self = this,
      mm = this.mm,
      ctrl = new AbortController();
    this.ctrl = ctrl;
    this.buf = '';
    this.aiId = null;
    function ensureStart(id) {
      if (self.aiId) return;
      self.aiId = id || mm.tmpId();
      mm.add({
        id: self.aiId,
        role: 'assistant',
        content: '',
        status: 'streaming',
        streaming: true,
        editable: false,
        metadata: { forUser: params.clientId },
      });
      hooks.onStart();
    }
    var result;
    try {
      var it = this.api.chat(
        Object.assign({}, params, { signal: ctrl.signal })
      );
      var finished = false;
      for await (var ev of it) {
        if (ctrl.signal.aborted) break;
        if (!ev || typeof ev !== 'object') throw ApiError('invalid_response');
        switch (ev.type) {
          case 'ack':
            hooks.onAck(ev);
            break;
          case 'phase':
            hooks.onPhase(ev.phase);
            break;
          case 'start':
            ensureStart(ev.id != null ? String(ev.id) : null);
            break;
          case 'chunk':
            ensureStart(null);
            this.buf += String(ev.text || '');
            this._schedule();
            break;
          case 'done':
            finished = true;
            break;
          case 'error':
            throw ApiError(ev.code || 'send_failed', ev.message);
          default:
            break;
        }
        if (finished) break;
      }
      this._cancelRaf();
      this._flush();
      if (ctrl.signal.aborted) throw new DOMException('Aborted', 'AbortError');
      if (!finished) throw ApiError('invalid_response');
      if (this.aiId) mm.update(this.aiId, { streaming: false, status: 'done' });
      result = { status: 'done', aiId: this.aiId };
    } catch (e) {
      this._cancelRaf();
      this._flush();
      if (e && e.name === 'AbortError') {
        if (this.aiId)
          mm.update(this.aiId, {
            streaming: false,
            status: 'done',
            metadata: Object.assign({}, mm.get(this.aiId).metadata, {
              stopped: true,
            }),
          });
        result = { status: 'aborted', aiId: this.aiId };
      } else {
        if (this.aiId)
          mm.update(this.aiId, { streaming: false, status: 'error' });
        result = {
          status: 'error',
          error:
            e && e.name === 'ApiError'
              ? e
              : ApiError(e instanceof TypeError ? 'network' : 'send_failed'),
          aiId: this.aiId,
        };
      }
    } finally {
      this.ctrl = null;
    }
    return result;
  };

  /* =====================================================================
   * 7. SCENARIO MANAGER  (inline status cards + backend-driven video)
   * ===================================================================== */
  var SCENARIO_DEFAULTS = {
    'chat-loading': {
      variant: 'full',
      emoji: '✨',
      text: 'در حال آماده‌سازی گفتگو…',
    },
    thinking: { variant: 'float', emoji: '🤔', text: 'دارم فکر می‌کنم…' },
    reading: { variant: 'float', emoji: '📖', text: 'در حال مطالعه‌ی منابع…' },
    'off-hours': {
      variant: 'full',
      emoji: '🌙',
      text: 'اکنون خارج از ساعت کاری هستیم. پیام شما ثبت می‌شود و در اولین فرصت پاسخ می‌دهیم.',
    },
    waiting: { variant: 'float', emoji: '⏳', text: 'منتظر پیام شما هستم…' },
    'send-error': {
      variant: 'float',
      emoji: '⚠️',
      text: 'پیام ارسال نشد. اتصال را بررسی و دوباره تلاش کنید.',
    },
    'network-error': {
      variant: 'full',
      emoji: '📡',
      text: 'اتصال اینترنت قطع شده است. به‌محض اتصال، گفتگو ادامه پیدا می‌کند.',
    },
  };

  // Static cloud artwork from the supplied design; each card gets unique SVG IDs.
  var SCENARIO_CLOUD_SVG =
    '<svg viewBox="0 0 430 370" preserveAspectRatio="none" aria-hidden="true" focusable="false"><defs><clipPath id="cb-clip"><circle cx="230" cy="105" r="85" /><circle cx="120" cy="140" r="60" /><circle cx="72" cy="198" r="48" /><circle cx="330" cy="140" r="62" /><circle cx="366" cy="208" r="46" /><rect x="78" y="150" width="300" height="150" rx="75" /><circle cx="200" cy="248" r="62" /><circle cx="300" cy="246" r="62" /><path\r\n              d="M140 272C150 312 130 336 96 352C158 350 208 326 226 280Z"\r\n            /></clipPath><filter\r\n            id="cb-puffy"\r\n            x="-12%"\r\n            y="-12%"\r\n            width="124%"\r\n            height="124%"\r\n            color-interpolation-filters="sRGB"\r\n          ><feFlood flood-color="#0b1220" flood-opacity=".22" /><feComposite in2="SourceAlpha" operator="out" result="outD" /><feGaussianBlur in="outD" stdDeviation="14" /><feOffset dx="-8" dy="-12" result="shD" /><feComposite\r\n              in="shD"\r\n              in2="SourceAlpha"\r\n              operator="in"\r\n              result="innerD"\r\n            /><feFlood flood-color="#ffffff" flood-opacity=".85" /><feComposite in2="SourceAlpha" operator="out" result="outL" /><feGaussianBlur in="outL" stdDeviation="7" /><feOffset dx="5" dy="8" result="shL" /><feComposite\r\n              in="shL"\r\n              in2="SourceAlpha"\r\n              operator="in"\r\n              result="innerL"\r\n            /><feMerge><feMergeNode in="SourceGraphic" /><feMergeNode in="innerD" /><feMergeNode in="innerL" /></feMerge></filter><linearGradient id="cb-tone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".30" /><stop offset=".45" stop-color="#fff" stop-opacity="0" /><stop offset="1" stop-color="#0b1220" stop-opacity=".16" /></linearGradient><radialGradient id="cb-floor"><stop offset="0" stop-color="#000" stop-opacity=".40" /><stop offset="1" stop-color="#000" stop-opacity="0" /></radialGradient><linearGradient\r\n            id="cb-c1"\r\n            gradientUnits="userSpaceOnUse"\r\n            x1="161"\r\n            y1="73"\r\n            x2="204"\r\n            y2="34"\r\n          ><stop offset="0" stop-color="#fff" stop-opacity="0" /><stop offset=".5" stop-color="#fff" stop-opacity=".95" /><stop offset="1" stop-color="#fff" stop-opacity="0" /></linearGradient><linearGradient\r\n            id="cb-c2"\r\n            gradientUnits="userSpaceOnUse"\r\n            x1="77"\r\n            y1="120"\r\n            x2="100"\r\n            y2="97"\r\n          ><stop offset="0" stop-color="#fff" stop-opacity="0" /><stop offset=".5" stop-color="#fff" stop-opacity=".95" /><stop offset="1" stop-color="#fff" stop-opacity="0" /></linearGradient><filter id="cb-b10" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="10" /></filter><filter id="cb-b5" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5" /></filter><filter id="cb-b1" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1" /></filter></defs><ellipse\r\n          class="cb-shadow"\r\n          cx="255"\r\n          cy="354"\r\n          rx="165"\r\n          ry="13"\r\n          fill="url(#cb-floor)"\r\n        /><g class="cb-body"><g filter="url(#cb-puffy)" fill="currentColor"><circle cx="230" cy="105" r="85" /><circle cx="120" cy="140" r="60" /><circle cx="72" cy="198" r="48" /><circle cx="330" cy="140" r="62" /><circle cx="366" cy="208" r="46" /><rect x="78" y="150" width="300" height="150" rx="75" /><circle cx="200" cy="248" r="62" /><circle cx="300" cy="246" r="62" /><path\r\n              d="M140 272C150 312 130 336 96 352C158 350 208 326 226 280Z"\r\n            /></g><g clip-path="url(#cb-clip)"><rect width="430" height="370" fill="url(#cb-tone)" /><ellipse\r\n              cx="195"\r\n              cy="60"\r\n              rx="72"\r\n              ry="24"\r\n              fill="#fff"\r\n              opacity=".75"\r\n              transform="rotate(-18 195 60)"\r\n              filter="url(#cb-b10)"\r\n            /><ellipse\r\n              cx="102"\r\n              cy="112"\r\n              rx="28"\r\n              ry="12"\r\n              fill="#fff"\r\n              opacity=".7"\r\n              transform="rotate(-35 102 112)"\r\n              filter="url(#cb-b5)"\r\n            /><ellipse\r\n              cx="318"\r\n              cy="98"\r\n              rx="26"\r\n              ry="10"\r\n              fill="#fff"\r\n              opacity=".45"\r\n              transform="rotate(-25 318 98)"\r\n              filter="url(#cb-b5)"\r\n            /></g><g\r\n            fill="none"\r\n            stroke-linecap="round"\r\n            stroke-width="6"\r\n            filter="url(#cb-b1)"\r\n          ><path d="M161 73A76 76 0 0 1 204 34" stroke="url(#cb-c1)" /><path d="M77 120A48 48 0 0 1 100 97" stroke="url(#cb-c2)" /></g></g></svg>';
  function scenarioCloudShape() {
    var template = document.createElement('template');
    var prefix = 'coco-cloud-' + uid() + '-';
    template.innerHTML = SCENARIO_CLOUD_SVG.replace(
      /id="cb-/g,
      'id="' + prefix
    ).replace(/url\(#cb-/g, 'url(#' + prefix);
    return template.content.firstChild;
  }

  function ScenarioManager(layer, cfg, events, onChange) {
    this.layer = layer;
    this.base = cfg.assetsBase || location.href;
    this.events = events;
    this.onChange = onChange || function () {};
    this.registry = {};
    this.current = null;
    this.cards = [];
    this.paused = false;
    this.mockVideoUrl = null;
    if (cfg.mock) {
      var mockAssetsBase = new URL(cfg.assetsBase || '.', location.href);
      if (!/\/$/.test(mockAssetsBase.pathname)) mockAssetsBase.pathname += '/';
      this.mockVideoUrl = safeUrl('1.mp4', mockAssetsBase.href);
    }
  }
  /* Backend payload: { key: { videoUrl, loop, text } } */
  ScenarioManager.prototype.configure = function (map) {
    if (!map || typeof map !== 'object') return;
    for (var k in map) {
      if (!SCENARIO_DEFAULTS[k] || !map[k] || typeof map[k] !== 'object')
        continue;
      this.registry[k] = {
        videoUrl: safeUrl(map[k].videoUrl, this.base),
        loop: map[k].loop !== false,
        text:
          typeof map[k].text === 'string' ? map[k].text.slice(0, 200) : null,
      };
    }
  };
  ScenarioManager.prototype._def = function (key) {
    var d = SCENARIO_DEFAULTS[key],
      r = this.registry[key] || {};
    return {
      variant: d.variant,
      emoji: d.emoji,
      text: r.text || d.text,
      videoUrl: r.videoUrl || this.mockVideoUrl || null,
      loop: r.loop !== false,
    };
  };
  ScenarioManager.prototype._media = function (def) {
    var self = this;
    var wrap = h(
      'div',
      { class: 'cloud-media' },
      h('div', { class: 'cloud-emoji', text: def.emoji, 'aria-hidden': 'true' })
    );
    if (def.videoUrl) {
      var v = document.createElement('video');
      v.muted = true;
      v.defaultMuted = true;
      v.autoplay = true;
      v.loop = def.loop;
      v.playsInline = true;
      v.setAttribute('playsinline', '');
      v.setAttribute('muted', '');
      v.setAttribute('aria-hidden', 'true');
      v.preload = 'auto';
      v.disablePictureInPicture = true;
      v.addEventListener('loadeddata', function () {
        v.classList.add('ready');
        wrap.classList.add('media-ready');
        if (self.paused || !self.current || !self.current.card.contains(v))
          v.pause();
      });
      v.addEventListener('error', function () {
        wrap.classList.remove('media-ready');
        ScenarioManager.release(v);
      });
      v.src = def.videoUrl;
      wrap.appendChild(v);
      var p = v.play();
      if (p && p.catch)
        p.catch(function () {
          /* autoplay blocked: emoji fallback stays visible */
        });
    }
    return wrap;
  };
  ScenarioManager.release = function (v) {
    try {
      v.pause();
      v.removeAttribute('src');
      v.load();
    } catch (e) {
      /* noop */
    }
    if (v.parentNode) v.parentNode.removeChild(v);
  };
  /* opts: {action:{label,onClick}, dismissible, onDismiss} */
  ScenarioManager.prototype.show = function (key, opts) {
    if (!SCENARIO_DEFAULTS[key]) return;
    opts = opts || {};
    if (this.current && this.current.key === key && !opts.force) return;
    // Replace the previous status in one layout update, without stacked cards.
    var active = this.layer.getRootNode().activeElement;
    var restoreFocus = this.cards.some(function (card) {
      return active && card.contains(active);
    });
    this.cards.slice().forEach(this._remove.bind(this));
    var self = this,
      def = this._def(key);
    var cloud = h(
      'div',
      { class: 'cloud', role: 'group' },
      scenarioCloudShape(),
      h(
        'div',
        { class: 'cloud-in' },
        this._media(def),
        h('div', { class: 'cloud-text', text: def.text }),
        /^(chat-loading|thinking|reading|waiting)$/.test(key)
          ? h(
              'span',
              { class: 'cloud-pulse', 'aria-hidden': 'true' },
              h('i'),
              h('i'),
              h('i')
            )
          : null,
        opts.action
          ? h('button', {
              class: 'cloud-btn',
              type: 'button',
              text: opts.action.label,
              on: { click: opts.action.onClick },
            })
          : null,
        opts.dismissible
          ? h('button', {
              class: 'cloud-dismiss',
              type: 'button',
              text: T.close,
              'aria-label': 'بستن پیام وضعیت',
              on: { click: function () {
                self.hide();
                if (opts.onDismiss) opts.onDismiss();
              } },
            })
          : null
      )
    );

    var card = h('div', {
      class: 'sc sc-' + def.variant,
      'data-scenario': key,
      'aria-atomic': 'true',
    }, cloud);
    this.layer.appendChild(card);
    this.cards.push(card);
    this.current = { key: key, card: card, opts: opts };
    this.onChange(restoreFocus);
    if (this.paused) this.pause();
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        if (self.current && self.current.card === card)
          card.classList.add('in');
      });
    });
  };
  ScenarioManager.prototype._remove = function (card) {
    if (card._leaveTimer) this.events.clearTimeout(card._leaveTimer);
    card.querySelectorAll('video').forEach(ScenarioManager.release);
    if (card.parentNode) card.parentNode.removeChild(card);
    this.cards = this.cards.filter(function (c) { return c !== card; });
  };
  ScenarioManager.prototype._leave = function (card) {
    var self = this;
    var active = this.layer.getRootNode().activeElement;
    var restoreFocus = active && card.contains(active);
    card.classList.remove('in');
    card.classList.add('out');
    card.inert = true;
    card.setAttribute('aria-hidden', 'true');
    // Stop media immediately, even while the card finishes its exit animation.
    card.querySelectorAll('video').forEach(function (v) { v.pause(); });
    if (restoreFocus) this.onChange(true);
    card._leaveTimer = this.events.timeout(function () {
      self._remove(card);
      self.onChange();
    }, 220);
  };
  ScenarioManager.prototype._leaveAll = function () {
    var self = this;
    this.cards.slice().forEach(function (c) {
      if (!c.classList.contains('out')) self._leave(c);
    });
    this.current = null;
  };
  ScenarioManager.prototype.hide = function () {
    this._leaveAll();
  };
  ScenarioManager.prototype.setVideo = function (key, url) {
    this.configure(
      function () {
        var o = {};
        o[key] = Object.assign({}, this.registry[key], { videoUrl: url });
        return o;
      }.call(this)
    );
    if (this.current && this.current.key === key)
      this.show(key, Object.assign({}, this.current.opts, { force: true }));
  };
  ScenarioManager.prototype.play = function () {
    this.paused = false;
    if (!this.current) return;
    this.current.card.querySelectorAll('video').forEach(function (v) {
      var p = v.play();
      if (p && p.catch) p.catch(function () {});
    });
  };
  ScenarioManager.prototype.pause = function () {
    this.paused = true;
    this.layer.querySelectorAll('video').forEach(function (v) {
      v.pause();
    });
  };
  ScenarioManager.prototype.destroy = function () {
    this.cards.slice().forEach(this._remove.bind(this));
    this.cards = [];
    this.current = null;
  };

  /* =====================================================================
   * 8. EVENT MANAGER + NETWORK MANAGER
   * ===================================================================== */
  function EventManager() {
    this.l = [];
    this.t = [];
    this.i = [];
  }
  EventManager.prototype.add = function (target, type, fn, opts) {
    target.addEventListener(type, fn, opts);
    this.l.push([target, type, fn, opts]);
  };
  EventManager.prototype.timeout = function (fn, ms) {
    var id = setTimeout(fn, ms);
    this.t.push(id);
    return id;
  };
  EventManager.prototype.interval = function (fn, ms) {
    var id = setInterval(fn, ms);
    this.i.push(id);
    return id;
  };
  EventManager.prototype.clearTimeout = function (id) {
    clearTimeout(id);
  };
  EventManager.prototype.clearInterval = function (id) {
    clearInterval(id);
  };
  EventManager.prototype.removeAll = function () {
    this.l.forEach(function (x) {
      x[0].removeEventListener(x[1], x[2], x[3]);
    });
    this.t.forEach(clearTimeout);
    this.i.forEach(clearInterval);
    this.l = [];
    this.t = [];
    this.i = [];
  };

  /* status: online | offline | reconnecting | connected */
  function NetworkManager(events, onChange) {
    var self = this;
    this.events = events;
    this.onChange = onChange;
    this.status =
      typeof navigator !== 'undefined' && navigator.onLine === false
        ? 'offline'
        : 'online';
    events.add(window, 'offline', function () {
      self._set('offline');
    });
    events.add(window, 'online', function () {
      self._set('reconnecting');
      events.timeout(function () {
        self._set('connected');
      }, 900);
    });
  }
  NetworkManager.prototype._set = function (s) {
    this.status = s;
    this.onChange(s);
  };

  /* =====================================================================
   * 9. UI
   * ===================================================================== */
  var EMOJI = [
    {
      icon: '😍',
      name: 'پرکاربرد',
      list: '😒 😁 🧡 💚 😍 🙌 😂 🤣 😊 😉 😘 🥰 😎 🤔 👍 🙏 👏 🔥 ✨ 🎉 ❤️ 💙 😭 😅 🤝 💪 😢 😡 🥳 😴',
    },
    {
      icon: '😀',
      name: 'صورتک‌ها',
      list: '😀 😃 😄 😁 😆 😅 😂 🤣 🙂 🙃 😉 😊 😇 🥰 😍 🤩 😘 😗 😚 😋 😛 😜 🤪 😝 🤑 🤗 🤭 🤫 🤔 😐 😑 😶 😏 😒 🙄 😬 😌 😔 😪 😴 😷 🤒 🤕 🥵 🥶 😵 🤯 🤠 🥳 😎 🤓 😕 😟 🙁 😮 😲 😳 🥺 😢 😭 😱 😖 😞 😓 😩 😫 😤 😡 😠 🤬',
    },
    {
      icon: '🧡',
      name: 'دل و دست',
      list: '❤️ 🧡 💛 💚 💙 💜 🖤 🤍 🤎 💔 ❣️ 💕 💞 💓 💗 💖 💘 💝 👍 👎 👌 ✌️ 🤞 🤟 🤘 🤙 👈 👉 👆 👇 ✋ 🖐️ 👋 🤝 👏 🙌 🙏 💪 ✍️ 🤲',
    },
    {
      icon: '🎉',
      name: 'اشیا',
      list: '🎉 🎊 🎁 🎈 🏆 🥇 ⭐ 🌟 ✨ 💫 🔥 💥 ⚡ ☀️ 🌙 ☁️ 🌈 🌸 🌹 🍀 ☕ 🍰 🍕 🍔 🍎 🎵 🎶 📌 📎 📅 📞 💡 🔔 ✅ ❌ ⚠️ ❓ ❗ 💯 🚀',
    },
  ];

  // راهنمای رنگ‌ها: متغیرهای پایه در بخش 02 و تغییرات تم در بخش‌های 03 و 04 هستند.
  // رنگ‌های مستقیم هر بخش کنار استایل همان بخش باقی مانده‌اند.
  // پیش‌فرض accent و text در CSS است؛ UI.mount فقط رنگ معتبرِ داده‌شده را جایگزین می‌کند.
  // ترتیب قوانین، انتخابگرها و مقدارها برای حفظ ظاهر فعلی نگه داشته شده است.
  var CSS = [
    // 01. بازنشانی استایل‌ها
    `:host {
      all: initial
    }`,
    `*,*::before,*::after {
      box-sizing: border-box
    }`,

    `a {color: inherit;text-decoration: inherit;}`,
    // 02. رنگ‌های پایه و متغیرهای مشترک
    `.root {

      /* الگوی پیش‌فرض پس‌زمینه */
      --widget-wallpaper: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M54.627 0l.83.828-1.415 1.415L51.8 0h2.827zM5.373 0l-.83.828L5.96 2.243 8.2 0H5.374zM48.97 0l3.657 3.657-1.414 1.414L46.143 0h2.828zM11.03 0L7.372 3.657 8.787 5.07 13.857 0H11.03zm32.284 0L49.8 6.485 48.384 7.9l-7.9-7.9h2.83zM16.686 0L10.2 6.485 11.616 7.9l7.9-7.9h-2.83zm20.97 0l9.315 9.314-1.414 1.414L34.828 0h2.83zM22.344 0L13.03 9.314l1.414 1.414L25.172 0h-2.83zM32 0l12.142 12.142-1.414 1.414L30 .828 17.272 13.556l-1.414-1.414L28 0h4zM.284 0l28 28-1.414 1.414L0 2.544V0h.284zM0 5.373l25.456 25.455-1.414 1.415L0 8.2V5.374zm0 5.656l22.627 22.627-1.414 1.414L0 13.86v-2.83zm0 5.656l19.8 19.8-1.415 1.413L0 19.514v-2.83zm0 5.657l16.97 16.97-1.414 1.415L0 25.172v-2.83zM0 28l14.142 14.142-1.414 1.414L0 30.828V28zm0 5.657L11.314 44.97 9.9 46.386l-9.9-9.9v-2.828zm0 5.657L8.485 47.8 7.07 49.212 0 42.143v-2.83zm0 5.657l5.657 5.657-1.414 1.415L0 47.8v-2.83zm0 5.657l2.828 2.83-1.414 1.413L0 53.456v-2.83zM54.627 60L30 35.373 5.373 60H8.2L30 38.2 51.8 60h2.827zm-5.656 0L30 41.03 11.03 60h2.828L30 43.858 46.142 60h2.83zm-5.656 0L30 46.686 16.686 60h2.83L30 49.515 40.485 60h2.83zm-5.657 0L30 52.343 22.343 60h2.83L30 55.172 34.828 60h2.83zM32 60l-2-2-2 2h4zM59.716 0l-28 28 1.414 1.414L60 2.544V0h-.284zM60 5.373L34.544 30.828l1.414 1.415L60 8.2V5.374zm0 5.656L37.373 33.656l1.414 1.414L60 13.86v-2.83zm0 5.656l-19.8 19.8 1.415 1.413L60 19.514v-2.83zm0 5.657l-16.97 16.97 1.414 1.415L60 25.172v-2.83zM60 28L45.858 42.142l1.414 1.414L60 30.828V28zm0 5.657L48.686 44.97l1.415 1.415 9.9-9.9v-2.828zm0 5.657L51.515 47.8l1.414 1.413 7.07-7.07v-2.83zm0 5.657l-5.657 5.657 1.414 1.415L60 47.8v-2.83zm0 5.657l-2.828 2.83 1.414 1.413L60 53.456v-2.83zM39.9 16.385l1.414-1.414L30 3.658 18.686 14.97l1.415 1.415 9.9-9.9 9.9 9.9zm-2.83 2.828l1.415-1.414L30 9.313 21.515 17.8l1.414 1.413 7.07-7.07 7.07 7.07zm-2.827 2.83l1.414-1.416L30 14.97l-5.657 5.657 1.414 1.415L30 17.8l4.243 4.242zm-2.83 2.827l1.415-1.414L30 20.626l-2.828 2.83 1.414 1.414L30 23.456l1.414 1.414zM56.87 59.414L58.284 58 30 29.716 1.716 58l1.414 1.414L30 32.544l26.87 26.87z' fill='%2338353e' fill-opacity='0.25' fillRule='evenodd'/%3E%3C/svg%3E");

      /* رنگ اصلی پایه؛ فقط با رنگ معتبرِ تنظیمات کاربر جایگزین می‌شود */
      --accent: #0c7933;
      --accent-soft-dark: color-mix(in srgb, var(--accent), black 40%);
      --accent-soft-light: color-mix(in srgb, var(--accent), white 20%);

      /* رنگ نوشتهٔ پایه */
      --text: #ffffff;
      --ink: #fff;

      /* زمینه و سطح‌های پایه */
      --bg: #fff;
      --surface: #ffffff;
      --surface2: #ffffff;

      /* نوشتهٔ کم‌رنگ و خطوط */
      --muted: #708090;
      --line: rgba(5,46,22,.08);

      /* رنگ‌های حباب پیام‌ها */
      --in: #ffffff;
      --out: #e8fed8;
      --outtext: #052e16;

      /* رنگ‌های پس‌زمینهٔ گفتگو */
      --wall: #cfe9c9;
      --wall2: #b4e0c9;

      /* خطا و وضعیت موفق */
      --danger: #ff0008;
      --ok: #00c951;

      /* پوشش و ابر وضعیت‌ها */
      --veil: rgba(236,242,247,.74);
      --cloud: #ffffff;

      /* سایهٔ مشترک */
      --shadow: 0 1.5rem 3.75rem -1.5rem rgba(5,46,22,.3);

      /* فونت و قواعد پایهٔ نمایش */
      font-family: "CocoChatPeyda",Tahoma,"Segoe UI",system-ui,-apple-system,"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif;
      font-size: 16px;
      color: var(--text);
      direction: rtl;
      text-align: right;
      -webkit-text-size-adjust: 100%;
      -webkit-tap-highlight-color: transparent;
    }`,

    // 03. رنگ‌های تم تاریک
    `.root[data-theme=dark] {
      --bg: #17212b;
      --surface: #17212b;
      --surface2: #232f3d;
      --muted: #8797a8;
      --line: #25323f;
      --in: #212d3a;
      --wall: #0e1621;
      --wall2: #101a26;
      --veil: rgba(12,19,28,.76);
      --cloud: #202c39;
      --shadow: 0 1.125rem 3.75rem rgba(0,0,0,.55)
    }`,

    // 04. تم خودکار بر اساس تنظیمات مرورگر
    `@media (prefers-color-scheme:dark) {
      .root[data-theme=auto] {
        --bg: #17212b;
        --surface: #17212b;
        --surface2: #232f3d;
        --muted: #8797a8;
        --line: #25323f;
        --in: #212d3a;
        --wall: #0e1621;
        --wall2: #101a26;
        --veil: rgba(12,19,28,.76);
        --cloud: #202c39;
        --shadow: 0 1.125rem 3.75rem rgba(0,0,0,.55)
      }
    }`,

    // 05. قواعد مشترک کنترل‌ها
    `.root button,.root input,.root textarea {
      font: inherit;
      color: inherit;
      margin: 0;
      letter-spacing: normal;
      text-transform: none
    }`,
    `.root button {
      cursor: pointer;
      background: none;
      border: 0;
      padding: 0;
      -webkit-appearance: none;
      appearance: none
    }`,
    `.root svg {
      display: block;
      flex: none
    }`,

    // 06. دکمهٔ بازکردن و پنل چت
    `button.launcher {
      position: fixed;
      top: auto;
      right: auto;
      bottom: auto;
      left: auto;
      width: 3.5rem;
      height: 3.5rem;
      border-radius: 50%;
      background-color: var(--accent);
      color: var(--text);
      display: grid;
      place-items: center;
      box-shadow: 0 .625rem 1.75rem rgba(18,30,45,.3);
      transition: transform .2s ease,opacity .12s linear .22s;
      z-index: 1
    }`,
    `button.launcher svg {
      width: 1.625rem;
      height: 1.625rem
    }`,
    `.launcher:hover {
      transform: scale(1.07)
    }`,
    `.launcher:active {
      transform: scale(.95)
    }`,
    `.root .panel {
      position: fixed;
      top: auto;
      right: auto;
      bottom: auto;
      left: auto;
      width: min(24.5rem,calc(100vw - 2rem));
      height: var(--panel-height,660px);
      background: var(--accent);
      border-radius: 1.25rem;
      box-shadow: 0 1.5rem 3.75rem -1.5rem rgba(5,46,22,.3),0 0 0 1px rgba(5,46,22,.03);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      transform-origin: var(--panel-origin-x,100%) var(--panel-origin-y,100%);
      transform: translateY(calc(var(--panel-base-y,0px) + var(--panel-closed-y,64px))) scale(.5) rotate(var(--panel-tilt,6deg));
      clip-path: circle(0% at var(--panel-origin-x,100%) var(--panel-origin-y,100%));
      transition: transform .3s ease-in,clip-path .3s ease-in,opacity .3s ease-in,visibility 0s linear .3s;
      z-index: 2
    }`,
    `.root.open .panel {
      opacity: 1;
      visibility: visible;
      pointer-events: auto;
      transform: translateY(var(--panel-base-y,0px)) scale(1) rotate(0deg);
      clip-path: circle(150% at var(--panel-origin-x,100%) var(--panel-origin-y,100%));
      transition: transform .45s cubic-bezier(.34,1.56,.64,1),clip-path .45s ease-out,opacity .45s cubic-bezier(.34,1.56,.64,1),visibility 0s
    }`,
    `.root .panel > .view {
      opacity: 0;
      transform: translateY(10px);
      transition: opacity .06s linear,transform .12s ease
    }`,
    `.root.open .panel > .view {
      opacity: 1;
      transform: none;
      transition: opacity .16s ease .22s,transform .18s ease .2s
    }`,
    `.root.open .launcher {
      opacity: 0;
      pointer-events: none;
      transform: scale(.85);
      transition: transform .16s ease,opacity .08s linear
    }`,
    `@media (max-width:40rem) {
      .root .panel {
        --panel-base-y: 0px;
        left: 0!important;
        right: 0!important;
        top: var(--vvt,0px)!important;
        bottom: auto!important;
        width: auto;
        height: var(--vvh,100dvh)!important;
        max-height: none!important;
        border-radius: 1.75rem 1.75rem 0 0;
        transform: translateY(100%);
        transform-origin: center bottom;
        clip-path: none;
        transition: transform .26s cubic-bezier(.4,0,.8,.2),border-radius .26s ease,opacity .06s linear .2s,visibility 0s linear .26s
      }
      .root.open .panel {
        transform: translateY(0);
        clip-path: none;
        border-radius: 0;
        transition: transform .42s cubic-bezier(.16,1,.3,1),border-radius .18s ease .22s,opacity .06s linear,visibility 0s
      }
    }`,

    // 07. صفحات داخلی و فرم‌های عمومی
    `.view {
      position: absolute;
      inset: 0;
      display: none;
      flex-direction: column
    }`,
    `.view.active {
      display: flex
    }`,
    `.card-view {
      padding: calc(1.25rem + env(safe-area-inset-top,0px)) 1.5rem calc(1.5rem + env(safe-area-inset-bottom,0px));
      overflow-y: auto;
    }`,
    `button.x {
      position: absolute;
      top: calc(.625rem + env(safe-area-inset-top,0px));
      left: .625rem;
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      color: var(--accent-soft-dark);
      display: grid;
      place-items: center;
      transition: background .15s
    }`,
    `.x:hover {
      background: var(--accent);
      border: 1px solid var(--accent-soft-dark)
    }`,
    `.hero {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      margin: 2.125rem 0 1.375rem
    }`,
    `.logo {
      width: 4.25rem;
      height: 4.25rem;
      border-radius: 1.5rem 1.5rem 1.5rem .5rem;
      background: var(--accent);
      color: var(--text);
      display: grid;
      place-items: center;
      margin-bottom: 1rem;
      box-shadow: 0 .75rem 1.625rem -.5rem var(--accent)
    }`,
    `.logo svg {
      width: 2rem;
      height: 2rem
    }`,
    `.fld {
      display: block;
      margin-bottom: .875rem
    }`,
    `.inp[dir=ltr] {
      text-align: left
    }`,
    `.inp::placeholder {
      color: var(--muted);
      opacity: .7
    }`,
    `.form-error {
      min-height: 1.25rem;
      color: var(--danger);
      font-size: .75rem;
      margin: .125rem 0 .5rem
    }`,
    `button.btn {
      width: 100%;
      height: 3rem;
      border-radius: .75rem;
      background: var(--accent);
      color: var(--text);
      font-weight: 600;
      font-size: .9375rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: .5rem;
      transition: transform .12s,opacity .15s
    }`,
    `.btn:active {
      transform: scale(.98)
    }`,
    `.btn[disabled] {
      opacity: .6;
      cursor: default
    }`,
    `.spin {
      width: 1.125rem;
      height: 1.125rem;
      border-radius: 50%;
      border: 2.5px solid currentColor;
      border-top-color: transparent;
      animation: spin .7s linear infinite
    }`,

    // 08. کد تأیید و ورود
    `.otp-row {
      display: flex;
      gap: .5rem;
      justify-content: center;
      direction: ltr;
      margin: .375rem 0 .5rem
    }`,
    `input.otp-i {
      width: 3rem;
      height: 3rem;
      color: var(--accent);
      border: 2px solid transparent;
      border-radius: .875rem;
      text-align: center;
      font-size: 1rem;
      background: var(--surface);
      outline: 0;
      padding: 0;
      transition: border-color .15s,box-shadow .15s,transform .15s
    }`,
    `input.otp-i:focus {
      border-color: var(--accent);
    }`,
    `input.otp-i.filled {
      border-color: var(--accent-soft-dark)
    }`,
    `.otp-row.shake {
      animation: shake .4s
    }`,
    `.otp-row.shake input.otp-i {
      border-color: var(--danger)
    }`,
    `.root .otp-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      width: 100%;
      margin-top: 12px
    }`,
    `.root .otp-footer-resend {
      display: flex;
      align-items: center;
      gap: 6px;
      min-width: 0;
      flex-wrap: wrap
    }`,
    `.root .otp-footer button.ghost {
      width: auto;
      flex-shrink: 0;
      color: var(--accent-soft-dark)
    }`,
    `.root .otp-footer-resend [hidden] {
      display: none!important
    }`,
    `@media(max-width:360px) {
      .root .otp-footer {
        gap: 4px
      }
      .root .otp-footer button.ghost {
        padding: 6px 4px;
        font-size: 12px
      }
    }`,
    `.sub {
      color: var(--accent-soft-dark);
      text-align: center;
      margin: 0 0 20px;
      margin: 0 0 10px;
      max-width: 280px;
    }`,
    `.sub bdi {
      color: var(--accent-soft-dark);
      font-weight: bold;
      direction: ltr;
      unicode-bidi: isolate
    }`,
    `.hintline {
      text-align: center;
      color: var(--accent-soft-light);
      font-size: .75rem;
    }`,
    `button.resend {
      text-align: center;
      color: var(--muted);
      font-size: .75rem;
    }`,
    `.center {
      margin: auto;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: .75rem;
      padding: 1.5rem
    }`,
    `.center p {
      margin: 0;
      color: var(--muted)
    }`,
    `.center h3 {
      margin: 0;
      font-size: 1.0625rem
    }`,

    // 09. حالت‌های عمومی پیام‌ها و وضعیت هدر
    `.hinfo {
      flex: 1;
      min-width: 0
    }`,
    `.hstat.bad {
      color: var(--danger)
    }`,
    `.dots {
      display: inline-flex;
      gap: .1875rem
    }`,
    `.dots i {
      width: .25rem;
      height: .25rem;
      border-radius: 50%;
      background: currentColor;
      animation: bounce 1.1s infinite
    }`,
    `.dots i:nth-child(2) {
      animation-delay: .15s
    }`,
    `.dots i:nth-child(3) {
      animation-delay: .3s
    }`,
    `.row {
      display: flex;
      max-width: 100%;
      animation: pop .22s ease-out;
      transition: transform .18s ease-out;
      touch-action: pan-y pinch-zoom
    }`,
    `.row.out {
      justify-content: flex-start
    }`,
    `.row.in {
      justify-content: flex-end
    }`,
    `.streaming .txt::after {
      content: "";
      display: inline-block;
      width: .125rem;
      height: 1em;
      margin-inline-start: .125rem;
      vertical-align: -.125rem;
      background: currentColor;
      opacity: .6;
      animation: blink 1s steps(2) infinite
    }`,
    `.meta .ic-retry {
      display: inline-flex;
      color: var(--danger);
      opacity: 1
    }`,
    `.out .meta .ic-retry {
      color: #fff
    }`,
    `.meta .bad {
      color: var(--danger);
      font-weight: 600;
      opacity: 1
    }`,
    `.in .quote {
      color: var(--accent)
    }`,
    `.row.flash::before {
      content: "";
      position: absolute;
      top: -.125rem;
      bottom: -.125rem;
      left: -.1875rem;
      right: -.1875rem;
      border-radius: .625rem;
      background: rgba(255,255,255,.6);
      pointer-events: none;
      z-index: 3;
      animation: row-flash 1s ease-out forwards
    }`,
    `.root .fab.show {
      opacity: 1;
      pointer-events: auto;
      transform: none
    }`,

    // 10. ابر وضعیت‌ها؛ رنگ ثابت ابر و رنگ‌های وابسته به accent
    `.sc-layer {
      position: relative;
      flex: none;
      min-width: 0;
      overflow-anchor: none;
      width: 100%
    }`,
    `.sc-layer:empty {
      display: none
    }`,
    `.sc {
      position: relative;
      width: 100%;
      display: flex;
      align-items: center;
      align-items: safe center;
      justify-content: center;
      padding: 8px 0 12px;
      opacity: 0;
      transition: opacity .22s ease
    }`,
    `.sc.in {
      opacity: 1
    }`,
    `.sc.out {
      opacity: 0
    }`,
    `.sc-float {
      justify-content: flex-end
    }`,
    `.sc.in .cloud {
      transform: none
    }`,
    `.sc.out .cloud {
      transform: translateY(8px) scale(.96)
    }`,
    `.root .cloud {
      position: relative;
      display: flow-root;
      flex: none;
      width: min(300px,100%);
      color: #ffffff;
      text-align: center;
      pointer-events: auto;
      transform: translateY(16px) scale(.88);
      transform-origin: 25% 92%;
      transition: transform .3s cubic-bezier(.2,.9,.3,1.15)
    }`,
    `.sc-float .cloud {
      width: min(260px,100%)
    }`,
    `.cloud>svg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      overflow: visible;
      pointer-events: none
    }`,
    `.cloud .cb-body,.cloud-in {
      animation: none
    }`,
    `.cloud .cb-shadow {
      transform-box: fill-box;
      transform-origin: center;
      animation: cloud-shadow 5.5s ease-in-out infinite
    }`,
    `.cloud-in {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      margin: 12% 14% 20% 22%;
      color: #253447
    }`,
    `.cloud-media {
      position: relative;
      flex: none;
      width: 100%;
      height: 104px;
      margin: 0;
      overflow: hidden
    }`,
    `.sc-float .cloud-media {
      height: 88px
    }`,
    `.cloud-media video {
      position: absolute;
      inset: 0;
      display: block;
      width: 100%;
      height: 100%;
      object-fit: contain;
      opacity: 0;
      transition: opacity .3s ease;
      pointer-events: none
    }`,
    `.cloud-media video.ready {
      opacity: 1
    }`,
    `.cloud-emoji {
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center;
      font-size: 48px;
      transition: opacity .2s ease
    }`,
    `.cloud-media.media-ready .cloud-emoji {
      opacity: 0
    }`,
    `.cloud-text {
      font-size: .75rem;
      overflow-wrap: anywhere
    }`,
    `.sc-float .cloud-text {
      font-size: .75rem
    }`,
    `.cloud-pulse {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      height: 10px;
      color: var(--accent)
    }`,
    `.cloud-pulse i {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: currentColor;
      animation: bounce 1.2s infinite ease-in-out
    }`,
    `.cloud-pulse i:nth-child(2) {
      animation-delay: .15s
    }`,
    `.cloud-pulse i:nth-child(3) {
      animation-delay: .3s
    }`,
    `.root .cloud-btn {
      flex: none;
      min-height: 44px;
      max-width: 100%;
      padding: 6px 16px;
      border-radius: 999px;
      background: var(--accent);
      color: var(--text);
      font-weight: 600;
      font-size: 13px;
      line-height: 1.5;
      box-shadow: 0 2px 6px rgba(11,18,32,.12);
      transition: transform .15s,filter .15s
    }`,
    `.cloud-btn:hover {
      filter: brightness(.95)
    }`,
    `.cloud-btn:active {
      transform: scale(.97)
    }`,
    `.root .cloud-dismiss {
      min-height: 44px;
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 12px;
      color: #536579
    }`,
    `.root .cloud-dismiss:hover {background: rgba(11,18,32,.06)}`,
    `.root .cloud-dismiss:focus-visible {outline: 2px solid var(--accent);outline-offset: 2px}`,
    `.cloud-btn:focus-visible:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 3px
    }`,
    `@keyframes cloud-shadow {
      0%,100% {
        transform: scale(1);
        opacity: .75
      }
      50% {
        transform: scale(.88);
        opacity: .5
      }
    }`,
    `@media(max-width:360px),(max-height:560px) {
      .sc {
        padding: 8px
      }
      .cloud-in {
        gap: 6px
      }
      .cloud-media {
        height: 84px
      }
      .sc-float .cloud-media {
        height: 72px
      }
      .cloud-text {
        font-size: 13px
      }
    }`,

    // 11. حالت‌های فعال کنترل‌های ارسال و ایموجی
    `.root .banner.on {
      display: flex
    }`,
    `.send svg {
      width: 1.375rem;
      height: 1.375rem
    }`,
    `.send .flip {
      transform: scaleX(-1)
    }`,
    `.root .emoji.on {
      display: flex
    }`,
    `.etab {
      flex: 1;
      height: 2.625rem;
      font-size: 1.25rem;
      position: relative;
      opacity: .55
    }`,
    `.etab.on {
      opacity: 1
    }`,
    `.egrid {
      flex: 1;
      overflow-y: auto;
      padding: .5rem;
      display: grid;
      grid-template-columns: repeat(8,1fr);
      align-content: start;
      gap: .125rem;
       overscroll-behavior: contain;
      scrollbar-width: thin;
      scrollbar-color: transparent transparent;
      direction: ltr
    }`,

    `.egrid:hover {
  scrollbar-color: rgba(5,46,22,.25) transparent;
  scrollbar-color: color-mix(in srgb, var(--accent-soft-light) 25%, transparent) transparent
}`,

    `.egrid::-webkit-scrollbar {
  width: .25rem
}`,
    `.egrid::-webkit-scrollbar-track {
  background: transparent
}`,
    `.egrid::-webkit-scrollbar-thumb {
  background: transparent;
  border-radius: 999px
}`,
    `.egrid:hover::-webkit-scrollbar-thumb {
  background: rgba(5,46,22,.25);
  background: color-mix(in srgb, var(--accent-soft-light) 25%, transparent)
}`,

    `.eb:active {
      transform: scale(.88)
    }`,
    `.elabel {
      grid-column: 1/-1;
      font-size: .75rem;
      color: var(--muted);
      padding: .375rem .25rem .125rem;
      direction: rtl
    }`,
    `.toast.on {
      opacity: 1;
      transform: translate(-50%,0)
    }`,

    // 12. انیمیشن‌های مشترک و تنظیمات کاهش حرکت
    `@keyframes spin {
      to {
        transform: rotate(360deg)
      }
    }`,
    `@keyframes pop {
      from {
        opacity: 0;
        transform: translateY(.375rem) scale(.98)
      }
      to {
        opacity: 1;
        transform: none
      }
    }`,
    `@keyframes rise {
      from {
        opacity: 0;
        transform: translateY(.625rem)
      }
      to {
        opacity: 1;
        transform: none
      }
    }`,
    `@keyframes bounce {
      0%,60%,100% {
        transform: translateY(0)
      }
      30% {
        transform: translateY(-.25rem)
      }
    }`,
    `@keyframes blink {
      50% {
        opacity: 0
      }
    }`,
    `@keyframes shake {
      20%,60% {
        transform: translateX(-.375rem)
      }
      40%,80% {
        transform: translateX(.375rem)
      }
    }`,
    `@keyframes row-flash {
      0%,35% {
        opacity: 1
      }
      70% {
        opacity: .65
      }
      100% {
        opacity: 0
      }
    }`,
    `@keyframes float {
      0%,100% {
        transform: translateY(0)
      }
      50% {
        transform: translateY(-.375rem)
      }
    }`,
    `@keyframes bob {
      0%,100% {
        transform: translateY(.1875rem) scale(.96)
      }
      50% {
        transform: translateY(-.25rem) scale(1.04)
      }
    }`,
    `@keyframes morph {
      0%,100% {
        border-radius: 46% 54% 50% 50%/52% 46% 54% 48%
      }
      50% {
        border-radius: 54% 46% 48% 52%/46% 54% 46% 54%
      }
    }`,
    `@media (prefers-reduced-motion:reduce) {
      .root *,.root *::before,.root *::after {
        animation-duration: .001ms!important;
        animation-delay: 0s!important;
        animation-iteration-count: 1!important;
        transition-duration: .001ms!important;
        transition-delay: 0s!important
      }
    }`,
    `@media (prefers-reduced-motion:reduce) {
      .root .panel,.root.open .panel {
        transform: translateY(var(--panel-base-y,0px))!important;
        clip-path: none!important
      }
    }`,
    `@media (max-width:40rem) {
      .inp,.ta,input.otp-i {
        font-size: 1rem
      }
    }`,

    // 13. پوشش پس‌زمینهٔ پنل
    `.root .cover_content {
      position: absolute;
      inset: 0;
      height: 100%;
      background-color: var(--accent);
      background-image: linear-gradient(180deg, #0000 -11.43%, #fff 82%), var(--widget-wallpaper);
      background-repeat: repeat;
      transition: min-height .25s ease-out 0s,max-height .25s ease-out 0s;
      z-index: -1;
      max-height: 100%;
      min-height: 100%
    }`,

    // 14. هدر؛ رنگ‌های ثابت نوشته، وضعیت و آیکن‌ها
    `.root .hdr {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px;
      background: #ffffff;
      border-bottom: 1px solid #e7e9eb;
      box-shadow: 0 1px 3px rgba(0,0,0,.04);
      z-index: 6;
      min-height: 64px
    }`,
    `.root .av {
      position: relative;
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: #e8f0f7;
      flex: none;
      overflow: hidden
    }`,
    `.root .av img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
      display: block
    }`,
    `.root .hname {
      font-weight: 600;
      font-size: 16px;
      line-height: 24px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: #222222
    }`,
    `.root .hstat {
      font-size: .75rem;
      color: #3390ec;
      display: flex;
      align-items: center;
      gap: 5px;
            
      overflow: hidden
    }`,

    `.root .ib:hover {
      background: #f1f3f5;
      color: var(--accent-soft-dark)
    }`,
    `.root .hstat.bad {
      color: var(--danger)
    }`,
    `.root button.ib.on {
      background: #f1f3f5;
      color: var(--accent-soft-dark)
    }`,

    // 14.1. پنل معرفی و اطلاعات تماس
    `.root .agent-profile {
      position: absolute;
      inset: 0;
      z-index: 12;
      display: flex;
      flex-direction: column;
      background: #f4f4f5;
      color: #222222;
      visibility: hidden;
      pointer-events: none;
      transform: translateX(-100%);
      transition: transform .24s cubic-bezier(.2,.8,.2,1),visibility .24s;
      overflow: hidden
    }`,
    `.root .agent-profile.on {
      visibility: visible;
      pointer-events: auto;
      transform: translateX(0)
    }`,
    `.root .profile-toolbar {
      display: flex;
      align-items: center;
      gap: 12px;
      min-height: calc(64px + env(safe-area-inset-top,0px));
      padding: env(safe-area-inset-top,0px) 12px 0;
      flex: none;
      background: #ffffff;
      box-shadow: 0 1px 0 rgba(0,0,0,.06);
      z-index: 1;
      font-weight: 600;
      font-size: 16px
    }`,

    `.root .profile-scroll {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      overscroll-behavior: contain;
      padding-bottom: calc(16px + env(safe-area-inset-bottom,0px));
      scrollbar-width: thin
    }`,
    `.root .profile-hero {
      padding: 24px 16px 16px;
      
      text-align: center
    }`,
    `.root .profile-avatar {
      position: relative;
      display: grid;
      place-items: center;
      width: 96px;
      height: 96px;
      margin: 0 auto 14px;
      border-radius: 50%;
      overflow: hidden;
      background: #e7f2fc;
    
    }`,
    `.root .profile-avatar svg {
      width: 40px;
      height: 40px
    }`,
    `.root .profile-avatar img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover
    }`,
    `.root .profile-avatar img[hidden] { display: none }`,
    `.root .profile-name {
      margin: 0 0 4px;
      font-size: 20px;
      line-height: 30px;
      font-weight: 600;
      overflow-wrap: anywhere
    }`,
    `.root .profile-status {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 5px;
      min-height: 20px;
      color: var(--accent);
      font-size: .75rem;
      
    }`,
    `.root .profile-status.away { color: #707579 }`,
    `.root .profile-status.bad { color: var(--danger) }`,
    `.root .profile-actions {
      display: grid;
      grid-template-columns: repeat(3,minmax(0,1fr));
      gap: 8px;
      margin-top: 20px
    }`,
    `.root .profile-actions .profile-action {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 7px;
      padding: 12px 4px;
      min-height: 72px;
      border-radius: 12px;
      background: #ffffff;
      
      font-size: 13px;
      line-height: 20px;
      text-decoration: none;
      transition: background .15s
    }`,

    `.root .profile-actions .profile-action:disabled {
      opacity: .45;
      cursor: default
    }`,
    `.root .profile-group {
      padding:16px
    }`,
    `.root .profile-details {
      padding: 16px;
      background: #ffffff;
      border-radius: 12px;
    }`,
    `.root .profile-group h3 {
      margin: 0 0 12px;
      color: #2481cc;
      font-size: 14px;
      font-weight: 600
    }`,
    `.root .profile-description {
      margin: 0;
      font-size: 15px;
      line-height: 26px;
      white-space: pre-wrap;
      overflow-wrap: anywhere
    }`,
    `.root .profile-row {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      padding: 12px 0
    }`,
    `.root .profile-row + .profile-row {
      border-top: 1px solid #f0f0f0
    }`,
    `.root .profile-row > svg {
      margin-top: 5px;
      color: #8a8f94
    }`,
    `.root .profile-row-content { min-width: 0; flex: 1 }`,
    `.root .profile-label {
      color: #707579;
      font-size: .75rem;
      
      margin-bottom: 2px
    }`,
    `.root .profile-value {
      display: block;
      font-size: 15px;
      text-align: right;
      overflow-wrap: anywhere;
      white-space: pre-wrap;
      text-decoration: none;
      color: #222222
    }`,
    `.root a.profile-value { color: var(--accent);    font-weight: bold;
 }`,

    `@media(prefers-reduced-motion:reduce) {
      .root .agent-profile { transition: none }
    }`,

    // 15. پس‌زمینهٔ گفتگو و لایه‌های تصاویر
    `.root .body {
      background-color: #cfe8c8;
      position: relative;
      z-index: 1;
      flex: 1;
      min-height: 0
    }`,
    `.root .body::before {
      content: "";
      background-image: var(--chat-texture);
      position: absolute;
      inset: 0;
      background-repeat: no-repeat;
      background-position: center;
      background-size: cover;
      z-index: -1;
      pointer-events: none
    }`,
    `.root .body::after {
      content: "";
      position: absolute;
      inset: 0;
      background-repeat: repeat;
      background-position: top right;
      background-size: 510px auto;
      mix-blend-mode: overlay;
      background-image: var(--chat-pattern);
      z-index: -1;
      pointer-events: none
    }`,

    // 16. فهرست پیام‌ها و اسکرول‌بار
    `.root .msgs {
      position: absolute;
      inset: 0;
      overflow-y: auto;
      overflow-x: hidden;
      padding: .75rem .75rem .875rem;
      display: flex;
      flex-direction: column;
      gap: .5rem;
      overscroll-behavior: contain;
      scrollbar-width: thin;
      scrollbar-color: transparent transparent
    }`,
    `.root .msgs:hover {
  scrollbar-color: rgba(5,46,22,.25) transparent;
  scrollbar-color: color-mix(in srgb, var(--accent-soft-light) 25%, transparent) transparent
}`,

    `.root .msgs::-webkit-scrollbar {
  width: .25rem
}`,
    `.root .msgs::-webkit-scrollbar-track {
  background: transparent
}`,
    `.root .msgs::-webkit-scrollbar-thumb {
  background: transparent;
  border-radius: 999px
}`,
    `.root .msgs:hover::-webkit-scrollbar-thumb {
  background: rgba(5,46,22,.25);
  background: color-mix(in srgb, var(--accent-soft-light) 25%, transparent)
}`,

    // 17. تاریخ و پیام‌های سیستمی
    `.root .pill {
      background: rgba(35,55,43,.48);
      color: #ffffff;
      border-radius: 999px;
      padding: .1875rem .6875rem;
      font-size: .75rem;
      font-weight: 500;
      box-shadow: 0 .0625rem .125rem rgba(0,0,0,.04);
      backdrop-filter: blur(.3125rem);
      -webkit-backdrop-filter: blur(.3125rem)
    }`,
    `.root .row.day,.root .row.sys {
      justify-content: center;
      margin: .4375rem 0
    }`,

    // 18. حباب پیام‌ها، نوشته و اطلاعات ارسال
    `.root .row.out .bubble {
      border-end-end-radius: .9375rem;
      border-start-end-radius: .9375rem;
      border-start-start-radius: .9375rem
    }`,
    `.bubble {
      background-color: #eeffde;
      color: #334155;
      max-width: 70%;
      position: relative;
      overflow-wrap: anywhere;
      word-break: break-word;
      cursor: default;
      filter: drop-shadow(0 .125rem .09375rem rgba(5,46,22,0.26));
      padding: .5rem
    }`,
    `.message-appendix .corner {
      fill: var(--message-appendix-color,#EEFFDE)
    }`,
    `.root .row .bubble .message-appendix {
      position: absolute;
      display: block;
      pointer-events: none;
      z-index: 2;
    }`,
    `.message-appendix-out {
      inset-inline-start: -10px;
      bottom: -4px;
      width: 11px;
      height: 23px
    }`,
    `.message-appendix-in {
      inset-inline-end: -11px;
      transform: scaleX(-1);
      bottom: -3px;
      width: 12px;
      height: 22px
    }`,
    `.root .row.in .bubble {
      border-end-start-radius: .9375rem;
      border-start-end-radius: .9375rem;
      border-start-start-radius: .9375rem
    }`,
    `.root .txt {
      white-space: pre-wrap;
      font-size: 16px;
      unicode-bidi: plaintext;
      line-height: 1.65;
      color: inherit;
      overflow-wrap: anywhere
    }`,
    `.root .txt a {
      color: #16834b;
      text-decoration: underline;
      text-underline-offset: .125rem;
      direction: ltr;
      unicode-bidi: isolate
    }`,
    `.root .row.out .txt a {
      color: #075e35
    }`,
    `.root .meta {
      display: flex;
      align-items: center;
      gap: .25rem;
      justify-content: flex-end;
      margin-top: .125rem;
      font-size: .65625rem;
      opacity: 1;
      direction: rtl;
      line-height: 1.3;
      color: #64748b
    }`,
    `.root .row.out .meta {
      color: rgba(5,46,22,.62)
    }`,
    `.root .meta svg {
      width: .875rem;
      height: .875rem
    }`,
    `.root .row.out .meta svg {
      color: #16834b
    }`,
    `.root .bubble.err {
      outline: .0625rem solid #e2474c
    }`,

    // 19. پیش‌نمایش ریپلای
    `.root .quote {
      display: block;
      width: 100%;
      text-align: right;
      border-inline-start: 3px solid #00c951;
      background: rgba(0,201,81,.09);
      border-radius: .3125rem;
      padding: .25rem .5rem;
      margin: 0 0 .375rem;
      font-size: .75rem;
      overflow: hidden
    }`,
    `.root .quote b {
      display: block;
      font-weight: 600;
      opacity: .9;
      color: #16834b;
      font-size: .75rem
    }`,
    `.root .quote span {
      display: block;
      opacity: .85;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      unicode-bidi: plaintext;
      color: #526273
    }`,
    `.root .row.out .quote {
      border-inline-start-color: #16834b
    }`,

    // 20. دکمهٔ رفتن به آخر گفتگو
    `.root .fab {
      position: absolute;
      bottom: .875rem;
      left: .75rem;
      width: 2.375rem;
      height: 2.375rem;
      border-radius: 50%;
      background: #ffffff;
      color: #536579;
      box-shadow: 0 .125rem .5rem rgba(5,46,22,.16);
      display: grid;
      place-items: center;
      opacity: 0;
      pointer-events: none;
      transform: translateY(.5rem);
      transition: .2s;
      z-index: 4;
      border: 1px solid rgba(5,46,22,.06)
    }`,
    `.root .fab:hover {
      background: #f8faf9;
      color: #16834b
    }`,

    // 21. منوی عملیات پیام
    `.root .menu {
      position: absolute;
      z-index: 8;
      min-width: 10.25rem;
      background: rgba(255,255,255,.98);
      border-radius: .8125rem;
      padding: .25rem;
      box-shadow: 0 .5rem 1.75rem rgba(5,46,22,.2);
      animation: pop .15s ease-out;
      border: 1px solid rgba(5,46,22,.06);
      backdrop-filter: blur(.75rem);
      -webkit-backdrop-filter: blur(.75rem)
    }`,
    `.root .menu button {
      display: flex;
      align-items: center;
      gap: .5625rem;
      width: 100%;
      padding: .5625rem .6875rem;
      border-radius: .5625rem;
      font-size: .8125rem;
      text-align: right;
      min-height: 2.5rem;
      color: #17212b
    }`,
    `.root .menu button:hover {
      background: #f0f5f2
    }`,
    `.root .menu button:active {
      background: #e7eee9
    }`,
    `.root .menu svg {
      color: #657568;
      width: 1.125rem;
      height: 1.125rem
    }`,

    // 22. نوار ریپلای و ویرایش
    `.root .banner {
      display: none;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      border-bottom: 1px solid #edf0f2
    }`,
    `.root .banner .bi {
      color: var(--accent)
    }`,
    `.root .banner .bt {
      flex: 1;
      min-width: 0;
      border-inline-start: 2px solid var(--accent-soft-light);
      padding: 2px 10px;
      font-size: .75rem;
      cursor: pointer
    }`,
    `.root .banner .bt b {
      display: block;
      color: var(--accent);
      font-weight: 600;
      font-size: 13px
    }`,
    `.root .banner .bt span {
      display: block;
      color: #64748b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      unicode-bidi: plaintext
    }`,

    // 23. قسمت ارسال؛ رنگ‌های ثابت زمینه، متن و دکمه
    `.root .dock {
      flex-shrink: 0;
      position: relative;
      background: #ffffff;
      border-top: 1px solid #e7e9eb;
      z-index: 6;
      padding: 0 8px env(safe-area-inset-bottom,0px)
    }`,
    `.root .composer {
      display: flex;
      align-items: flex-end;
      gap: 4px;
      padding: 7px 0
    }`,
    `.root .field {
      flex: 1;
      min-width: 0;
      display: flex;
      align-items: flex-end;
      background: transparent;
      border-radius: 0;
      padding: 0;
      min-height: 44px;
      border: 0;
      box-shadow: none;
      gap: 4px
    }`,
    `.root .field:focus-within {
      box-shadow: none
    }`,
    `.root .ta {
      --composer-min-height: 38px;
      --composer-max-height: 158px;
      flex: 1;
      min-width: 0;
      resize: none;
      border: 0;
      outline: 0;
      background: transparent;
      max-height: var(--composer-limit,var(--composer-max-height));
      height: var(--composer-min-height);
      padding: 7px 0;
      line-height: 24px;
      font-size: 16px;
      overflow-y: hidden;
      overscroll-behavior-y: contain;
      scrollbar-width: thin;
      unicode-bidi: plaintext;
      min-height: var(--composer-min-height);
      color: #222222;
      margin-block: 3px
    }`,
    `.root .ta::placeholder {
      color: #a2a6a9;
      opacity: 1
    }`,
    `.root button.ib {
      width: 44px;
      height: 44px;
      flex: none;
      border-radius: 50%;
      color: #707579;
      display: grid;
      place-items: center;
      transition: color .15s,background .15s
    }`,

    `.root .ib svg {
      width: 1.5rem;
      height: 1.5rem
    }`,
    `.root .send {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: transparent;
      color: var(--accent);
      display: grid;
      place-items: center;
      flex: none;
      transition: background .15s,transform .15s,color .15s;
      box-shadow: none
    }`,
    `.root .send:hover {
      background: #edf5fd
    }`,
    `.root .send:active {
      transform: scale(.92)
    }`,
    `.root .send[disabled] {
      opacity: 1;
      cursor: default;
      background: transparent;
      color: #a2a6a9
    }`,

    // 24. پنل ایموجی
    `.root .emoji {
      position: absolute;
      bottom: 100%;
      left: .5rem;
      right: .5rem;
      height: 16.5rem;
      background: #ffffff;
      border-radius: 1rem 1rem 0 0;
      box-shadow: 0 -.3125rem 1.375rem rgba(5,46,22,.13);
      display: none;
      flex-direction: column;
      overflow: hidden;
      animation: rise .2s ease-out;
      z-index: 7;
      border: 1px solid rgba(5,46,22,.07);
      border-bottom: 0
    }`,
    `.root .etabs {
      display: flex;
      border-bottom: 1px solid rgba(5,46,22,.08)
    }`,
    `.root .etab.on::after {
      content: "";
      position: absolute;
      bottom: -.0625rem;
      left: 22%;
      right: 22%;
      height: .1875rem;
      border-radius: .1875rem .1875rem 0 0;
      background: var(--accent)
    }`,
    `.root .eb {
      aspect-ratio: 1;
      font-size: 1.5rem;
      line-height: 1;
      border-radius: .5625rem;
      display: grid;
      place-items: center;
      font-family: "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif
    }`,
    `.root .eb:hover {
      background: #f0f6f2
    }`,

    // 25. فرم ورود؛ رنگ‌های وابسته به تنظیمات و رنگ خطا
    `.root .hero h2 {
      margin: 0 0 20px;
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--accent-soft-dark)
    }`,
    `.root .inp {
      width: 100%;
      height: 3rem;
      border: 2px solid transparent;
      border-radius: .75rem;
      padding: 0 .875rem;
      background: #ffffff;
      outline: 0;
      transition: border-color .15s,box-shadow .15s;
      font-size: 16px;
      color: #17212b
    }`,
    `.root .inp:focus {
      border-color: var(--accent)
    }`,
    `.root .inp.bad {
      border-color: #e2474c
    }`,

    // 26. فاصله‌ها و خطاهای اختصاصی فرم ورود
    `.root .login-view {
      padding: calc(60px + env(safe-area-inset-top,0px)) 24px calc(24px + env(safe-area-inset-bottom,0px));
      gap: 24px;
      scroll-padding-block: 16px
    }`,
    `.root .login-view > .hero {
      flex: none;
      margin: 0
    }`,
    `.root .login-view .logo {
      flex: none;
      margin-bottom: 16px
    }`,
    `.root .login-view .hero h2 {
      margin: 0 0 20px;
      font-size: 20px;
      line-height: 1.5
    }`,
    `.root .login-view .hero p {
      margin: 0;
      max-width: 280px;
      font-size: 16px;
      color: var(--accent-soft-dark)
    }`,
    `.root .login-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      flex: none;
      width: 100%;
      max-width: 360px;
      margin: 0 auto
    }`,
    `.root .login-form .fld {
      margin: 0
    }`,
    `.root .login-form .login-label-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      height: 20px;
      margin-bottom: 8px;
      font-size: .75rem;
      line-height: 20px;
      color: var(--accent-soft-dark);
      white-space: nowrap
    }`,
    `.root .login-form .field-error {
      color: var(--danger);
      text-align: end;
      font-size: .75rem;
    }`,
    `.root .login-actions .form-error {
      min-height: 0;
      margin: 0 0 8px;
      font-size: .75rem;
      line-height: 20px;
      overflow-wrap: anywhere
    }`,
    `.root .login-actions .form-error:empty {
      display: none
    }`,
    `.root .login-view > .x {
      width: 44px;
      height: 44px;
      top: calc(4px + env(safe-area-inset-top,0px));
      left: 4px
    }`,
    `.root .login-view button:focus-visible {
      outline: 2px solid var(--accent-soft-dark);
      outline-offset: 3px
    }`,
    `@media(max-width:360px),(max-height:560px) {
      .root .login-view {
        padding-inline: 20px;
        gap: 20px
      }
      .root .login-view .logo {
        width: 56px;
        height: 56px;
        margin-bottom: 12px
      }
      .root .login-view .hero h2 {
        font-size: 18px
      }
      .root .login-view .hero p {
        font-size: .75rem;
        line-height: 1.7
      }
    }`,

    // 27. ظاهر نهایی ورودی‌های کد تأیید
    `.root input.otp-i {
      border: 2px solid #dfe8e2;
      border-radius: .75rem;
      background: #ffffff
    }`,
    `.root input.otp-i:focus {
      border-color: var(--accent)
    }`,
    `.root input.otp-i.filled {
      border-color: var(--accent-soft-dark);
    }`,

    // 28. اعلان‌ها و وضعیت تمام‌صفحه
    `.root .toast {
      position: absolute;
      bottom: 5.25rem;
      left: 50%;
      transform: translate(-50%,.75rem);
      background: rgba(23,33,43,.94);
      color: #fff;
      border-radius: 999px;
      padding: .4375rem 1rem;
      font-size: .8125rem;
      opacity: 0;
      pointer-events: none;
      transition: .25s;
      z-index: 9;
      white-space: nowrap;
      max-width: 90%;
      overflow: hidden;
      text-overflow: ellipsis;
      border: 1px solid rgba(255,255,255,.08);
      box-shadow: 0 .25rem 1rem rgba(5,46,22,.16)
    }`,
    `.root .sc-full {
      ;
      -webkit-backdrop-filter: blur(10px);
      backdrop-filter: blur(10px);
      pointer-events: auto
    }`,

    // 29. ظاهر موبایل و کاهش حرکت
    `@media(max-width:40rem) {
      .root .panel {
        width: 100%;
        border: 0;
        box-shadow: none;
        background: #ffffff
      }
      .root .hdr {
        min-height: calc(3.75rem + env(safe-area-inset-top,0px));
        padding-top: calc(.5rem + env(safe-area-inset-top,0px));
        padding-bottom: .5rem
      }
      .root .msgs {
        padding: .625rem .5625rem .75rem
      }
      .root .bubble {
        max-width: 86%;
        padding: .4375rem .5625rem .3125rem
      }
      .root .dock {
        padding-left: .4375rem;
        padding-right: .4375rem
      }
      .root .composer {
        gap: .4375rem
      }
      .root .send {
        width: 44px;
        height: 44px
      }
    }`,
    `@media(prefers-reduced-motion:reduce) {
      .root .bubble,.root .menu,.root .emoji {
        animation: none!important;
        transition: none!important
      }
    }`,

    // 30. نمایش کشیدن پیام برای ریپلای
    `.row.is-swiping {
      transition: none!important;
      user-select: none;
      -webkit-user-select: none
    }`,
    `.reply-swipe-hint {
      position: absolute;
      top: 50%;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      color: var(--accent);
      background: rgba(0,201,81,.16);
      opacity: 0;
      transform: translateY(-50%) scale(.6);
      pointer-events: none;
      transition: opacity .12s ease,transform .12s ease;
    }`,
    `.row.out .reply-swipe-hint {
      right: -34px;
      left: auto;
    }`,
    `.row.in .reply-swipe-hint {
      left: -34px;
      right: auto;
      transform: translateY(-50%) scale(.6) scaleX(-1);
    }`,
    `.row.flash .bubble {
      animation: coco-reply-flash .9s ease;
    }`,
    `@keyframes coco-reply-flash {
      0%,100% {
        box-shadow: 0 0 0 0 rgba(0,201,81,0)
      }
      35% {
        box-shadow: 0 0 0 .25rem rgba(0,201,81,.3)
      }
    }`,
  ].join('\n');

  function hexToRgba(hex, a) {
    var n = parseInt(hex.slice(1), 16);
    return (
      'rgba(' +
      ((n >> 16) & 255) +
      ',' +
      ((n >> 8) & 255) +
      ',' +
      (n & 255) +
      ',' +
      a +
      ')'
    );
  }

  function UI(cfg, mm, A, events) {
    this.cfg = cfg;
    this.mm = mm;
    this.A = A;
    this.events = events;
    this.rows = {};
    this.lastDay = null;
    this.stick = true;
    this.menuFor = null;
    this.otpInputs = [];
    this.otpBusy = false;
    this.busy = false;
    this.locked = false;
    this.mode = 'normal';
    this.profileOpen = false;
  }

  UI.prototype.registerFonts = function () {
    this.fontFaces = [];
    if (!window.FontFace || !document.fonts) return;
    var base = new URL(this.cfg.assetsBase || '.', location.href);
    if (!/\/$/.test(base.pathname)) base.pathname += '/';
    var weights = [
      [300, 'Light'],
      [400, 'Regular'],
      [500, 'Medium'],
      [600, 'SemiBold'],
      [700, 'Bold'],
      [800, 'ExtraBold'],
      [900, 'Black'],
    ];
    var self = this;
    weights.forEach(function (entry) {
      var url = new URL(
        'Fonts/peyad/PeydaWebFaNum-' + entry[1] + '.woff2',
        base.href
      ).href;
      var face = new window.FontFace(
        'CocoChatPeyda',
        'url(' + JSON.stringify(url) + ') format("woff2")',
        { weight: String(entry[0]), style: 'normal', display: 'swap' }
      );
      document.fonts.add(face);
      self.fontFaces.push(face);
    });
  };

  UI.prototype.mount = function (shadow) {
    var self = this,
      cfg = this.cfg;
    this.registerFonts();
    var style = document.createElement('style');
    style.textContent = CSS;
    shadow.appendChild(style);
    this.root = h('div', {
      class: 'root pos-' + cfg.position,
      'data-theme': cfg.theme,
      dir: 'rtl',
      lang: 'fa',
    });
    if (cfg.accent) this.root.style.setProperty('--accent', cfg.accent);
    if (cfg.text) this.root.style.setProperty('--text', cfg.text);

    var assetsBase = new URL(cfg.assetsBase || '.', location.href);
    if (!/\/$/.test(assetsBase.pathname)) assetsBase.pathname += '/';
    this.root.style.setProperty(
      '--chat-texture',
      'url(' +
        JSON.stringify(
          new URL('Image/chat-Textures.png', assetsBase.href).href
        ) +
        ')'
    );
    this.root.style.setProperty(
      '--chat-pattern',
      'url(' +
        JSON.stringify(new URL('Image/chat-bg.png', assetsBase.href).href) +
        ')'
    );

    this.launcher =
      cfg.launcher === 'hidden'
        ? null
        : h(
            'button',
            {
              class: 'launcher',
              type: 'button',
              'aria-label': T.open,
              'aria-expanded': 'false',
              on: {
                click: function () {
                  self.toggle();
                },
              },
            },
            icon('chat')
          );
    this.panel = h(
      'div',
      {
        class: 'panel',
        role: 'dialog',
        'aria-label': T.brand,
        'aria-hidden': 'true',
      },
      h('div', { class: 'cover_content' })
    );
    this.panel.inert = true;
    this.views = {
      login: this.buildLogin(),
      otp: this.buildOtp(),
      boot: this.buildBoot(),
      expired: this.buildExpired(),
      chat: this.buildChat(),
    };
    for (var k in this.views) this.panel.appendChild(this.views[k]);
    if (this.launcher) this.root.appendChild(this.launcher);
    this.root.appendChild(this.panel);
    shadow.appendChild(this.root);
    if (cfg.mock) {
      // The mock avatar uses the same resolved CSS color as the widget.
      cfg.resolvedAccent = window
        .getComputedStyle(this.root)
        .getPropertyValue('--accent')
        .trim();
    }
    this.shadow = shadow;
    this.observeComposer();

    // Mobile keyboard / visual viewport handling (scoped to our own root)
    var vv = window.visualViewport;
    if (vv) {
      var upd = function () {
        self.root.style.setProperty('--vvh', vv.height + 'px');
        self.root.style.setProperty('--vvt', vv.offsetTop + 'px');
      };
      upd();
      this.events.add(vv, 'resize', upd);
      this.events.add(vv, 'scroll', upd);
    }
    this.events.add(shadow, 'keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (self.profileOpen) self.closeProfile();
      else if (self.menuFor) self.closeMenu();
      else if (self.emojiPanel.classList.contains('on'))
        self.toggleEmoji(false);
      else if (self.mode !== 'normal') self.A.onCancelCompose();
      else self.close();
    });
    this.events.add(shadow, 'pointerdown', function (e) {
      if (
        self.menuFor &&
        !e.composedPath().some(function (n) {
          return n === self.menu;
        })
      )
        self.closeMenu();
    });
    this.mm.on('add', function (m) {
      self.onAdd(m);
    });
    this.mm.on('update', function (m) {
      self.onUpdate(m);
    });
    this.mm.on('stream', function (m) {
      self.onStream(m);
    });
    this.mm.on('idchange', function (m, old) {
      var r = self.rows[old];
      if (r) {
        delete self.rows[old];
        self.rows[m.id] = r;
      }
    });
    this.mm.on('remove', function (m) {
      var r = self.rows[m.id];
      if (r && r.el.parentNode) r.el.parentNode.removeChild(r.el);
      delete self.rows[m.id];
    });
    this.mm.on('reset', function () {
      self.clearMessages();
    });
  };

  UI.prototype.isOpen = function () {
    return this.root.classList.contains('open');
  };
  UI.prototype.open = function () {
    if (this.isOpen()) return;
    this.returnFocus = this.shadow.activeElement || document.activeElement;
    this.updatePanelMotion();
    // Commit the closed state before starting the transition.
    void this.panel.offsetWidth;
    this.panel.inert = false;
    this.panel.setAttribute('aria-hidden', 'false');
    this.root.classList.add('open');
    if (this.launcher) this.launcher.setAttribute('aria-expanded', 'true');
    this.A.onOpen && this.A.onOpen();
    var self = this;
    this.focusTimer = this.events.timeout(
      function () {
        self.focusTimer = 0;
        if (self.isOpen()) self.focusPrimary();
      },
      window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion:reduce)').matches
        ? 0
        : 470
    );
  };
  UI.prototype.close = function () {
    if (!this.isOpen()) return;
    this.closeProfile(false);
    if (this.focusTimer) {
      this.events.clearTimeout(this.focusTimer);
      this.focusTimer = 0;
    }
    this.panel.inert = true;
    this.panel.setAttribute('aria-hidden', 'true');
    this.root.classList.remove('open');
    if (this.launcher) this.launcher.setAttribute('aria-expanded', 'false');
    this.toggleEmoji(false);
    this.closeMenu();
    this.A.onClose && this.A.onClose();
    var focusTarget = this.returnFocus;
    if (focusTarget && focusTarget.isConnected && focusTarget.focus)
      focusTarget.focus({ preventScroll: true });
  };
  UI.prototype.toggle = function () {
    if (this.isOpen()) this.close();
    else this.open();
  };
  /* Apply launcher and panel position */

  UI.prototype.setPosition = function (settings) {
    if (!settings || !this.root || !this.panel) {
      return;
    }

    var position = settings.position;
    var offsetX = settings.offsetX;
    var offsetY = settings.offsetY;

    var isLeft = /-left$/.test(position);
    var isMiddle = position.indexOf('middle-') === 0;
    this.panelPosition = settings;
    this.root.style.setProperty('--panel-base-y', isMiddle ? '-50%' : '0px');
    var launcherGap = this.launcher ? this.launcher.offsetHeight + 14 : 0;
    var launcherGapX = this.launcher ? this.launcher.offsetWidth + 14 : 0;

    var x = offsetX + 'px';

    // در موقعیت میانی، پنل کنار دکمه قرار می‌گیرد.
    var panelX = (isMiddle ? offsetX + launcherGapX : offsetX) + 'px';

    var y = offsetY + 'px';

    // به‌روزرسانی کلاس موقعیت
    COCO_POSITIONS.forEach(function (p) {
      this.root.classList.remove('pos-' + p);
    }, this);

    this.root.classList.add('pos-' + position);

    // موقعیت افقی لانچر
    if (this.launcher) {
      this.launcher.style.left = isLeft ? x : 'auto';
      this.launcher.style.right = isLeft ? 'auto' : x;
    }

    // موقعیت افقی پنل
    this.panel.style.left = isLeft ? panelX : 'auto';
    this.panel.style.right = isLeft ? 'auto' : panelX;

    if (position.indexOf('bottom-') === 0) {
      // پایین: پنل به سمت بالا باز می‌شود.
      if (this.launcher) {
        this.launcher.style.top = 'auto';
        this.launcher.style.bottom = y;
      }

      this.panel.style.top = 'auto';
      this.panel.style.bottom = offsetY + launcherGap + 'px';
    } else if (position.indexOf('top-') === 0) {
      // بالا: پنل به سمت پایین باز می‌شود.
      if (this.launcher) {
        this.launcher.style.top = y;
        this.launcher.style.bottom = 'auto';
      }

      this.panel.style.top = offsetY + launcherGap + 'px';
      this.panel.style.bottom = 'auto';
    } else {
      // وسط: پنل در کنار دکمه قرار می‌گیرد.
      if (this.launcher) {
        this.launcher.style.top =
          'calc(50% - ' + this.launcher.offsetHeight / 2 + 'px + ' + y + ')';
        this.launcher.style.bottom = 'auto';
      }

      this.panel.style.top = 'calc(50% + ' + y + ')';

      this.panel.style.bottom = 'auto';
    }

    // جلوگیری از خروج پنل از محدوده عمودی صفحه
    var vh = window.innerHeight || document.documentElement.clientHeight || 800;

    var available = isMiddle
      ? vh - 2 * offsetY - 32
      : vh - offsetY - launcherGap - 16;

    this.root.style.setProperty(
      '--panel-height',
      Math.max(0, Math.min(660, available)) + 'px'
    );
    this.updatePanelMotion();
  };
  UI.prototype.updatePanelMotion = function () {
    if (!this.panelPosition) return;
    var position = this.panelPosition.position;
    var rootStyle = this.root.style;
    var isLeft = /-left$/.test(position);
    var isMiddle = position.indexOf('middle-') === 0;
    var isTop = position.indexOf('top-') === 0;
    rootStyle.setProperty('--panel-origin-x', isLeft ? '0%' : '100%');
    rootStyle.setProperty(
      '--panel-origin-y',
      isMiddle ? '50%' : isTop ? '0%' : '100%'
    );
    rootStyle.setProperty('--panel-closed-y', isTop ? '-64px' : '64px');
    rootStyle.setProperty('--panel-tilt', isLeft ? '-6deg' : '6deg');
  };
  UI.prototype.focusPrimary = function () {
    if (this.profileOpen) return;
    var v = this.activeView;
    if (v === 'login') this.nameInp.focus({ preventScroll: true });
    else if (v === 'otp' && this.otpInputs[0])
      this.otpInputs[0].focus({ preventScroll: true });
    else if (v === 'chat' && !matchMedia('(pointer:coarse)').matches)
      this.ta.focus({ preventScroll: true });
  };
  UI.prototype.showView = function (name) {
    if (name !== 'chat') this.closeProfile(false);
    this.activeView = name;
    for (var k in this.views)
      this.views[k].classList.toggle('active', k === name);
    if (name === 'chat') this.autosize();
    if (this.isOpen()) this.focusPrimary();
  };

  /* ---------- login ---------- */
  UI.prototype.closeBtn = function () {
    var self = this;
    return h(
      'button',
      {
        class: 'x',
        type: 'button',
        'aria-label': T.close,
        on: {
          click: function () {
            self.close();
          },
        },
      },
      icon('close')
    );
  };
  UI.prototype.buildLogin = function () {
    var self = this;
    this.nameInp = h('input', {
      class: 'inp',
      type: 'text',
      autocomplete: 'name',
      placeholder: T.namePh,
      maxlength: '80',
      enterkeyhint: 'next',
      required: true,
      'aria-invalid': 'false',
      'aria-labelledby': 'coco-login-name-label',
      'aria-describedby': 'coco-login-name-error',
      on: {
        keydown: function (e) {
          if (e.key === 'Enter' && !e.isComposing) {
            e.preventDefault();
            if (!self.loginBusy) self.mobInp.focus();
          }
        },
        input: function () {
          if (self.loginErrorField === 'name') self.setLoginError(null, '');
        },
      },
    });
    this.mobInp = h('input', {
      class: 'inp',
      type: 'tel',
      dir: 'ltr',
      inputmode: 'tel',
      autocomplete: 'tel',
      placeholder: T.mobilePh,
      maxlength: '16',
      enterkeyhint: 'go',
      required: true,
      'aria-invalid': 'false',
      'aria-labelledby': 'coco-login-mobile-label',
      'aria-describedby': 'coco-login-mobile-error',
      on: {
        input: function () {
          if (self.loginErrorField === 'mobile') self.setLoginError(null, '');
        },
      },
    });
    this.nameErr = h('span', {
      id: 'coco-login-name-error',
      class: 'field-error',
      role: 'alert',
      'aria-atomic': 'true',
    });
    this.mobileErr = h('span', {
      id: 'coco-login-mobile-error',
      class: 'field-error',
      role: 'alert',
      'aria-atomic': 'true',
    });
    this.loginErr = h('div', {
      id: 'coco-login-error',
      class: 'form-error',
      role: 'alert',
      'aria-atomic': 'true',
    });
    this.loginBtn = h(
      'button',
      { class: 'btn', type: 'submit' },
      h('span', { text: T.getCode })
    );
    var form = h(
      'form',
      {
        class: 'login-form',
        novalidate: true,
        on: {
          submit: function (e) {
            e.preventDefault();
            if (self.loginBusy) return;
            self.A.onRequestOtp(self.nameInp.value.trim(), self.mobInp.value);
          },
        },
      },
      h(
        'label',
        { class: 'fld' },
        h(
          'span',
          { class: 'login-label-row' },
          h('span', { id: 'coco-login-name-label', text: T.name }),
          this.nameErr
        ),
        this.nameInp
      ),
      h(
        'label',
        { class: 'fld' },
        h(
          'span',
          { class: 'login-label-row' },
          h('span', { id: 'coco-login-mobile-label', text: T.mobile }),
          this.mobileErr
        ),
        this.mobInp
      ),
      h('div', { class: 'login-actions' }, this.loginErr, this.loginBtn)
    );
    return h(
      'section',
      { class: 'view card-view login-view' },
      this.closeBtn(),
      h(
        'div',
        { class: 'hero' },
        h('div', { class: 'logo' }, icon('chat')),
        h('h2', { text: T.welcomeTitle }),
        h('p', { text: T.welcomeSub })
      ),
      form
    );
  };
  UI.prototype.setLoginBusy = function (b) {
    this.loginBusy = b;
    this.views.login.setAttribute('aria-busy', b ? 'true' : 'false');
    this.loginBtn.disabled = b;
    this.nameInp.disabled = b;
    this.mobInp.disabled = b;
    this.loginBtn.textContent = '';
    this.loginBtn.appendChild(
      b ? h('span', { class: 'spin' }) : h('span', { text: T.getCode })
    );
  };
  UI.prototype.setLoginError = function (field, msg) {
    field = msg ? field : null;
    this.loginErrorField = field;
    this.nameErr.textContent = field === 'name' ? msg : '';
    this.mobileErr.textContent = field === 'mobile' ? msg : '';
    this.loginErr.textContent = !field ? msg || '' : '';
    this.nameInp.classList.toggle('bad', field === 'name');
    this.mobInp.classList.toggle('bad', field === 'mobile');
    this.nameInp.setAttribute(
      'aria-invalid',
      field === 'name' ? 'true' : 'false'
    );
    this.mobInp.setAttribute(
      'aria-invalid',
      field === 'mobile' ? 'true' : 'false'
    );
    if (field === 'name') this.nameInp.focus();
    else if (field === 'mobile') this.mobInp.focus();
  };

  /* ---------- otp ---------- */

  UI.prototype.buildOtp = function () {
    var self = this;

    this.otpRow = h('div', {
      class: 'otp-row',
      dir: 'ltr',
    });

    this.otpErr = h('div', {
      class: 'form-error',
      role: 'alert',
      style: 'text-align:center',
    });

    this.otpSub = h('p', {
      class: 'sub',
    });

    this.otpBtn = h(
      'button',
      {
        class: 'btn',
        type: 'button',
        on: {
          click: function () {
            self.submitOtp();
          },
        },
      },
      h('span', { text: T.verify })
    );

    this.resendBtn = h('button', {
      class: 'resend',
      type: 'button',
      hidden: true,
      text: T.resend,
      on: {
        click: function () {
          self.A.onResendOtp();
        },
      },
    });

    this.timerEl = h('p', {
      class: 'hintline',
    });

    this.mockHint = h('p', {
      class: 'hintline',
      text: T.mockHint,
      hidden: !this.cfg.mock,
    });

    var back = h('button', {
      class: 'ghost',
      type: 'button',
      text: T.editNumber,
      on: {
        click: function () {
          self.A.onBackToLogin();
        },
      },
    });

    var otpFooter = h(
      'div',
      {
        class: 'otp-footer',
      },
      h(
        'div',
        {
          class: 'otp-footer-resend',
        },
        this.timerEl,
        this.resendBtn
      ),
      back
    );

    return h(
      'section',
      {
        class: 'view card-view',
      },
      this.closeBtn(),
      h(
        'div',
        {
          class: 'hero',
        },
        h('div', { class: 'logo' }, icon('check')),
        h('h2', { text: T.otpTitle }),
        this.otpSub
      ),
      this.otpRow,
      this.otpErr,
      this.otpBtn,
      otpFooter,
      this.mockHint
    );
  };

  UI.prototype.showOtp = function (mobile, len, resendAfter) {
    var self = this;
    this.otpLen = len || 6;
    this.otpSub.textContent = '';
    this.otpSub.append(
      T.otpSub + ' ',
      h('bdi', { text: mobile, dir: 'ltr' }),
      ' ' + T.otpSub2
    );
    this.otpRow.textContent = '';
    this.otpInputs = [];
    for (var i = 0; i < this.otpLen; i++)
      (function (i) {
        var inp = h('input', {
          class: 'otp-i',
          type: 'text',
          inputmode: 'numeric',
          maxlength: '1',
          autocomplete: i === 0 ? 'one-time-code' : 'off',
          'aria-label': i + 1 + '/' + self.otpLen,
        });
        inp.addEventListener('input', function () {
          var v = latin(inp.value).replace(/\D/g, '');
          if (v.length > 1) return self.fillOtp(i, v);
          inp.value = v;
          inp.classList.toggle('filled', !!v);
          if (v && i < self.otpLen - 1) self.otpInputs[i + 1].focus();
          self.otpErr.textContent = '';
          self.otpRow.classList.remove('shake');
          self.maybeSubmitOtp();
        });
        inp.addEventListener('keydown', function (e) {
          if (e.key === 'Backspace' && !inp.value && i > 0) {
            e.preventDefault();
            var p = self.otpInputs[i - 1];
            p.value = '';
            p.classList.remove('filled');
            p.focus();
          } else if (e.key === 'ArrowLeft' && i > 0) {
            e.preventDefault();
            self.otpInputs[i - 1].focus();
          } else if (e.key === 'ArrowRight' && i < self.otpLen - 1) {
            e.preventDefault();
            self.otpInputs[i + 1].focus();
          } else if (e.key === 'Enter') {
            e.preventDefault();
            self.submitOtp();
          }
        });
        inp.addEventListener('paste', function (e) {
          e.preventDefault();
          var t =
            (e.clipboardData || window.clipboardData).getData('text') || '';
          self.fillOtp(i, latin(t).replace(/\D/g, ''));
        });
        inp.addEventListener('focus', function () {
          inp.select();
        });
        self.otpRow.appendChild(inp);
        self.otpInputs.push(inp);
      })(i);
    this.setOtpBusy(false);
    this.otpErr.textContent = '';
    this.startTimer(resendAfter || 60);
  };
  UI.prototype.fillOtp = function (start, digits) {
    var j = 0;
    for (var i = start; i < this.otpLen && j < digits.length; i++, j++) {
      this.otpInputs[i].value = digits[j];
      this.otpInputs[i].classList.add('filled');
    }
    this.otpInputs[Math.min(start + j, this.otpLen - 1)].focus();
    this.maybeSubmitOtp();
  };
  UI.prototype.otpCode = function () {
    return this.otpInputs
      .map(function (i) {
        return i.value;
      })
      .join('');
  };
  UI.prototype.maybeSubmitOtp = function () {
    if (this.otpCode().length === this.otpLen) this.submitOtp();
  };
  UI.prototype.submitOtp = function () {
    if (this.otpBusy) return;
    var c = this.otpCode();
    if (c.length !== this.otpLen) {
      this.setOtpError(T.otpIncomplete, false);
      return;
    }
    this.A.onVerifyOtp(c);
  };
  UI.prototype.setOtpBusy = function (b) {
    this.otpBusy = b;
    this.otpBtn.disabled = b;
    this.otpBtn.textContent = '';
    this.otpBtn.appendChild(
      b ? h('span', { class: 'spin' }) : h('span', { text: T.verify })
    );
    this.otpInputs.forEach(function (i) {
      i.disabled = b;
    });
  };
  UI.prototype.setOtpError = function (msg, clear) {
    var self = this;
    this.otpErr.textContent = msg;
    this.otpRow.classList.remove('shake');
    void this.otpRow.offsetWidth;
    this.otpRow.classList.add('shake');
    if (clear !== false) {
      this.otpInputs.forEach(function (i) {
        i.value = '';
        i.classList.remove('filled');
      });
    }
    this.events.timeout(function () {
      if (self.otpInputs[0])
        self.otpInputs[
          clear === false ? Math.max(0, self.otpCode().length) % self.otpLen : 0
        ].focus();
    }, 30);
  };
  UI.prototype.startTimer = function (sec) {
    var self = this;
    if (this.timer) this.events.clearInterval(this.timer);
    this.resendBtn.hidden = true;
    this.timerEl.hidden = false;
    var left = sec;
    var tick = function () {
      if (left <= 0) {
        self.events.clearInterval(self.timer);
        self.timer = 0;
        self.timerEl.hidden = true;
        self.resendBtn.hidden = false;
        return;
      }
      self.timerEl.textContent =
        T.resendIn + ' ' + left.toLocaleString('fa-IR') + ' ' + T.sec;
      left--;
    };
    tick();
    this.timer = this.events.interval(tick, 1000);
  };

  /* ---------- boot / expired ---------- */
  UI.prototype.buildBoot = function () {
    var self = this;
    this.bootText = h('p', { text: T.bootText });
    this.bootSpin = h('div', {
      class: 'spin',
      style: 'width:30px;height:30px;color:var(--accent)',
    });
    this.bootRetry = h('button', {
      class: 'btn',
      type: 'button',
      hidden: true,
      text: T.retry,
      style: 'width:auto;padding:0 28px',
      on: {
        click: function () {
          self.A.onRetryBoot();
        },
      },
    });
    return h(
      'section',
      { class: 'view card-view' },
      this.closeBtn(),
      h(
        'div',
        { class: 'center' },
        this.bootSpin,
        this.bootText,
        this.bootRetry
      )
    );
  };
  UI.prototype.setBoot = function (errMsg) {
    this.bootText.textContent = errMsg || T.bootText;
    this.bootSpin.hidden = !!errMsg;
    this.bootRetry.hidden = !errMsg;
  };
  UI.prototype.buildExpired = function () {
    var self = this;
    return h(
      'section',
      { class: 'view card-view' },
      this.closeBtn(),
      h(
        'div',
        { class: 'center' },
        h('div', { class: 'logo' }, icon('alert')),
        h('h3', { text: T.expiredTitle }),
        h('p', { text: T.expiredSub }),
        h('button', {
          class: 'btn',
          type: 'button',
          text: T.loginAgain,
          style: 'width:auto;padding:0 28px',
          on: {
            click: function () {
              self.A.onLoginAgain();
            },
          },
        })
      )
    );
  };

  /* ---------- chat ---------- */
  UI.prototype.buildChat = function () {
    var self = this;
    this.avEl = h('div', { class: 'av' }, h('img', { alt: '' }));
    this.nameEl = h('div', { class: 'hname', text: T.brand });
    this.statEl = h('div', { class: 'hstat' });
    this.profileBtn = h(
      'button',
      {
        class: 'hdr-more ib',
        type: 'button',
        'aria-label': T.profile,
        'aria-haspopup': 'dialog',
        'aria-expanded': 'false',
        'aria-controls': 'coco-agent-profile',
        on: {
          click: function () {
            self.openProfile();
          },
        },
      },
      icon('more')
    );
    var hdr = h(
      'header',
      { class: 'hdr' },
      h(
        'button',
        {
          class: 'ib',
          type: 'button',
          'aria-label': T.close,
          on: {
            click: function () {
              self.close();
            },
          },
        },
        icon('chatBack')
      ),
      this.avEl,
      h('div', { class: 'hinfo' }, this.nameEl, this.statEl),
      this.profileBtn
    );

    this.msgs = h('div', { class: 'msgs', role: 'log', 'aria-live': 'polite' });
    this.events.add(
      this.msgs,
      'scroll',
      function () {
        var near =
          self.msgs.scrollHeight -
            self.msgs.scrollTop -
            self.msgs.clientHeight <
          90;
        self.stick = near;
        self.fab.classList.toggle('show', !near);
        if (self.menuFor) self.closeMenu();
      },
      { passive: true }
    );
    this.fab = h(
      'button',
      {
        class: 'fab',
        type: 'button',
        'aria-label': T.scrollDown,
        on: {
          click: function () {
            self.scrollBottom(true);
          },
        },
      },
      icon('down')
    );
    this.scLayer = h('div', { class: 'sc-layer' });
    this.msgs.appendChild(this.scLayer);
    this.toastEl = h('div', { class: 'toast', role: 'status' });
    var body = h(
      'div',
      { class: 'body' },
      this.msgs,
      this.fab,
      this.toastEl
    );

    this.bannerIcon = h('span', { class: 'bi' }, icon('reply'));
    this.bannerTitle = h('b');
    this.bannerText = h('span');
    this.banner = h(
      'div',
      { class: 'banner' },
      this.bannerIcon,
      h('div', { class: 'bt' }, this.bannerTitle, this.bannerText),
      h(
        'button',
        {
          class: 'bx ib',
          type: 'button',
          'aria-label': T.cancel,
          on: {
            click: function () {
              self.A.onCancelCompose();
            },
          },
        },
        icon('close')
      )
    );

    this.ta = h('textarea', {
      class: 'ta',
      rows: '1',
      placeholder: T.msgPh,
      maxlength: String(this.cfg.maxLength),
      'aria-label': T.msgPh,
      dir: 'auto',
      wrap: 'soft',
      enterkeyhint: matchMedia('(pointer:coarse)').matches ? 'enter' : 'send',
    });
    this.emojiBtn = h(
      'button',
      {
        class: 'ib',
        type: 'button',
        'aria-label': T.emoji,
        'aria-expanded': 'false',
        on: {
          mousedown: function (e) {
            e.preventDefault();
          },
          click: function () {
            self.toggleEmoji();
          },
        },
      },
      icon('smile')
    );
    this.sendBtn = h('button', {
      class: 'send',
      type: 'button',
      'aria-label': T.send,
      disabled: true,
      on: {
        mousedown: function (e) {
          e.preventDefault();
        },
        click: function () {
          self.onSendClick();
        },
      },
    });
    this.renderSendIcon();
    this.ta.addEventListener('input', function () {
      self.autosize();
      self.syncSend();
      self.A.onActivity();
    });
    this.ta.addEventListener('focus', function () {
      self.ta.setAttribute(
        'enterkeyhint',
        matchMedia('(pointer:coarse)').matches ? 'enter' : 'send'
      );
      self.autosize();
      self.A.onActivity();
    });
    this.ta.addEventListener('compositionstart', function () {
      self.composing = true;
    });
    this.ta.addEventListener('compositionend', function () {
      self.composing = false;
      self.autosize();
      self.syncSend();
    });
    this.ta.addEventListener('keydown', function (e) {
      self.onComposerKeydown(e);
    });
    var composer = h(
      'div',
      { class: 'composer' },
      h('div', { class: 'field' }, this.emojiBtn, this.ta),
      this.sendBtn
    );
    this.emojiPanel = this.buildEmoji();
    var dock = h(
      'div',
      { class: 'dock' },
      this.emojiPanel,
      this.banner,
      composer
    );
    this.menu = h('div', { class: 'menu', role: 'menu', hidden: true });
    body.appendChild(this.menu);
    this.chatContents = [hdr, body, dock];
    this.profilePanel = this.buildProfile();
    return h('section', { class: 'view' }, hdr, body, dock, this.profilePanel);
  };
  UI.prototype.buildProfile = function () {
    var self = this;
    this.profileBackBtn = h(
      'button',
      {
        class: 'ib',
        type: 'button',
        'aria-label': T.profileBack,
        on: {
          click: function () {
            self.closeProfile();
          },
        },
      },
      icon('chatBack')
    );
    this.profileImg = h('img', {
      alt: '',
      hidden: true,
      on: {
        error: function () {
          self.profileImg.hidden = true;
        },
      },
    });
    this.profileNameEl = h('h2', { class: 'profile-name', text: T.brand });
    this.profileStatusEl = h('div', { class: 'profile-status' });
    this.profileActions = h('div', { class: 'profile-actions' });
    this.profileDescription = h('p', { class: 'profile-description' });
    this.profileContactTitle = h('h3', { text: T.profileContact });
    this.profileDetails = h(
      'div',
      { class: 'profile-details' },
      this.profileContactTitle
    );
    var panel = h(
      'section',
      {
        id: 'coco-agent-profile',
        class: 'agent-profile',
        role: 'dialog',
        'aria-modal': 'true',
        'aria-hidden': 'true',
        'aria-labelledby': 'coco-profile-title',
        on: {
          keydown: function (e) {
            if (e.key === 'Escape') {
              e.preventDefault();
              e.stopPropagation();
              self.closeProfile();
            } else if (e.key === 'Tab') {
              var controls = Array.prototype.filter.call(
                panel.querySelectorAll('button:not(:disabled),a[href]'),
                function (el) {
                  return el.getClientRects().length > 0;
                }
              );
              var first = controls[0],
                last = controls[controls.length - 1];
              var active = self.shadow.activeElement;
              if (e.shiftKey && active === first) {
                e.preventDefault();
                last.focus();
              } else if (!e.shiftKey && active === last) {
                e.preventDefault();
                first.focus();
              }
            }
          },
        },
      },
      h(
        'header',
        { class: 'profile-toolbar' },
        this.profileBackBtn,
        h('div', { id: 'coco-profile-title', text: T.profile })
      ),
      h(
        'div',
        { class: 'profile-scroll' },
        h(
          'div',
          { class: 'profile-hero' },
          h('div', { class: 'profile-avatar' }, icon('chat'), this.profileImg),
          this.profileNameEl,
          this.profileStatusEl,
          this.profileActions
        ),

        h('section', { class: 'profile-group' }, this.profileDetails)
      )
    );
    panel.inert = true;
    return panel;
  };
  UI.prototype.updateProfile = function () {
    var self = this,
      p = this.agentProfile || readAgentProfile({});
    var phone = latin(p.phone).replace(/[\s().-]/g, '');
    var phoneHref = /^\+?\d{7,15}$/.test(phone) ? 'tel:' + phone : null;
    var emailHref = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(p.email)
      ? 'mailto:' + encodeURIComponent(p.email)
      : null;
    var websiteHref = p.website
      ? safeUrl(p.website, this.cfg.assetsBase)
      : null;
    function action(label, glyph, href, handler) {
      var props = { class: 'profile-action' };
      if (handler) {
        props.type = 'button';
        props.on = { click: handler };
      } else if (href) {
        props.href = href;
        if (/^https?:/i.test(href)) {
          props.target = '_blank';
          props.rel = 'noopener noreferrer';
        }
      } else {
        props.type = 'button';
        props.disabled = true;
      }
      return h(
        href ? 'a' : 'button',
        props,
        icon(glyph),
        h('span', { text: label })
      );
    }
    this.profileActions.textContent = '';
    append(this.profileActions, [
      action(T.profileMessage, 'chat', null, function () {
        self.closeProfile(false);
        self.focusComposer();
      }),
      action(T.profileCall, 'phone', phoneHref),
      action(T.profileWebsite, 'globe', websiteHref),
    ]);
    this.profileDescription.textContent = p.description || T.profileMissing;
    this.profileDetails.textContent = '';
    this.profileDetails.appendChild(this.profileContactTitle);
    function row(label, value, glyph, href, ltr) {
      var props = { class: 'profile-value', text: value || T.profileMissing };
      if (ltr && value) props.dir = 'ltr';
      if (href) {
        props.href = href;
        if (/^https?:/i.test(href)) {
          props.target = '_blank';
          props.rel = 'noopener noreferrer';
        }
      }
      append(
        self.profileDetails,
        h(
          'div',
          { class: 'profile-row' },
          icon(glyph),
          h(
            'div',
            { class: 'profile-row-content' },
            h('div', { class: 'profile-label', text: label }),
            h(href ? 'a' : 'div', props)
          )
        )
      );
    }
    row(T.profilePhone, p.phone, 'phone', phoneHref, true);
    row(T.profileEmail, p.email, 'mail', emailHref, true);
    row(T.profileWebsite, p.website, 'globe', websiteHref, true);
    row(T.profileHours, p.businessHours, 'clock');
    row(T.profileAddress, p.address, 'location');
  };
  UI.prototype.openProfile = function () {
    if (this.profileOpen || this.activeView !== 'chat' || !this.isOpen())
      return;
    this.closeMenu();
    this.toggleEmoji(false);
    this.profileOpen = true;
    this.chatContents.forEach(function (el) {
      el.inert = true;
    });
    this.profilePanel.inert = false;
    this.profilePanel.setAttribute('aria-hidden', 'false');
    this.profilePanel.classList.add('on');
    this.profileBtn.setAttribute('aria-expanded', 'true');
    this.profileBackBtn.focus({ preventScroll: true });
  };
  UI.prototype.closeProfile = function (restoreFocus) {
    if (!this.profileOpen) return;
    this.profileOpen = false;
    this.profilePanel.inert = true;
    this.profilePanel.setAttribute('aria-hidden', 'true');
    this.profilePanel.classList.remove('on');
    this.profileBtn.setAttribute('aria-expanded', 'false');
    this.chatContents.forEach(function (el) {
      el.inert = false;
    });
    if (restoreFocus !== false && this.isOpen())
      this.profileBtn.focus({ preventScroll: true });
  };
  UI.prototype.renderSendIcon = function () {
    this.sendBtn.textContent = '';
    this.sendBtn.appendChild(this.busy ? icon('stop') : icon('send', 'flip'));
    this.sendBtn.setAttribute('aria-label', this.busy ? T.stop : T.send);
  };
  UI.prototype.syncSend = function () {
    this.sendBtn.disabled = this.busy
      ? false
      : this.locked || !this.ta.value.trim();
  };
  UI.prototype.onSendClick = function () {
    if (this.busy) return this.A.onStop();
    if (this.locked || this.composing) return;
    var t = this.ta.value.trim();
    if (!t) return;
    this.A.onSend(t);
    if (this.activeView === 'chat' && this.isOpen() && !this.profileOpen)
      this.focusComposer();
  };
  UI.prototype.onComposerKeydown = function (e) {
    if (
      e.key !== 'Enter' ||
      e.shiftKey ||
      e.ctrlKey ||
      e.metaKey ||
      e.altKey ||
      e.isComposing ||
      this.composing ||
      e.keyCode === 229 ||
      matchMedia('(pointer:coarse)').matches
    )
      return;
    e.preventDefault();
    // Enter sends a message; stopping a response remains an explicit button action.
    if (!e.repeat && !this.busy) this.onSendClick();
  };
  UI.prototype.autosize = function () {
    var ta = this.ta;
    // Hidden views cannot measure wrapped text. Recalculate when chat is shown.
    if (!ta || !ta.getClientRects().length || !ta.offsetWidth) return;
    var style = window.getComputedStyle(ta);
    var minHeight = parseFloat(style.minHeight) || 38;
    var maxHeight =
      parseFloat(style.getPropertyValue('--composer-max-height')) || 158;
    if (this.panel && this.panel.clientHeight)
      maxHeight = Math.max(
        minHeight,
        Math.min(maxHeight, Math.floor(this.panel.clientHeight * 0.3))
      );
    var previousHeight = ta.offsetHeight,
      scrollTop = ta.scrollTop;
    var border =
      (parseFloat(style.borderTopWidth) || 0) +
      (parseFloat(style.borderBottomWidth) || 0);
    ta.style.setProperty('--composer-limit', maxHeight + 'px');
    ta.style.overflowY = 'hidden';
    ta.style.height = minHeight + 'px';
    var contentHeight = ta.value ? ta.scrollHeight + border : minHeight;
    var height = Math.min(maxHeight, Math.max(minHeight, contentHeight));
    ta.style.height = height + 'px';
    ta.style.overflowY = contentHeight > maxHeight ? 'auto' : 'hidden';
    ta.scrollTop = contentHeight > maxHeight ? scrollTop : 0;
    if (height !== previousHeight && this.stick && this.msgs)
      this.scrollBottom(false);
  };
  UI.prototype.observeComposer = function () {
    var self = this;
    var resize = function () {
      self.autosize();
    };
    if (window.ResizeObserver) {
      var lastWidth = 0,
        lastPanelHeight = 0;
      this.composerObserver = new window.ResizeObserver(function () {
        var width = self.ta.offsetWidth,
          height = self.panel.clientHeight;
        if (!width || (width === lastWidth && height === lastPanelHeight))
          return;
        lastWidth = width;
        lastPanelHeight = height;
        resize();
      });
      this.composerObserver.observe(this.ta);
      this.composerObserver.observe(this.panel);
    } else this.events.add(window, 'resize', resize);
    if (document.fonts) this.events.add(document.fonts, 'loadingdone', resize);
  };
  UI.prototype.setBusy = function (b) {
    this.busy = b;
    this.renderSendIcon();
    this.syncSend();
  };
  UI.prototype.setLocked = function (locked, ph) {
    this.locked = locked;
    this.ta.placeholder = ph || (this.mode === 'edit' ? T.editPh : T.msgPh);
    this.syncSend();
  };
  UI.prototype.setComposerText = function (t) {
    this.ta.value = t;
    this.autosize();
    this.syncSend();
  };
  UI.prototype.focusComposer = function () {
    this.ta.focus({ preventScroll: true });
  };
  UI.prototype.setBanner = function (mode, snippet) {
    this.mode = mode || 'normal';
    this.bannerTargetId = this.mode === 'reply' && snippet ? snippet.id : null;
    this.banner.classList.toggle('on', this.mode !== 'normal');
    if (this.mode === 'reply' && snippet) {
      this.bannerIcon.textContent = '';
      this.bannerIcon.appendChild(icon('reply'));
      this.bannerTitle.textContent =
        T.replyTo + ' ' + (snippet.role === 'user' ? T.you : this.agentName());
      this.bannerText.textContent = snippet.text;
    } else if (this.mode === 'edit' && snippet) {
      this.bannerIcon.textContent = '';
      this.bannerIcon.appendChild(icon('edit'));
      this.bannerTitle.textContent = T.editing;
      this.bannerText.textContent = snippet.text;
    }
    // کلیک روی پیش‌نمایش پاسخ، پیام اصلی را پیدا می‌کند.
    if (!this._replyPreviewClickBound) {
      var self = this;

      this.banner.addEventListener('click', function (e) {
        if (!e.target.closest('.bt, .banner-text, .banner-title')) return;
        if (self.mode !== 'reply' || !self.bannerTargetId) return;

        self.jumpTo(self.bannerTargetId);
      });

      this._replyPreviewClickBound = true;
    }
    this.ta.placeholder = this.mode === 'edit' ? T.editPh : T.msgPh;
  };
  UI.prototype.agentName = function () {
    return this.nameEl.textContent || T.brand;
  };
  UI.prototype.setAgent = function (a) {
    this.agentProfile = readAgentProfile(a);
    this.nameEl.textContent = a.name || T.brand;
    var img = this.avEl.firstChild,
      u = safeUrl(a.avatarUrl, this.cfg.assetsBase, true);
    if (u) {
      img.src = u;
      img.hidden = false;
    } else {
      img.removeAttribute('src');
      img.hidden = true;
    }
    if (this.profileNameEl) {
      this.profileNameEl.textContent = this.nameEl.textContent;
      if (u) {
        this.profileImg.src = u;
        this.profileImg.hidden = false;
      } else {
        this.profileImg.removeAttribute('src');
        this.profileImg.hidden = true;
      }
      this.updateProfile();
    }
  };
  /* kind: '' | 'act' | 'bad' */
  UI.prototype.setStatus = function (text, kind, typing, away) {
    this.statEl.className = 'hstat' + (kind ? ' ' + kind : '');
    this.statEl.textContent = text;
    if (typing)
      this.statEl.appendChild(
        h(
          'span',
          { class: 'dots', 'aria-hidden': 'true' },
          h('i'),
          h('i'),
          h('i')
        )
      );
    this.avEl.classList.toggle('off', !!away);
    if (this.profileStatusEl) {
      this.profileStatusEl.className =
        'profile-status' + (kind === 'bad' ? ' bad' : away ? ' away' : '');
      this.profileStatusEl.textContent = text;
      if (typing)
        this.profileStatusEl.appendChild(
          h(
            'span',
            { class: 'dots', 'aria-hidden': 'true' },
            h('i'),
            h('i'),
            h('i')
          )
        );
    }
  };
  UI.prototype.toast = function (msg) {
    var self = this;
    this.toastEl.textContent = msg;
    this.toastEl.classList.add('on');
    if (this._toastT) this.events.clearTimeout(this._toastT);
    this._toastT = this.events.timeout(function () {
      self.toastEl.classList.remove('on');
    }, 2800);
  };

  /* ---------- emoji ---------- */
  UI.prototype.buildEmoji = function () {
    var self = this;
    this.recent = [];
    this.egrid = h('div', { class: 'egrid' });
    var tabs = h('div', { class: 'etabs', role: 'tablist' });
    this.etabs = EMOJI.map(function (c, i) {
      var b = h('button', {
        class: 'etab' + (i === 0 ? ' on' : ''),
        type: 'button',
        role: 'tab',
        'aria-label': c.name,
        text: c.icon,
        on: {
          mousedown: function (e) {
            e.preventDefault();
          },
          click: function () {
            self.showEmojiTab(i);
          },
        },
      });
      tabs.appendChild(b);
      return b;
    });
    var p = h('div', { class: 'emoji' }, tabs, this.egrid);
    this.events.add(this.egrid, 'click', function (e) {
      var b = e.target.closest ? e.target.closest('.eb') : null;
      if (b) self.insertEmoji(b.textContent);
    });
    this.events.add(this.egrid, 'mousedown', function (e) {
      e.preventDefault();
    });
    this.showEmojiTab(0);
    return p;
  };
  UI.prototype.showEmojiTab = function (i) {
    var self = this,
      c = EMOJI[i];
    this.etabs.forEach(function (t, k) {
      t.classList.toggle('on', k === i);
      t.setAttribute('aria-selected', String(k === i));
    });
    this.egrid.textContent = '';
    this.egrid.scrollTop = 0;
    if (i === 0 && this.recent.length) {
      this.egrid.appendChild(h('div', { class: 'elabel', text: 'اخیراً' }));
      this.recent.forEach(function (e) {
        self.egrid.appendChild(
          h('button', { class: 'eb', type: 'button', text: e })
        );
      });
      this.egrid.appendChild(h('div', { class: 'elabel', text: c.name }));
    }
    c.list.split(' ').forEach(function (e) {
      self.egrid.appendChild(
        h('button', { class: 'eb', type: 'button', text: e })
      );
    });
  };
  UI.prototype.toggleEmoji = function (force) {
    var on =
      force === undefined ? !this.emojiPanel.classList.contains('on') : force;
    this.emojiPanel.classList.toggle('on', on);
    this.emojiBtn.classList.toggle('on', on);
    this.emojiBtn.setAttribute('aria-expanded', String(on));
    if (on) this.closeMenu();
  };
  UI.prototype.insertEmoji = function (e) {
    var ta = this.ta,
      s = ta.selectionStart == null ? ta.value.length : ta.selectionStart,
      en = ta.selectionEnd == null ? s : ta.selectionEnd;
    if (ta.value.length - (en - s) + e.length > this.cfg.maxLength) return;
    ta.setRangeText(e, s, en, 'end');
    this.recent = [e]
      .concat(
        this.recent.filter(function (x) {
          return x !== e;
        })
      )
      .slice(0, 8);
    this.autosize();
    this.syncSend();
    this.A.onActivity();
    this.focusComposer();
  };

  /* ---------- messages ---------- */
  UI.prototype.clearMessages = function () {
    // Keep the status host mounted when history is reset or reloaded.
    var self = this;
    Array.from(this.msgs.children).forEach(function (child) {
      if (child !== self.scLayer) self.msgs.removeChild(child);
    });
    this.rows = {};
    this.lastDay = null;
  };
  UI.prototype.renderAll = function (list) {
    var self = this;
    this.clearMessages();
    list.forEach(function (m) {
      self.appendRow(m, true);
    });
    this.scrollBottom(false);
  };
  UI.prototype.nearBottom = function () {
    return this.stick;
  };
  UI.prototype.onScenarioChange = function (restoreFocus) {
    if (this.stick) this.scrollBottom(false);
    var distance = this.msgs.scrollHeight - this.msgs.scrollTop - this.msgs.clientHeight;
    this.fab.classList.toggle('show', distance >= 90);
    if (restoreFocus && this.isOpen() && !this.locked) this.focusComposer();
  };
  UI.prototype.scrollBottom = function (smooth) {
    var m = this.msgs;
    if (smooth && m.scrollTo)
      m.scrollTo({ top: m.scrollHeight, behavior: 'smooth' });
    else m.scrollTop = m.scrollHeight;
  };
  UI.prototype.fillText = function (el, text, streaming) {
    el.textContent = '';
    if (streaming) {
      el.textContent = text;
      return;
    }
    var re = /(https?:\/\/[^\s<>"']+)/gi,
      last = 0,
      m;
    while ((m = re.exec(text))) {
      var url = m[1],
        trail = '';
      var t = url.match(/[.,;:!?)\]}،؛؟]+$/);
      if (t) {
        trail = t[0];
        url = url.slice(0, -trail.length);
      }
      if (m.index > last)
        el.appendChild(document.createTextNode(text.slice(last, m.index)));
      var safe = safeUrl(url);
      if (safe)
        el.appendChild(
          h('a', {
            href: safe,
            target: '_blank',
            rel: 'noopener noreferrer nofollow',
            text: url,
          })
        );
      else el.appendChild(document.createTextNode(url));
      if (trail) el.appendChild(document.createTextNode(trail));
      last = m.index + m[1].length;
    }
    if (last < text.length)
      el.appendChild(document.createTextNode(text.slice(last)));
  };
  UI.prototype.buildRow = function (m) {
    var self = this,
      A = this.A;
    if (m.role === 'system')
      return {
        el: h(
          'div',
          { class: 'row sys' },
          h('span', { class: 'pill', text: m.content })
        ),
      };
    var out = m.role === 'user';
    var bubble = h('div', {
      class:
        'bubble' +
        (m.streaming ? ' streaming' : '') +
        (m.status === 'error' ? ' err' : ''),
    });
    if (m.replyTo) {
      var s = this.mm.replySnippet(m.replyTo);
      if (s)
        bubble.appendChild(
          h(
            'button',
            {
              class: 'quote',
              type: 'button',
              on: {
                click: function () {
                  self.jumpTo(s.id);
                },
              },
            },
            h('b', { text: s.role === 'user' ? T.you : this.agentName() }),
            h('span', { text: s.text })
          )
        );
    }

    var txt = h('div', { class: 'txt', dir: 'auto' });
    this.fillText(txt, m.content, m.streaming);

    // دنباله SVG اختصاصی پیام کاربر

    {
      var SVG_NS = 'http://www.w3.org/2000/svg';

      // ساخت SVG در فضای نام صحیح
      var appendix = document.createElementNS(SVG_NS, 'svg');
      appendix.setAttribute('width', '9');
      appendix.setAttribute('height', '20');
      appendix.setAttribute('viewBox', '0 0 9 20');
      appendix.setAttribute(
        'class',
        'message-appendix' +
          (out ? ' message-appendix-out' : ' message-appendix-in')
      );
      appendix.setAttribute('aria-hidden', 'true');
      appendix.setAttribute('focusable', 'false');

      // شناسه یکتا برای فیلتر هر پیام
      var filterId =
        'messageAppendix-' + String(m.id).replace(/[^a-zA-Z0-9_-]/g, '');

      var defs = document.createElementNS(SVG_NS, 'defs');
      var filter = document.createElementNS(SVG_NS, 'filter');

      filter.setAttribute('id', filterId);
      filter.setAttribute('x', '-50%');
      filter.setAttribute('y', '-14.7%');
      filter.setAttribute('width', '200%');
      filter.setAttribute('height', '141.2%');
      filter.setAttribute('filterUnits', 'objectBoundingBox');

      var offset = document.createElementNS(SVG_NS, 'feOffset');
      offset.setAttribute('dy', '1');
      offset.setAttribute('in', 'SourceAlpha');
      offset.setAttribute('result', 'shadowOffsetOuter1');

      var blur = document.createElementNS(SVG_NS, 'feGaussianBlur');
      blur.setAttribute('stdDeviation', '1');
      blur.setAttribute('in', 'shadowOffsetOuter1');
      blur.setAttribute('result', 'shadowBlurOuter1');

      var colorMatrix = document.createElementNS(SVG_NS, 'feColorMatrix');
      colorMatrix.setAttribute(
        'values',
        '0 0 0 0 0.0621962482 ' +
          '0 0 0 0 0.138574144 ' +
          '0 0 0 0 0.185037364 ' +
          '0 0 0 0 0.15'
      );
      colorMatrix.setAttribute('in', 'shadowBlurOuter1');

      filter.appendChild(offset);
      filter.appendChild(blur);
      filter.appendChild(colorMatrix);
      defs.appendChild(filter);
      appendix.appendChild(defs);

      var group = document.createElementNS(SVG_NS, 'g');
      group.setAttribute('fill', 'none');
      group.setAttribute('fill-rule', 'evenodd');

      var shadowPath = document.createElementNS(SVG_NS, 'path');
      shadowPath.setAttribute(
        'd',
        'M6 17H0V0c.193 2.84.876 5.767 2.05 8.782 ' +
          '.904 2.325 2.446 4.485 4.625 6.48A1 1 0 016 17z'
      );
      // shadowPath.setAttribute('fill', '#000');
      // shadowPath.setAttribute('filter', 'url(#' + filterId + ')');

      var cornerPath = document.createElementNS(SVG_NS, 'path');
      cornerPath.setAttribute(
        'd',
        'M6 17H0V0c.193 2.84.876 5.767 2.05 8.782 ' +
          '.904 2.325 2.446 4.485 4.625 6.48A1 1 0 016 17z'
      );
      cornerPath.setAttribute('class', 'corner');

      // group.appendChild(shadowPath);
      group.appendChild(cornerPath);
      appendix.appendChild(group);

      bubble.appendChild(appendix);
    }

    bubble.appendChild(txt);

    bubble.appendChild(txt);
    var meta = h('div', { class: 'meta' });
    if (m.metadata && m.metadata.stopped)
      meta.appendChild(h('span', { text: T.stopped }));
    if (m.edited) meta.appendChild(h('span', { text: T.edited }));
    if (m.status === 'error') {
      if (!out) meta.appendChild(h('span', { class: 'bad', text: T.sendFail }));
      meta.appendChild(
        h(
          'button',
          {
            class: 'ic-retry',
            type: 'button',
            'aria-label': T.retry,
            on: {
              click: function () {
                A.onRetry(m.id);
              },
            },
          },
          icon('retry')
        )
      );
    } else if (out) {
      meta.appendChild(
        icon(
          m.status === 'sending'
            ? 'clock'
            : m.metadata && m.metadata.delivered
              ? 'checks'
              : 'check'
        )
      );
    }
    meta.appendChild(
      h('span', { text: timeFmt.format(new Date(m.timestamp)) })
    );
    bubble.appendChild(meta);
    var row = h('div', { class: 'row ' + (out ? 'out' : 'in') }, bubble);

    // Actions: right-click, long-press (touch), tap on touch devices
    var pressT = 0,
      moved = false,
      longFired = false;
    var openM = function (x, y) {
      self.openMenu(m.id, bubble);
    };
    bubble.addEventListener('contextmenu', function (e) {
      e.preventDefault();
      openM();
    });
    bubble.addEventListener(
      'touchstart',
      function () {
        moved = false;
        longFired = false;
        pressT = setTimeout(function () {
          longFired = true;
          openM();
        }, 450);
      },
      { passive: true }
    );
    bubble.addEventListener(
      'touchmove',
      function () {
        moved = true;
        clearTimeout(pressT);
      },
      { passive: true }
    );
    bubble.addEventListener('touchend', function (e) {
      clearTimeout(pressT);
      if (longFired) e.preventDefault();
    });
    bubble.addEventListener('touchcancel', function () {
      clearTimeout(pressT);
      longFired = false;
    });
    bubble.addEventListener('dblclick', function (e) {
      if (!(e.target.closest && e.target.closest('a,button'))) openM();
    });

    // ---------- Swipe to reply ----------
    var swipeStartX = 0;
    var swipeStartY = 0;
    var swipeX = 0;
    var swipePointerId = null;
    var swipeLocked = false;
    var swipeStartThreshold = 20;
    var swipeReplyThreshold = 56;
    var swipeMaxDistance = 72;

    // پیام کاربر: چپ | پیام دستیار: راست
    var swipeDirection = out ? -1 : 1;

    var swipeHint = h(
      'span',
      {
        class: 'reply-swipe-hint',
        'aria-hidden': 'true',
      },
      icon('reply')
    );

    row.style.position = 'relative';
    row.appendChild(swipeHint);

    row.addEventListener('pointerdown', function (e) {
      if (e.isPrimary === false) {
        finishSwipe(false);
        return;
      }
      if (swipePointerId !== null) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (
        e.target.closest &&
        e.target.closest('button,a,input,textarea,select')
      )
        return;

      swipeStartX = e.clientX;
      swipeStartY = e.clientY;
      swipeX = 0;
      swipePointerId = e.pointerId;
      swipeLocked = false;
      longFired = false;
      // Capture early so the gesture stays attached to this message.
      if (row.setPointerCapture) {
        try {
          row.setPointerCapture(e.pointerId);
        } catch (_) {}
      }
    });

    function moveSwipe(e) {
      if (swipePointerId === null || e.pointerId !== swipePointerId) return;
      if (
        longFired ||
        (e.pointerType === 'mouse' && e.buttons != null && !(e.buttons & 1))
      ) {
        finishSwipe(false);
        return;
      }

      var dx = e.clientX - swipeStartX;
      var dy = e.clientY - swipeStartY;

      if (!swipeLocked) {
        var absX = Math.abs(dx);
        var absY = Math.abs(dy);
        if (Math.max(absX, absY) < swipeStartThreshold) return;
        // Let vertical scrolling win; do not reject a mostly horizontal diagonal.
        if (absY > absX * 1.2) {
          finishSwipe(false);
          return;
        }
        if (absX < absY * 1.2) return;
        if (dx * swipeDirection < swipeStartThreshold) {
          finishSwipe(false);
          return;
        }

        swipeLocked = true;
        clearTimeout(pressT);
        row.classList.add('is-swiping');
      }

      if (e.cancelable) e.preventDefault();

      swipeX =
        swipeDirection *
        Math.min(swipeMaxDistance, Math.max(0, dx * swipeDirection));

      var progress = Math.min(1, Math.abs(swipeX) / swipeReplyThreshold);

      row.style.transform = 'translateX(' + swipeX + 'px)';
      swipeHint.style.opacity = String(progress);
      var scaleX = out ? 1 : -1;

      swipeHint.style.transform =
        'translateY(-50%) scale(' +
        (0.6 + progress * 0.4) +
        ') scaleX(' +
        scaleX +
        ')';
    }
    row.addEventListener('pointermove', moveSwipe);

    function finishSwipe(commit) {
      if (swipePointerId === null) return;

      var pointerId = swipePointerId;
      var shouldReply =
        commit && swipeLocked && Math.abs(swipeX) >= swipeReplyThreshold;

      swipePointerId = null;
      swipeLocked = false;
      swipeX = 0;
      clearTimeout(pressT);

      row.classList.remove('is-swiping');
      row.style.transform = '';
      swipeHint.style.opacity = '';
      swipeHint.style.transform = '';

      if (row.hasPointerCapture && row.releasePointerCapture) {
        try {
          if (row.hasPointerCapture(pointerId))
            row.releasePointerCapture(pointerId);
        } catch (_) {}
      }
      if (shouldReply) A.onReply(m.id);
    }

    row.addEventListener('pointerup', function (e) {
      if (e.pointerId !== swipePointerId) return;
      // Include the release position, even if the final move was coalesced.
      if (swipeLocked) {
        var distance = (e.clientX - swipeStartX) * swipeDirection;
        swipeX =
          swipeDirection * Math.min(swipeMaxDistance, Math.max(0, distance));
      }
      finishSwipe(true);
    });
    var cancelSwipe = function (e) {
      if (e.pointerId === swipePointerId) finishSwipe(false);
    };
    row.addEventListener('pointercancel', cancelSwipe);
    row.addEventListener('lostpointercapture', cancelSwipe);

    return { el: row, bubble: bubble, txt: txt };

    return { el: row, bubble: bubble, txt: txt };
  };
  UI.prototype.appendRow = function (m, silent) {
    var dk = dayKey(m.timestamp);
    if (dk !== this.lastDay) {
      this.lastDay = dk;
      this.msgs.insertBefore(
        h(
          'div',
          { class: 'row day' },
          h('span', { class: 'pill', text: dayLabel(m.timestamp) })
        ),
        this.scLayer
      );
    }
    var r = this.buildRow(m);
    this.rows[m.id] = r;
    this.msgs.insertBefore(r.el, this.scLayer);
    if (silent) r.el.style.animation = 'none';
  };
  UI.prototype.onAdd = function (m) {
    var wasStick = this.stick;
    this.appendRow(m);
    if (wasStick || m.role === 'user') {
      this.stick = true;
      this.scrollBottom(false);
    }
  };
  UI.prototype.onUpdate = function (m) {
    var old = this.rows[m.id];
    if (!old) return;
    var fresh = this.buildRow(m);
    fresh.el.style.animation = 'none';
    old.el.parentNode.replaceChild(fresh.el, old.el);
    this.rows[m.id] = fresh;
    if (this.stick) this.scrollBottom(false);
  };
  UI.prototype.onStream = function (m) {
    var r = this.rows[m.id];
    if (!r || !r.txt) return;
    r.txt.textContent = m.content;
    if (this.stick) this.scrollBottom(false);
  };
  UI.prototype.jumpTo = function (id) {
    var r = this.rows[id];
    if (!r) return;
    var box = this.msgs.getBoundingClientRect(),
      rb = r.el.getBoundingClientRect();
    this.msgs.scrollTo({
      top:
        rb.top -
        box.top +
        this.msgs.scrollTop -
        this.msgs.clientHeight / 2 +
        r.el.offsetHeight / 2,
      behavior: 'smooth',
    });
    r.el.classList.remove('flash');
    void r.el.offsetWidth;
    r.el.classList.add('flash');
  };

  /* ---------- context menu ---------- */
  UI.prototype.openMenu = function (id, anchor) {
    var self = this,
      m = this.mm.get(id),
      A = this.A;
    if (!m || m.role === 'system') return;
    this.toggleEmoji(false);
    this.menu.textContent = '';
    var add = function (ic, label, fn) {
      self.menu.appendChild(
        h(
          'button',
          {
            type: 'button',
            role: 'menuitem',
            on: {
              click: function () {
                self.closeMenu();
                fn();
              },
            },
          },
          icon(ic),
          h('span', { text: label })
        )
      );
    };
    if (m.status !== 'sending' && m.status !== 'streaming')
      add('reply', T.reply, function () {
        A.onReply(id);
      });
    add('copy', T.copy, function () {
      self.copyText(m.content);
    });
    if (m.role === 'user' && m.editable && m.status === 'sent' && !this.busy)
      add('edit', T.edit, function () {
        A.onEdit(id);
      });
    this.menu.hidden = false;
    this.menuFor = id;
    var host = this.menu.parentNode.getBoundingClientRect(),
      ab = anchor.getBoundingClientRect();
    var mw = this.menu.offsetWidth || 160,
      mh = this.menu.offsetHeight || 120;
    var top = ab.bottom - host.top + 6;
    if (top + mh > host.height - 6)
      top = Math.max(6, ab.top - host.top - mh - 6);
    var left =
      m.role === 'user' ? ab.right - host.left - mw : ab.left - host.left;
    left = Math.max(6, Math.min(left, host.width - mw - 6));
    this.menu.style.top = top + 'px';
    this.menu.style.left = left + 'px';
  };
  UI.prototype.closeMenu = function () {
    this.menu.hidden = true;
    this.menuFor = null;
  };
  UI.prototype.copyText = function (text) {
    var self = this,
      done = function () {
        self.toast(T.copied);
      };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () {
        self.legacyCopy(text);
        done();
      });
    } else {
      this.legacyCopy(text);
      done();
    }
  };
  UI.prototype.legacyCopy = function (text) {
    var t = h('textarea', { style: 'position:fixed;opacity:0;top:0' });
    t.value = text;
    this.root.appendChild(t);
    t.select();
    try {
      document.execCommand('copy');
    } catch (e) {
      /* noop */
    }
    this.root.removeChild(t);
  };

  /* =====================================================================
   * 10. WIDGET  (lifecycle: initialize > mount > authenticate > bootstrap > ready > destroy)
   * ===================================================================== */
  var SC_BY_STATE = {
    CHAT_LOADING: 'chat-loading',
    THINKING: 'thinking',
    READING: 'reading',
    WAITING: 'waiting',
    SEND_ERROR: 'send-error',
    NETWORK_ERROR: 'network-error',
    OFF_HOURS: 'off-hours',
  };
  var VIEW_BY_STATE = {
    LOGIN: 'login',
    OTP: 'otp',
    AUTHENTICATING: 'otp',
    BOOTSTRAPPING: 'boot',
    SESSION_EXPIRED: 'expired',
  };

  function Widget(opts) {
    this.destroyed = false;
    this.initialize(opts);
  }

  /* 1. initialize: build all non-DOM modules */
  Widget.prototype.initialize = function (opts) {
    var self = this;
    this.cfg = readConfig(opts);
    this.configuredMaxLength = this.cfg.maxLength;
    this.positionOverrides = {};
    this.events = new EventManager();
    this.store = new Store();
    this.api = new ApiClient(this.cfg);
    this.mm = new MessageManager();
    this.streams = new StreamManager(this.api, this.mm);
    this.replyId = null;
    this.editId = null;
    this.waitT = 0;
    this.busy = false;
    this.netFailedId = null;
    this.abortReason = null;
    this.resumeState = null;
    this.A = {
      onRequestOtp: function (n, m) {
        self.requestOtp(n, m);
      },
      onResendOtp: function () {
        self.requestOtp(self.store.data.name, self.store.data.mobile, true);
      },
      onVerifyOtp: function (c) {
        self.authenticate(c);
      },
      onBackToLogin: function () {
        self.store.set('LOGIN');
      },
      onRetryBoot: function () {
        self.bootstrap();
      },
      onLoginAgain: function () {
        self.resetSession();
      },
      onSend: function (t) {
        self.send(t);
      },
      onStop: function () {
        self.stop();
      },
      onReply: function (id) {
        self.startReply(id);
      },
      onEdit: function (id) {
        self.startEdit(id);
      },
      onCancelCompose: function () {
        self.cancelCompose();
      },
      onRetry: function (id) {
        self.retry(id);
      },
      onActivity: function () {
        self.activity();
      },
      onOpen: function () {
        self.scenario && self.scenario.play();
      },
      onClose: function () {
        self.scenario && self.scenario.pause();
      },
    };
    this.ui = new UI(this.cfg, this.mm, this.A, this.events);
    this.net = new NetworkManager(this.events, function (s) {
      self.onNetwork(s);
    });
    this.store.on('state', function (s, p) {
      self.applyState(s, p);
    });
    if (!this.cfg.mock && !this.cfg.agent)
      console.error('[CocoChat] data-agent is required.');
    this.mount();
  };

  /* 2. mount: create the single host element + shadow root */
  Widget.prototype.mount = function () {
    var self = this;

    var host = document.createElement('coco-chat-widget');

    host.setAttribute(
      'style',
      'all:initial!important;display:block!important;position:fixed!important;bottom:0!important;left:0!important;width:0!important;height:0!important;overflow:visible!important;z-index:2147483000!important;direction:rtl!important'
    );

    (document.body || document.documentElement).appendChild(host);

    this.host = host;
    this.shadow = host.attachShadow({ mode: 'closed' });

    this.ui.mount(this.shadow);

    // اعمال موقعیت اولیه
    this.applyPosition();

    // بازخوانی تنظیمات CSS هنگام تغییر اندازه صفحه
    this.events.add(window, 'resize', function () {
      if (!self.destroyed) {
        self.applyPosition();
      }
    });

    this.scenario = new ScenarioManager(
      this.ui.scLayer, this.cfg, this.events,
      function (restoreFocus) { self.ui.onScenarioChange(restoreFocus); }
    );

    this.store.set('LOGIN');

    if (this.cfg.open) {
      this.ui.open();
    }
  };

  Widget.prototype.resolvePosition = function () {
    var self = this;
    var overrides = this.positionOverrides || {};

    var has = function (key) {
      return Object.prototype.hasOwnProperty.call(overrides, key);
    };

    // خواندن متغیرهای CSS تعریف‌شده روی coco-chat-widget
    var cssValue = function (name) {
      try {
        return window.getComputedStyle(self.host).getPropertyValue(name).trim();
      } catch (e) {
        return '';
      }
    };

    var cssPosition = normalizePosition(cssValue('--coco-position'));

    // API > CSS > data-*
    var position = has('position')
      ? overrides.position
      : cssPosition || this.cfg.position;

    var cssX = parseOffset(cssValue('--coco-offset-x'));

    var cssY = parseOffset(cssValue('--coco-offset-y'));

    var cssMobileY = parseOffset(cssValue('--coco-mobile-offset-y'));

    var offsetX = has('offsetX')
      ? overrides.offsetX
      : cssX != null
        ? cssX
        : this.cfg.offsetX;

    var offsetY = has('offsetY')
      ? overrides.offsetY
      : cssY != null
        ? cssY
        : this.cfg.offsetY;

    var mobileOffsetY;

    if (has('mobileOffsetY')) {
      mobileOffsetY = overrides.mobileOffsetY;
    } else if (cssMobileY != null) {
      mobileOffsetY = cssMobileY;
    } else if (cssY != null) {
      mobileOffsetY = cssY;
    } else {
      mobileOffsetY = this.cfg.mobileOffsetY;
    }

    var isMobile = window.matchMedia
      ? window.matchMedia('(max-width: 640px)').matches
      : (window.innerWidth || document.documentElement.clientWidth) <= 640;

    return {
      position: position,
      offsetX: offsetX,
      offsetY: isMobile && mobileOffsetY != null ? mobileOffsetY : offsetY,
    };
  };

  Widget.prototype.applyPosition = function () {
    if (this.destroyed || !this.ui || !this.host) {
      return;
    }

    this.ui.setPosition(this.resolvePosition());
  };

  Widget.prototype.setPosition = function (options) {
    if (this.destroyed || !options || typeof options !== 'object') {
      return this;
    }

    var self = this;

    ['position', 'offsetX', 'offsetY', 'mobileOffsetY'].forEach(function (key) {
      if (!Object.prototype.hasOwnProperty.call(options, key)) {
        return;
      }

      var value = options[key];

      // حذف Override و بازگشت به CSS یا تنظیمات HTML
      if (value == null || value === '') {
        delete self.positionOverrides[key];
        return;
      }

      if (key === 'position') {
        var normalized = normalizePosition(value);

        if (normalized) {
          self.positionOverrides.position = normalized;
        }
      } else {
        var offset = parseOffset(value);

        if (offset != null) {
          self.positionOverrides[key] = offset;
        }
      }
    });

    this.applyPosition();

    return this;
  };

  Widget.prototype.open = function () {
    if (!this.destroyed) this.ui.open();
  };
  Widget.prototype.close = function () {
    if (!this.destroyed) this.ui.close();
  };
  Widget.prototype.toggle = function () {
    if (!this.destroyed) this.ui.toggle();
  };

  /* state -> view / header / composer / scenario */
  Widget.prototype.applyState = function (s, prev) {
    var ui = this.ui,
      d = this.store.data;
    var view =
      VIEW_BY_STATE[s] || (CHAT_STATES.indexOf(s) >= 0 ? 'chat' : null);
    if (view) ui.showView(view);
    ui.setBusy(BUSY_STATES.indexOf(s) >= 0);
    var away = s === 'OFF_HOURS' || s === 'NETWORK_ERROR';
    if (CHAT_STATES.indexOf(s) >= 0) {
      switch (s) {
        case 'THINKING':
          ui.setStatus(T.thinking, 'act', true);
          break;
        case 'READING':
          ui.setStatus(T.reading, 'act', true);
          break;
        case 'STREAMING':
          ui.setStatus(T.writing, 'act', true);
          break;
        case 'OFF_HOURS':
          ui.setStatus(T.offHours, '', false, true);
          break;
        case 'SEND_ERROR':
          ui.setStatus(T.sendFail, 'bad');
          break;
        case 'NETWORK_ERROR':
          ui.setStatus(
            this.net.status === 'reconnecting' ? T.reconnecting : T.waitNet,
            'bad',
            false,
            true
          );
          break;
        default:
          ui.setStatus(d.agent.status || T.online);
      }
      var lock =
        s === 'OFF_HOURS' || s === 'NETWORK_ERROR' || s === 'CHAT_LOADING';
      ui.setLocked(
        lock,
        s === 'OFF_HOURS' ? T.offPh : s === 'NETWORK_ERROR' ? T.netPh : null
      );
      if (s === 'OFF_HOURS') ui.ta.placeholder = T.offPh;
      if (s === 'NETWORK_ERROR') ui.ta.placeholder = T.netPh;
    }
    // Temporary status message at the end of the conversation.
    var key = SC_BY_STATE[s];
    if (key) {
      var o = {};
      if (s === 'SEND_ERROR') {
        o.action = {
          label: T.retry,
          onClick: function () {
            var id = this_.lastFailed;
            this_.retry(id);
          },
        };
        o.dismissible = true;
        o.onDismiss = function () {
          this_.store.set('READY');
        };
      } else if (s === 'WAITING') {
        o.dismissible = true;
        o.onDismiss = function () {
          this_.store.set('READY');
        };
      } else if (s === 'OFF_HOURS') {
        o.action = {
          label: T.viewChat,
          onClick: function () {
            this_.scenario.hide();
          },
        };
      }
      var this_ = this;
      this.scenario.show(key, o);
    } else this.scenario.hide();

    // waiting timer
    if (s === 'READY') this.armWaiting();
    else this.cancelWaiting();
  };

  /* ---------- waiting scenario ---------- */
  Widget.prototype.armWaiting = function () {
    var self = this;
    this.cancelWaiting();
    this.waitT = this.events.timeout(function () {
      if (
        self.store.state === 'READY' &&
        self.ui.isOpen() &&
        !self.ui.ta.value.trim()
      )
        self.store.set('WAITING');
    }, this.cfg.waitingAfterMs);
  };
  Widget.prototype.cancelWaiting = function () {
    if (this.waitT) {
      this.events.clearTimeout(this.waitT);
      this.waitT = 0;
    }
  };
  Widget.prototype.activity = function () {
    var s = this.store.state;
    if (s === 'WAITING') this.store.set('READY');
    else if (s === 'READY') this.armWaiting();
  };

  /* ---------- login + otp ---------- */
  Widget.prototype.requestOtp = async function (name, mobileRaw, isResend) {
    var ui = this.ui,
      d = this.store.data;
    if (!isResend) {
      var mobile = normalizeMobile(mobileRaw);
      if (name.length < 2) return ui.setLoginError('name', T.nameErr);
      if (!/^09\d{9}$/.test(mobile))
        return ui.setLoginError('mobile', T.mobileErr);
      d.name = name;
      d.mobile = mobile;
      ui.setLoginError(null, '');
      ui.setLoginBusy(true);
    }
    try {
      var r = await this.api.requestOtp({ name: d.name, mobile: d.mobile });
      if (this.destroyed) return;
      this.store.set('OTP');
      ui.showOtp(d.mobile, r && r.otpLength, r && r.resendAfter);
      ui.showView('otp');
    } catch (e) {
      if (this.destroyed) return;
      if (isResend) ui.setOtpError(friendly(e), false);
      else ui.setLoginError(null, friendly(e));
    } finally {
      if (!this.destroyed) ui.setLoginBusy(false);
    }
  };

  /* 3. authenticate */
  Widget.prototype.authenticate = async function (code) {
    var ui = this.ui,
      d = this.store.data;
    this.store.set('AUTHENTICATING');
    ui.setOtpBusy(true);
    try {
      var r = await this.api.verifyOtp({ mobile: d.mobile, otp: code });
      if (this.destroyed) return;
      d.user = r.user;
      this.bootstrap();
    } catch (e) {
      if (this.destroyed) return;
      this.store.set('OTP');
      ui.setOtpBusy(false);
      ui.setOtpError(friendly(e));
    }
  };

  /* 4. bootstrap */
  Widget.prototype.bootstrap = async function () {
    var self = this,
      d = this.store.data;
    this.store.set('BOOTSTRAPPING');
    this.ui.setBoot(null);
    var data;
    try {
      data = await this.api.bootstrap();
      if (!data || typeof data !== 'object') throw ApiError('invalid_response');
    } catch (e) {
      if (this.destroyed) return;
      if (e && e.code === 'session_expired') return this.expire();
      return this.ui.setBoot(friendly(e));
    }
    if (this.destroyed) return;
    var a = data.agent || {};
    d.agent = {
      name: String(a.name || T.brand),
      avatarUrl: a.avatarUrl || null,
      status: String(a.status || T.online),
      profile: readAgentProfile(a),
    };
    d.settings = data.settings || {};
    var serverMaxLength = d.settings.maxLength;
    this.cfg.maxLength =
      typeof serverMaxLength === 'number' &&
      Number.isInteger(serverMaxLength) &&
      serverMaxLength > 0
        ? Math.min(this.configuredMaxLength, serverMaxLength)
        : this.configuredMaxLength;
    this.ui.ta.maxLength = this.cfg.maxLength;
    this.ui.setComposerText(this.ui.ta.value.slice(0, this.cfg.maxLength));
    d.offHours = !!data.offHours;
    this.scenario.configure(data.scenarios);
    this.ui.setAgent(d.agent);
    this.mm.reset(Array.isArray(data.history) ? data.history : []);
    this.ui.renderAll(this.mm.list);
    this.store.set('CHAT_LOADING');
    var t0 = Date.now();
    await new Promise(function (res) {
      self.events.timeout(
        res,
        Math.max(0, self.cfg.chatLoadingMinMs - (Date.now() - t0))
      );
    });
    if (this.destroyed || this.store.state !== 'CHAT_LOADING') return;
    this.ready();
  };

  /* 5. ready */
  Widget.prototype.ready = function () {
    this.store.set(this.store.data.offHours ? 'OFF_HOURS' : 'READY');
    this.ui.scrollBottom(false);
    if (this.ui.isOpen()) this.ui.focusPrimary();
  };

  /* ---------- sending ---------- */
  Widget.prototype.canSend = function () {
    return (
      ['READY', 'WAITING', 'SEND_ERROR'].indexOf(this.store.state) >= 0 &&
      !this.busy
    );
  };
  Widget.prototype.send = function (text) {
    if (this.editId) return this.commitEdit(text);
    if (!this.canSend()) return;
    text = text.slice(0, this.cfg.maxLength);
    var m = this.mm.add({
      role: 'user',
      content: text,
      status: 'sending',
      replyTo: this.replyId,
      editable: true,
    });
    this.ui.setComposerText('');
    this.cancelReplyUi();
    this.ui.toggleEmoji(false);
    this.deliver(m.id);
  };
  Widget.prototype.cancelReplyUi = function () {
    this.replyId = null;
    this.editId = null;
    this.ui.setBanner('normal');
  };
  Widget.prototype.deliver = async function (userId) {
    var self = this,
      mm = this.mm,
      um = mm.get(userId);
    if (!um) return;
    this.busy = true;
    this.lastFailed = null;
    this.netFailedId = null;
    this.abortReason = null;
    mm.update(userId, { status: 'sending' });
    this.store.set('THINKING');
    var cur = userId;
    var replyMessage = um.replyTo ? mm.get(um.replyTo) : null;
    var replyTo =
      replyMessage && replyMessage.metadata.serverId != null
        ? String(replyMessage.metadata.serverId)
        : um.replyTo;
    var res = await this.streams.run(
      {
        text: um.content,
        replyTo: replyTo,
        clientId: userId,
        retryOf: um.metadata.serverId || null,
      },
      {
        onAck: function (ev) {
          if (self.destroyed) return;
          if (ev.id != null) {
            mm.update(cur, {
              metadata: Object.assign({}, mm.get(cur).metadata, {
                serverId: String(ev.id),
                delivered: true,
              }),
            });
          }
          mm.setStatus(cur, 'sent');
        },
        onPhase: function (p) {
          if (self.destroyed) return;
          if (p === 'reading') self.store.set('READING');
          else if (p === 'thinking') self.store.set('THINKING');
        },
        onStart: function () {
          if (!self.destroyed) self.store.set('STREAMING');
        },
      }
    );
    this.busy = false;
    if (this.destroyed) return;
    var u = mm.get(cur);

    if (res.status === 'aborted' && this.abortReason === 'network') {
      this.netFailedId = cur;
      this.lastFailed = cur;
      if (!res.aiId && u) mm.setStatus(cur, 'error');
      return; // state قبلاً در onNetwork روی NETWORK_ERROR رفته است
    }
    // ===================================
    if (res.status === 'done' || res.status === 'aborted') {
      if (u && u.status !== 'sent') mm.setStatus(cur, 'sent');
      if (this.store.state !== 'NETWORK_ERROR')
        this.store.set(this.store.data.offHours ? 'OFF_HOURS' : 'READY');
      return;
    }
    // error
    var err = res.error;
    if (err.code === 'session_expired') return this.expire();
    if (this.abortReason === 'network' || err.code === 'network') {
      this.netFailedId = cur;
      if (!res.aiId && u) mm.setStatus(cur, 'error');
      this.lastFailed = cur;
      if (this.store.state !== 'NETWORK_ERROR') this.store.set('NETWORK_ERROR');
      return;
    }
    this.lastFailed = cur;
    if (!res.aiId && u) mm.setStatus(cur, 'error');
    else if (res.aiId) {
      mm.update(res.aiId, {
        metadata: Object.assign({}, mm.get(res.aiId).metadata, {
          forUser: cur,
        }),
      });
      if (u && u.status !== 'sent') mm.setStatus(cur, 'sent');
    }
    this.store.set('SEND_ERROR');
  };
  Widget.prototype.stop = function () {
    this.abortReason = 'user';
    this.streams.abort();
  };
  Widget.prototype.retry = function (id) {
    if (this.busy || !id) return;
    var m = this.mm.get(id);
    if (!m) return;
    var userId = m.role === 'user' ? id : m.metadata && m.metadata.forUser;
    if (m.role !== 'user') this.mm.remove(id);
    if (!userId || !this.mm.get(userId)) return;
    if (this.store.state === 'NETWORK_ERROR') return;
    this.deliver(userId);
  };

  /* ---------- reply / edit ---------- */
  Widget.prototype.startReply = function (id) {
    var s = this.mm.replySnippet(id);
    if (!s) return;
    this.editId = null;
    this.replyId = id;
    this.ui.setBanner('reply', s);
    this.ui.focusComposer();
  };
  Widget.prototype.startEdit = function (id) {
    var m = this.mm.get(id);
    if (!m || m.role !== 'user') return;
    this.replyId = null;
    this.editId = id;
    this.ui.setBanner('edit', this.mm.replySnippet(id));
    this.ui.setComposerText(m.content);
    this.ui.focusComposer();
  };
  Widget.prototype.cancelCompose = function () {
    if (this.editId) this.ui.setComposerText('');
    this.cancelReplyUi();
  };
  Widget.prototype.commitEdit = async function (text) {
    text = text.slice(0, this.cfg.maxLength);
    var id = this.editId,
      m = this.mm.get(id);
    if (!m) return this.cancelCompose();
    if (text === m.content) return this.cancelCompose();
    var old = m.content;
    var oldEdited = m.edited;
    this.ui.setComposerText('');
    this.cancelReplyUi();
    this.mm.edit(id, text);
    try {
      await this.api.editMessage({
        id: (m.metadata && m.metadata.serverId) || id,
        text: text,
      });
    } catch (e) {
      this.mm.update(id, {
        content: old,
        edited: oldEdited,
      });
      if (e && e.code === 'session_expired') return this.expire();
      this.ui.toast(T.e_edit_failed);
    }
  };

  /* ---------- network ---------- */
  Widget.prototype.onNetwork = function (s) {
    if (this.destroyed) return;
    var st = this.store.state;
    if (CHAT_STATES.indexOf(st) < 0 && st !== 'BOOTSTRAPPING') return;
    if (s === 'offline') {
      if (st === 'BOOTSTRAPPING') return;
      if (BUSY_STATES.indexOf(st) >= 0) {
        this.abortReason = 'network';
        this.streams.abort();
      }
      this.resumeState =
        st === 'NETWORK_ERROR'
          ? this.resumeState
          : BUSY_STATES.indexOf(st) >= 0
            ? 'READY'
            : st;
      this.store.set('NETWORK_ERROR');
    } else if (s === 'reconnecting') {
      if (st === 'NETWORK_ERROR')
        this.ui.setStatus(T.reconnecting, 'bad', true, true);
    } else if (s === 'connected') {
      if (st !== 'NETWORK_ERROR') return;
      var next = this.store.data.offHours ? 'OFF_HOURS' : 'READY';
      this.store.set(next);
      this.ui.toast(T.connected);
      var id = this.netFailedId;
      if (id && this.mm.get(id) && next === 'READY') {
        this.netFailedId = null;
        this.retry(id);
      }
    }
  };

  /* ---------- session ---------- */
  Widget.prototype.expire = function () {
    this.api.clear();
    this.streams.abort();
    this.busy = false;
    this.store.set('SESSION_EXPIRED');
  };
  Widget.prototype.resetSession = function () {
    this.api.clear();
    this.mm.reset([]);
    this.cancelReplyUi();
    this.ui.setComposerText('');
    this.store.data.user = null;
    this.busy = false;
    this.store.set('LOGIN');
  };

  /* 6. destroy: remove everything the widget ever created */
  Widget.prototype.destroy = function () {
    if (this.destroyed) return;
    this.destroyed = true;
    this.streams.abort();
    this.streams._cancelRaf();
    this.scenario && this.scenario.destroy();
    if (this.ui.composerObserver) this.ui.composerObserver.disconnect();
    this.events.removeAll();
    (this.ui.fontFaces || []).forEach(function (face) {
      document.fonts.delete(face);
    });
    this.store.clear();
    this.mm.clear();
    this.api.clear();
    if (this.host && this.host.parentNode)
      this.host.parentNode.removeChild(this.host);
    this.host = null;
    this.shadow = null;
  };

  /* =====================================================================
   * 11. PUBLIC API
   * ===================================================================== */
  var instance = null;
  var pendingPosition = {};

  var CocoChat = {
    __coco: true,
    version: VERSION,
    init: function (opts) {
      if (instance) {
        console.warn('[CocoChat] already initialized. Call destroy() first.');
        return CocoChat;
      }
      var go = function () {
        instance = new Widget(opts);

        if (Object.keys(pendingPosition).length) {
          instance.setPosition(pendingPosition);
        }
      };
      if (document.body) go();
      else document.addEventListener('DOMContentLoaded', go, { once: true });
      return CocoChat;
    },
    open: function () {
      if (instance) instance.open();
    },
    close: function () {
      if (instance) instance.close();
    },
    toggle: function () {
      if (instance) instance.toggle();
    },
    setPosition: function (options) {
      if (!options || typeof options !== 'object') {
        return CocoChat;
      }

      // نگهداری تنظیمات برای حالتی که هنوز Widget ساخته نشده است
      for (var key in options) {
        if (Object.prototype.hasOwnProperty.call(options, key)) {
          pendingPosition[key] = options[key];
        }
      }

      if (instance) {
        instance.setPosition(options);
      }

      return CocoChat;
    },
    destroy: function () {
      if (instance) {
        instance.destroy();
        instance = null;
      }
    },
    get state() {
      return instance ? instance.store.state : null;
    },
    /* Mock controls (only exists while running against the mock service) */
    get mock() {
      return instance && instance.cfg.mock ? instance.cfg.mock : null;
    },
    /* Scenario access for debugging / host-driven demos */
    get scenarios() {
      return instance ? instance.scenario : null;
    },
  };
  window.CocoChat = CocoChat;

  if (!SCRIPT || SCRIPT.dataset.autoInit !== 'false') CocoChat.init();
})();
