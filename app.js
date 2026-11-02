// Lãi Thật – xử lý hoàn toàn trong trình duyệt.
const CFG = {
  bankBin: "970436",            // Vietcombank
  account: "1016315101",
  accountName: "DUONG TRONG TIN",
  zalo: "0972699196",           // khách báo chuyển khoản qua Zalo
  salt: "lt-2026-v1",
  freeSkus: 5,
  freeDays: 31,
};

const $ = (id) => document.getElementById(id);
const fmt = (n) => Math.round(n).toLocaleString("vi-VN") + "đ";
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

let orders = [];                       // dòng đã chuẩn hoá
let costs = store.get("lt_costs", {}); // giá vốn theo mã hàng
let unlocked = false;

// ---------- Đọc file ----------
const COLS = {
  id: ["mã đơn hàng", "order id", "mã đơn"],
  status: ["trạng thái đơn hàng", "order status"],
  sku: ["sku phân loại hàng", "seller sku", "sku sản phẩm", "mã sku", "mã sản phẩm", "sku"],
  name: ["tên sản phẩm", "product name"],
  qty: ["số lượng", "quantity", "số lượng sản phẩm"],
  amount: ["tổng giá bán (sản phẩm)", "sku subtotal after discount", "giá ưu đãi", "thành tiền"],
  ship: ["phí vận chuyển mà người mua trả", "shipping fee after discount"],
  date: ["ngày đặt hàng", "created time", "thời gian đặt hàng", "ngày tạo đơn", "order creation time"],
  return: ["trạng thái trả hàng/hoàn tiền", "cancelation/return type", "lý do hủy"],
};

function pick(row, keys) {
  const hdrs = Object.keys(row);
  for (const k of keys) {
    const h = hdrs.find((x) => x.trim().toLowerCase() === k);
    if (h !== undefined) return row[h];
  }
  for (const k of keys) {
    const h = hdrs.find((x) => x.trim().toLowerCase().includes(k));
    if (h !== undefined) return row[h];
  }
  return undefined;
}

const num = (v) => {
  if (typeof v === "number") return v;
  if (!v) return 0;
  const s = String(v).replace(/[^\d,.-]/g, "");
  // "1.234.567" hoặc "1,234,567" → số nguyên; "12.5" giữ thập phân
  if (/^\d{1,3}([.,]\d{3})+$/.test(s)) return +s.replace(/[.,]/g, "");
  return +s.replace(",", ".") || 0;
};

function parseDate(v) {
  if (v instanceof Date) return v;
  if (typeof v === "number") return new Date(Math.round((v - 25569) * 864e5));
  const m = String(v || "").match(/(\d{1,4})[-/](\d{1,2})[-/](\d{1,4})/);
  if (!m) return null;
  return m[1].length === 4 ? new Date(+m[1], m[2] - 1, +m[3]) : new Date(+m[3], m[2] - 1, +m[1]);
}

function normalize(rows, platform) {
  const out = [];
  for (const r of rows) {
    const id = pick(r, COLS.id);
    if (!id) continue;
    const status = String(pick(r, COLS.status) || "").toLowerCase();
    const ret = String(pick(r, COLS.return) || "").trim();
    const failed = /hủy|huỷ|cancel|trả hàng|hoàn tiền|return|refund/.test(status) || (ret && !/^(-|không)$/i.test(ret));
    out.push({
      platform,
      id: String(id).trim(),
      sku: String(pick(r, COLS.sku) || pick(r, COLS.name) || "(không mã)").trim(),
      qty: num(pick(r, COLS.qty)) || 1,
      amount: num(pick(r, COLS.amount)),
      ship: num(pick(r, COLS.ship)),
      date: parseDate(pick(r, COLS.date)),
      failed,
    });
  }
  return out;
}

async function readFiles(files) {
  const all = [];
  for (const f of files) {
    const wb = XLSX.read(await f.arrayBuffer(), { type: "array", cellDates: true });
    const ws = wb.Sheets[wb.SheetNames[0]];
    let rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
    // TikTok có dòng mô tả ngay dưới tiêu đề
    if (rows.length && /platform unique order id/i.test(String(Object.values(rows[0])[0]))) rows = rows.slice(1);
    const hdr = Object.keys(rows[0] || {}).join("|").toLowerCase();
    const platform = /order id|seller sku/.test(hdr) && !/mã đơn hàng/.test(hdr) ? "tiktok" : "shopee";
    all.push(...normalize(rows, platform));
  }
  return all;
}

// ---------- Tính lãi ----------
const val = (id) => +$(id).value || 0;

function compute() {
  const p = {
    sp_fix: val("sp_fix") / 100, sp_pay: val("sp_pay") / 100, sp_svc: val("sp_svc"),
    tt_fix: val("tt_fix") / 100, tt_pay: val("tt_pay") / 100,
    ads: val("ads") / 100, tax: val("tax") / 100, pack: val("pack"),
  };
  let list = orders;
  if (!unlocked && list.length) {
    const maxT = Math.max(...list.map((o) => (o.date ? o.date.getTime() : 0)));
    if (maxT) list = list.filter((o) => !o.date || o.date.getTime() > maxT - CFG.freeDays * 864e5);
  }
  const perOrder = {};
  for (const o of list) (perOrder[o.id] ||= []).push(o);

  const bySku = {};
  let rev = 0, fee = 0, tax = 0, cogs = 0, failed = 0;
  for (const lines of Object.values(perOrder)) {
    if (lines.some((l) => l.failed)) { failed++; continue; }
    const tot = lines.reduce((s, l) => s + l.amount, 0) || 1;
    const plat = lines[0].platform;
    const ship = Math.max(...lines.map((l) => l.ship));
    // Phí theo đơn chia cho từng dòng theo tỉ lệ doanh thu
    const orderFee = plat === "tiktok"
      ? tot * p.tt_fix + (tot + ship) * p.tt_pay
      : tot * (p.sp_fix + p.sp_pay) + p.sp_svc;
    for (const l of lines) {
      const share = l.amount / tot;
      const f = orderFee * share + l.amount * p.ads + p.pack * share;
      const t = l.amount * p.tax;
      const c = (costs[l.sku] || 0) * l.qty;
      const s = (bySku[l.sku] ||= { qty: 0, rev: 0, fee: 0, tax: 0, cogs: 0 });
      s.qty += l.qty; s.rev += l.amount; s.fee += f; s.tax += t; s.cogs += c;
      rev += l.amount; fee += f; tax += t; cogs += c;
    }
  }
  return { bySku, rev, fee, tax, cogs, net: rev - fee - tax - cogs, failed, orders: Object.keys(perOrder).length };
}

const discPct = () => { const d = +$("h_disc").value.replace(/\D/g, "") || 0; return d >= 90 ? 0 : d; };

function render() {
  if (!orders.length) return;
  const r = compute();
  $("out").classList.remove("hide");
  $("k_rev").textContent = fmt(r.rev);
  $("k_fee").textContent = fmt(r.fee);
  $("k_tax").textContent = fmt(r.tax);
  $("k_cogs").textContent = fmt(r.cogs);
  $("k_net").textContent = fmt(r.net);
  $("k_net").className = r.net < 0 ? "neg" : "pos";
  $("k_ret").textContent = `${r.failed}/${r.orders}`;

  const rows = Object.entries(r.bySku).sort((a, b) => b[1].rev - a[1].rev);
  const disc = discPct();
  $("th_list").textContent = disc > 0 ? `Niêm yết để giảm ${disc}%` : "Giá niêm yết";
  const shown = unlocked ? rows : rows.slice(0, CFG.freeSkus);
  $("lock").classList.toggle("hide", unlocked || rows.length <= CFG.freeSkus);
  const tb = $("tbl").querySelector("tbody");
  tb.innerHTML = "";
  for (const [sku, s] of shown) {
    const net = s.rev - s.fee - s.tax - s.cogs;
    const tr = document.createElement("tr");
    const cell = (t, cls) => { const td = document.createElement("td"); td.textContent = t; if (cls) td.className = cls; tr.appendChild(td); };
    cell(sku); cell(s.qty); cell(fmt(s.rev)); cell(fmt(s.fee + s.tax));
    cell(disc > 0 && disc < 90 && s.qty ? fmt(s.rev / s.qty / (1 - disc / 100)) : "–");
    const td = document.createElement("td");
    const inp = document.createElement("input");
    inp.type = "number"; inp.value = costs[sku] || ""; inp.placeholder = "0";
    inp.onchange = () => { costs[sku] = +inp.value || 0; store.set("lt_costs", costs); render(); };
    td.appendChild(inp); tr.appendChild(td);
    cell(fmt(net), net < 0 ? "neg" : "pos");
    cell(s.rev ? (net / s.rev * 100).toFixed(1) + "%" : "–");
    tb.appendChild(tr);
  }
  $("status").textContent = `Đã đọc ${r.orders} đơn${unlocked ? "" : " (bản miễn phí: 31 ngày gần nhất)"}.`;
}

function exportCsv() {
  if (!unlocked) { location.hash = "buy"; $("keymsg").textContent = "Sổ doanh thu có trong bản đầy đủ."; return; }
  const lines = [["Ngày", "Sàn", "Mã đơn", "Mã hàng", "Số lượng", "Doanh thu", "Trạng thái"]];
  for (const o of orders) lines.push([o.date ? o.date.toISOString().slice(0, 10) : "", o.platform, o.id, o.sku, o.qty, o.amount, o.failed ? "Huỷ/hoàn" : "Thành công"]);
  const csv = "﻿" + lines.map((l) => l.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = "so-doanh-thu.csv";
  a.click();
}

// ---------- Mã mở khoá ----------
async function sha(s) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
}
async function checkKey(k) {
  const m = String(k).trim().toUpperCase().match(/^LT-([TL])-([A-Z0-9]{6})-([A-F0-9]{6})$/);
  if (!m) return null;
  const h = (await sha(CFG.salt + m[1] + m[2])).slice(0, 6).toUpperCase();
  return h === m[3] ? m[1] : null;
}

// ---------- VietQR (chuẩn EMVCo, tạo tại chỗ) ----------
const tlv = (id, v) => id + String(v.length).padStart(2, "0") + v;
function crc16(s) {
  let c = 0xffff;
  for (let i = 0; i < s.length; i++) {
    c ^= s.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) c = c & 0x8000 ? (c << 1) ^ 0x1021 : c << 1;
    c &= 0xffff;
  }
  return c.toString(16).toUpperCase().padStart(4, "0");
}
function vietqr(amount, memo) {
  const acc = tlv("00", "A000000727") + tlv("01", tlv("00", CFG.bankBin) + tlv("01", CFG.account)) + tlv("02", "QRIBFTTA");
  const p = tlv("00", "01") + tlv("01", "12") + tlv("38", acc) + tlv("53", "704") + tlv("54", String(amount)) + tlv("58", "VN") + tlv("62", tlv("08", memo)) + "6304";
  return p + crc16(p);
}

function showPay(plan, amount) {
  const code = Math.random().toString(36).slice(2, 8).toUpperCase();
  const memo = `LT${plan}${code}`;
  store.set("lt_order", { plan, amount, memo, t: Date.now() });
  const q = qrcode(0, "M");
  q.addData(vietqr(amount, memo));
  q.make();
  $("qr").innerHTML = q.createImgTag(5, 8);
  $("memo").textContent = memo;
  $("amt").textContent = fmt(amount);
  $("pay").classList.remove("hide");
}

// ---------- Gắn sự kiện ----------
const drop = $("drop"), file = $("file");
drop.onclick = () => file.click();
drop.ondragover = (e) => { e.preventDefault(); drop.classList.add("on"); };
drop.ondragleave = () => drop.classList.remove("on");
drop.ondrop = (e) => { e.preventDefault(); drop.classList.remove("on"); load(e.dataTransfer.files); };
file.onchange = () => load(file.files);
async function load(files) {
  $("status").textContent = "Đang đọc…";
  try { orders = await readFiles([...files]); render(); if (!orders.length) $("status").textContent = "Không thấy cột Mã đơn hàng / Order ID trong file."; }
  catch (e) { $("status").textContent = "Không đọc được file: " + e.message; }
}
document.querySelectorAll("input[type=number]").forEach((i) => { if (i.closest(".fee-grid")) i.oninput = render; });
document.querySelectorAll("[data-plan]").forEach((b) => (b.onclick = () => showPay(b.dataset.plan, +b.dataset.amt)));
$("csv").onclick = exportCsv;
$("sent").onclick = () => {
  const o = store.get("lt_order", {});
  const msg = `Lai That: da chuyen khoan ${o.amount}d, noi dung ${o.memo}. Xin ma mo khoa.`;
  try { navigator.clipboard.writeText(msg); } catch {}
  window.open(`https://zalo.me/${CFG.zalo}`, "_blank", "noopener");
  $("sentmsg").textContent = `Đã chép sẵn tin nhắn, dán vào Zalo ${CFG.zalo} và gửi. Mã mở khoá trả lời qua Zalo sau khi đối soát.`;
};
$("unlock").onclick = async () => {
  const plan = await checkKey($("key").value);
  if (!plan) { $("keymsg").textContent = "Mã không đúng."; return; }
  store.set("lt_key", $("key").value.trim().toUpperCase());
  unlocked = true; $("keymsg").textContent = "Đã mở khoá bản đầy đủ."; render();
};
(async () => { const k = store.get("lt_key", ""); if (k && (await checkKey(k))) unlocked = true; })();

// ---------- Hoá đơn bóc tách 1 đơn (đầu trang) ----------
let sale = "shopee";
const vnd = (s) => +String(s).replace(/\D/g, "") || 0;
function heroCalc() {
  const price = vnd($("h_price").value), cost = vnd($("h_cost").value);
  const pct = (id) => (val(id) / 100) * price;
  const lines = sale === "tiktok"
    ? [["Hoa hồng TikTok", pct("tt_fix")], ["Phí giao dịch", pct("tt_pay")], ["Phí xử lý đơn", 3000], ["Thuế hộ kinh doanh", pct("tax")]]
    // Khớp đơn Shopee thật đã quyết toán 10/2026: cố định 10,5% + gói Xtra 5% + quảng cáo hiển thị 1,08% + PiShip 2.700đ
    : [["Phí cố định + gói Xtra", pct("sp_fix") + 0.05 * price], ["Phí thanh toán", pct("sp_pay")], ["Phí dịch vụ", val("sp_svc")], ["PiShip", 2700], ["Quảng cáo hiển thị", 0.0108 * price], ["Thuế hộ kinh doanh", pct("tax")]];
  lines.push(["Giá vốn", cost]);
  const box = $("h_lines");
  box.textContent = "";
  const add = (label, amount, cls) => {
    const d = document.createElement("div"); d.className = "r-line" + (cls ? " " + cls : "");
    const a = document.createElement("span"); a.textContent = label;
    const b = document.createElement("b"); b.textContent = amount;
    d.append(a, b); box.appendChild(d);
  };
  add("Khách trả", fmt(price));
  let left = price;
  for (const [l, v] of lines) { add(l, "−" + fmt(v), "cut"); left -= v; }
  $("h_net").textContent = fmt(left);
  $("h_total").classList.toggle("neg", left < 0);
  const d = discPct();
  $("h_list").textContent = price && d > 0 ? `Muốn hiển thị giảm ${d}% mà khách vẫn trả ${fmt(price)} thì niêm yết ${fmt(price / (1 - d / 100))} (phải là giá bạn từng bán thật).` : "";
  $("h_note").textContent = price ? `Sàn chuyển về ${fmt(left + cost)} (${Math.round((left + cost) / price * 100)}%), biên lãi ${(left / price * 100).toFixed(1)}%` : "";
}
$("h_disc").addEventListener("input", () => { heroCalc(); if (orders.length) render(); });
["h_price", "h_cost"].forEach((id) => {
  $(id).addEventListener("input", (e) => {
    const n = vnd(e.target.value);
    e.target.value = n ? n.toLocaleString("vi-VN") : "";
    heroCalc();
  });
});
document.querySelectorAll("[data-sale]").forEach((b) => (b.onclick = () => {
  sale = b.dataset.sale;
  document.querySelectorAll("[data-sale]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
  heroCalc();
}));
document.querySelectorAll(".fee-grid input").forEach((i) => i.addEventListener("input", heroCalc));
$("drop").addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); file.click(); } });
heroCalc();
