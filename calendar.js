(function (global) {
  var EPOCH = "2026-08-22";
  var WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

  function parseYmd(ymd) {
    var p = ymd.split("-");
    return Date.UTC(+p[0], +p[1] - 1, +p[2]);
  }

  function offsetFromEpoch(ymd) {
    return Math.round((parseYmd(ymd) - parseYmd(EPOCH)) / 86400000);
  }

  function isEven(n) {
    return ((n % 2) + 2) % 2 === 0;
  }

  function weekdayUtcYmd(ymd) {
    return new Date(parseYmd(ymd)).getUTCDay();
  }

  function assignBath(ymd) {
    var closed = weekdayUtcYmd(ymd) === 5;
    var even = isEven(offsetFromEpoch(ymd));
    if (closed) {
      return { ymd: ymd, closed: true, men: null, women: null, menShort: "休", womenShort: "休" };
    }
    return {
      ymd: ymd,
      closed: false,
      men: even ? "月の湯" : "陽の湯",
      women: even ? "陽の湯" : "月の湯",
      menShort: even ? "月" : "陽",
      womenShort: even ? "陽" : "月"
    };
  }

  function tokyoTodayYmd(now) {
    now = now || new Date();
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(now);
  }

  function formatJaDate(ymd) {
    var p = ymd.split("-");
    var w = WEEKDAYS[weekdayUtcYmd(ymd)];
    return p[0] + "年" + Number(p[1]) + "月" + Number(p[2]) + "日 " + w + "曜";
  }

  function pad2(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function monthGrid(year, month) {
    var startDow = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
    var days = new Date(Date.UTC(year, month, 0)).getUTCDate();
    var cells = [];
    var i;
    for (i = 0; i < startDow; i++) cells.push(null);
    for (i = 1; i <= days; i++) {
      cells.push(assignBath(year + "-" + pad2(month) + "-" + pad2(i)));
    }
    return cells;
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function isYoBath(name) {
    return name === "陽の湯" || name === "陽";
  }

  function bathIcon(name) {
    var icon = document.createElement("i");
    icon.className = "fa-solid bath-icon " + (isYoBath(name) ? "fa-sun" : "fa-moon");
    icon.setAttribute("aria-hidden", "true");
    return icon;
  }

  function labeledBath(className, name) {
    var wrap = el("span", className);
    wrap.appendChild(bathIcon(name));
    wrap.appendChild(document.createTextNode(name));
    return wrap;
  }

  function ymdParts(ymd) {
    var p = ymd.split("-");
    return { y: +p[0], m: +p[1], d: +p[2] };
  }

  function mount() {
    var todayRoot = document.getElementById("today-bath");
    var calRoot = document.getElementById("bath-calendar");
    if (!todayRoot || !calRoot) return;

    var today = tokyoTodayYmd();
    var selected = today;
    var parts = ymdParts(today);
    var viewY = parts.y;
    var viewM = parts.m;

    function renderToday() {
      todayRoot.replaceChildren();
      var heading = el("h2", null, formatJaDate(selected));
      heading.id = "today-bath-heading";
      todayRoot.appendChild(heading);
      var info = assignBath(selected);
      if (info.closed) {
        todayRoot.appendChild(el("p", "bath-closed", "休み"));
      } else {
        var row = el("div", "bath-pair");
        var men = el("p", "bath-side bath-men");
        men.appendChild(el("span", "bath-who", "男性"));
        men.appendChild(labeledBath("bath-name", info.men));
        var women = el("p", "bath-side bath-women");
        women.appendChild(el("span", "bath-who", "女性"));
        women.appendChild(labeledBath("bath-name", info.women));
        row.appendChild(men);
        row.appendChild(women);
        todayRoot.appendChild(row);
      }
    }

    function renderCal() {
      calRoot.hidden = false;
      calRoot.replaceChildren();
      var nav = el("div", "cal-nav");
      var prev = el("button", "cal-nav-btn", "前の月");
      prev.type = "button";
      var next = el("button", "cal-nav-btn", "次の月");
      next.type = "button";
      var title = el("h2", "cal-title", viewY + "年" + viewM + "月");
      prev.addEventListener("click", function () {
        viewM -= 1;
        if (viewM < 1) {
          viewM = 12;
          viewY -= 1;
        }
        renderCal();
      });
      next.addEventListener("click", function () {
        viewM += 1;
        if (viewM > 12) {
          viewM = 1;
          viewY += 1;
        }
        renderCal();
      });
      nav.appendChild(prev);
      nav.appendChild(title);
      nav.appendChild(next);
      calRoot.appendChild(nav);

      var grid = el("div", "cal-grid");
      ["日", "月", "火", "水", "木", "金", "土"].forEach(function (w) {
        grid.appendChild(el("div", "cal-dow", w));
      });
      monthGrid(viewY, viewM).forEach(function (cell) {
        if (!cell) {
          grid.appendChild(el("div", "cal-cell cal-empty"));
          return;
        }
        var btn = el("button", "cal-cell");
        btn.type = "button";
        var day = ymdParts(cell.ymd).d;
        btn.appendChild(el("span", "cal-num", String(day)));
        if (cell.closed) {
          btn.appendChild(el("span", "cal-mark", cell.menShort));
        } else {
          var marks = el("span", "cal-marks");
          marks.appendChild(labeledBath("cal-mark is-men", cell.menShort));
          marks.appendChild(labeledBath("cal-mark is-women", cell.womenShort));
          btn.appendChild(marks);
        }
        if (cell.ymd === today) btn.className += " is-today";
        if (cell.ymd === selected) btn.className += " is-selected";
        if (cell.closed) btn.className += " is-closed";
        btn.addEventListener("click", function () {
          selected = cell.ymd;
          renderToday();
          renderCal();
        });
        grid.appendChild(btn);
      });
      calRoot.appendChild(grid);
    }

    renderToday();
    renderCal();
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", mount);
    } else {
      mount();
    }
  }

  var api = {
    EPOCH: EPOCH,
    assignBath: assignBath,
    tokyoTodayYmd: tokyoTodayYmd,
    formatJaDate: formatJaDate,
    monthGrid: monthGrid,
    mount: mount
  };

  global.TogoshiBath = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
