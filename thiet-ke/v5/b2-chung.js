/*
 * V5-B2 — dữ liệu demo + hàm nhỏ dùng chung cho test.html, ho-so-lop.html, hoc-vien-lop.html, ho-so-hv.html.
 * DỮ LIỆU GIẢ (du-lieu-demo.md của V5-A). Dòng ghi "[B2]" = bổ sung của V5-B2 để đủ mẫu số (22 HV MB FT 101 …), không có trong seed.
 * Hôm nay T2 14/09/2026 · W3 SEP — không dữ liệu nào sau ngày này.
 */
(function () {
  'use strict';
  var q = new URLSearchParams(location.search);
  if (q.get('theme')) document.documentElement.dataset.theme = q.get('theme');

  /* ---------- luật điểm (scoring.ts:40-47, 226-236) ---------- */
  var lt = function (v) { return Math.round(v * 2) / 2; };                       // làm tròn 0,5 (x.25 → x.5, x.75 → x+1)
  var wTong = function (w1, w2) { return (w1 == null || w2 == null) ? null : lt((w1 + 2 * w2) / 3); };
  function tinh(hv) {
    var w = wTong(hv.w1, hv.w2);
    var du = [hv.l, hv.r, w, hv.s].every(function (x) { return typeof x === 'number'; });
    var ovr = du ? lt((hv.l + hv.r + w + hv.s) / 4) : null;
    var kv = hv.target - 0.5;
    var kq = ovr == null ? 'thieu' : (ovr >= kv ? 'dat' : 'chua-dat');
    /* SOS chỉ khi Overall dưới kỳ vọng (scoring.ts:233-236); mức minh hoạ = số kỹ năng dưới, tối đa 3 */
    var duoi = kq === 'chua-dat' ? [['L', hv.l], ['R', hv.r], ['W', w], ['S', hv.s]].filter(function (x) { return x[1] < kv; }).map(function (x) { return x[0]; }) : [];
    return { w: w, ovr: ovr, kv: kv, kq: kq, sos: duoi.length ? { m: Math.min(duoi.length, 3), kn: duoi.join(', ') } : null };
  }
  /* ✓ / ✗ tô chính con số so với kỳ vọng (G12) */
  function oDiem(v, kv, phu) {
    if (v == null || typeof v !== 'number') return '<span class="diem trong">—</span>' + (phu ? '<span class="phu-o">' + phu + '</span>' : '');
    var k = v > kv ? 'vuot' : v === kv ? 'bang-kv' : 'duoi';
    return '<span class="diem ' + k + '">' + v.toFixed(1) + '</span>' + (phu ? '<span class="phu-o so">' + phu + '</span>' : '');
  }
  var BD_KQ = { dat: '<span class="bd bd-kq dat">✓ Đạt</span>', 'chua-dat': '<span class="bd bd-kq chua-dat">✗ Chưa đạt</span>', thieu: '<span class="bd bd-kq thieu">– Chưa đủ dữ liệu</span>' };

  /* ---------- MB FT 101 · MT2 (W3 AUG, 17/08) · 22 HV ----------
   * 6 HV đầu = du-lieu-demo.md mục 5. 16 HV sau [B2] để khớp số tổng mục 5: 20 đủ dữ liệu · 15 đạt · 5 chưa đạt · 2 chưa đủ.
   * lich: {k:'ngay'|'du-kien'|'chua', t:'…'} — nhóm badge lịch thi. */
  var FT101 = [
    { id: 'an', ten: 'Nguyễn Minh An', target: 6.5, l: 6.0, r: 6.0, w1: 5.5, w2: 6.0, s: 6.0, lich: { k: 'du-kien', t: 'Dự kiến FEB 2027' }, mt3: { s: 'vang1' } },
    { id: 'thuha', ten: 'Trần Thu Hà', target: 6.0, l: 5.5, r: 5.5, w1: 5.5, w2: 5.5, s: 5.0, lich: { k: 'du-kien', t: 'Dự kiến JAN 2027' }, mt3: { s: 'vang2' } },
    { id: 'huy', ten: 'Lê Quang Huy', target: 6.5, l: 6.0, r: 5.0, w1: 5.0, w2: 5.5, s: 6.0, lich: { k: 'chua', t: 'Chưa có lịch' } },
    { id: 'ngoc', ten: 'Phạm Bảo Ngọc', target: 7.0, l: 6.5, r: 7.0, w1: 6.5, w2: 6.5, s: 6.5, lich: { k: 'du-kien', t: 'Dự kiến MAR 2027' }, mt3: { l: 6.5, r: 7.0 } },
    { id: 'dang', ten: 'Vũ Hải Đăng', target: 6.0, l: 6.0, r: 6.0, w1: 5.5, w2: 6.0, s: 6.0, lich: { k: 'chua', t: 'Chưa có lịch' } },
    { id: 'han', ten: 'Tô Ngọc Hân', target: 6.0, l: 5.5, r: 6.0, w1: 5.5, w2: 5.5, s: 'vắng', lich: { k: 'chua', t: 'Chưa có lịch' } },
    /* [B2] */
    { id: 'khoi', ten: 'Đoàn Minh Khôi', target: 6.5, l: 6.5, r: 6.0, w1: 5.5, w2: 6.0, s: 6.0, lich: { k: 'du-kien', t: 'Dự kiến DEC' } },
    { id: 'thao', ten: 'Hà Phương Thảo', target: 6.0, l: 6.0, r: 5.5, w1: 5.5, w2: 5.5, s: 5.5, lich: { k: 'du-kien', t: 'Dự kiến NOV' } },
    { id: 'kiet', ten: 'Lương Tuấn Kiệt', target: 6.5, l: 6.0, r: 6.0, w1: 5.0, w2: 5.0, s: 5.5, lich: { k: 'chua', t: 'Chưa có lịch' } },
    { id: 'thu', ten: 'Mai Anh Thư', target: 6.5, l: 6.5, r: 6.5, w1: 6.0, w2: 6.0, s: 6.0, lich: { k: 'ngay', t: 'Ngày thi 17/09' } },
    { id: 'long', ten: 'Nghiêm Đức Long', target: 6.0, l: 6.0, r: 6.0, w1: 5.0, w2: 5.5, s: 5.5, lich: { k: 'du-kien', t: 'Dự kiến JAN 2027' } },
    { id: 'ngan', ten: 'Ông Thị Ngân', target: 6.5, l: 5.5, r: 6.0, w1: 5.5, w2: 6.0, s: 5.0, lich: { k: 'chua', t: 'Chưa có lịch' } },
    { id: 'chau', ten: 'Quách Bảo Châu', target: 6.0, l: 6.0, r: 5.5, w1: 5.5, w2: 6.0, s: 5.5, lich: { k: 'du-kien', t: 'Dự kiến FEB 2027' } },
    { id: 'son', ten: 'Tạ Hoàng Sơn', target: 6.5, l: 6.0, r: 6.5, w1: 5.5, w2: 6.0, s: 6.0, lich: { k: 'du-kien', t: 'Dự kiến MAR 2027' } },
    { id: 'duc', ten: 'Triệu Minh Đức', target: 6.0, l: 5.5, r: 5.5, w1: 5.5, w2: 5.5, s: 6.0, lich: { k: 'du-kien', t: 'Dự kiến DEC' } },
    { id: 'dieu', ten: 'Văn Thị Diệu', target: 6.5, l: 6.0, r: 6.0, w1: 4.5, w2: 4.5, s: 6.0, lich: { k: 'chua', t: 'Chưa có lịch' } },
    { id: 'tuan', ten: 'Kiều Anh Tuấn', target: 6.0, l: 6.0, r: 6.0, w1: 5.5, w2: 5.5, s: 5.5, lich: { k: 'du-kien', t: 'Dự kiến NOV' } },
    { id: 'uyen', ten: 'Lã Thu Uyên', target: 6.5, l: 6.0, r: 6.0, w1: 6.0, w2: 6.0, s: 6.5, lich: { k: 'du-kien', t: 'Dự kiến JAN 2027' } },
    { id: 'hung', ten: 'Phùng Khắc Hưng', target: 6.0, l: 6.0, r: 6.0, w1: null, w2: 5.5, s: 6.0, lich: { k: 'chua', t: 'Chưa có lịch' } },
    { id: 'tram', ten: 'Cù Ngọc Trâm', target: 6.5, l: 6.5, r: 6.0, w1: 6.0, w2: 6.0, s: 6.0, lich: { k: 'du-kien', t: 'Dự kiến FEB 2027' } },
    { id: 'viet', ten: 'Mạc Quốc Việt', target: 7.0, l: 6.5, r: 6.5, w1: 5.5, w2: 5.5, s: 6.0, lich: { k: 'chua', t: 'Chưa có lịch' } },
    { id: 'thang', ten: 'Lò Văn Thắng', target: 6.0, l: 6.0, r: 5.5, w1: 5.5, w2: 5.5, s: 5.5, lich: { k: 'du-kien', t: 'Dự kiến DEC' } }
  ];
  FT101.forEach(function (hv) { var t = tinh(hv); for (var k in t) hv[k] = t[k]; });

  /* ---------- việc của từng HV (cột Việc) — nguồn: du-lieu-demo.md mục 7 ----------
   * ai = người phụ trách; kn = kỹ năng; han = {k:'qua'|'sap'|'cho'|'dang', t}. */
  var VIEC_HV = {
    an: [{ ai: 'Lê Minh Khoa', loai: 'case', ten: 'Ghi kết quả PA · R', kn: 'R', han: { k: 'dang', t: 'Đang làm' } }],
    thuha: [{ ai: 'Nguyễn Khánh Vy', loai: 'duyet', ten: 'Duyệt dời MT3 S', kn: 'S', han: { k: 'cho', t: 'Chờ QL duyệt' } }],
    huy: [
      { ai: 'Trần Ngọc Hà', loai: 'case', ten: 'Ghi kết quả PA · R', kn: 'R', han: { k: 'dang', t: 'Đang làm' } },
      { ai: 'Trần Ngọc Hà', loai: 'ythuc', ten: 'Xử lý vi phạm', han: { k: 'sap', t: 'Hạn hôm nay' } },
      { ai: 'Lê Minh Khoa', loai: 'case', ten: 'Ghi kết quả PA · W1', kn: 'W1', han: { k: 'dang', t: 'Đang làm' } }
    ],
    ngoc: [
      { ai: 'Trần Ngọc Hà', loai: 'ythuc', ten: 'Xử lý vi phạm', han: { k: 'qua', t: 'Quá hạn 1 ngày' } },
      { ai: 'Trần Ngọc Hà', loai: 'case', ten: 'Ghi kết quả PA · L', kn: 'L', han: { k: 'dang', t: 'Đang làm' } }
    ]
  };

  /* ---------- MB FOU 12 (lớp thường, GVCN cô Hà) · 12 HV [B2] ----------
   * Progress 17/08: số câu đúng, thang /25 mỗi kỹ năng [B2 giả định thang]. Final L/R thi 14/09 (cô Hà chưa nhập — việc 24 bài hạn CN 20/09),
   * W thi 21/09, S thi 28/09 → tới 14/09 chưa đủ Final. Lớp thường không có kỳ vọng band: số hiện trung tính. */
  var FOU12 = [
    ['nhi', 'Bạch Tuệ Nhi', 19, 17, 15, 16], ['tri', 'Cao Minh Trí', 14, 12, 13, 15], ['baoanh', 'Đinh Bảo Anh', 21, 20, 17, 18],
    ['thaomy', 'Giang Thảo My', 17, 18, 16, 14], ['ducanh', 'Hứa Đức Anh', 12, 13, 11, 12], ['thuy', 'Khúc Thu Thủy', 20, 19, 18, 19],
    ['hang', 'La Minh Hằng', 16, 15, 14, 16], ['quocbao', 'Mẫn Quốc Bảo', 18, 16, 15, 17], ['phuc', 'Nông Gia Phúc', 15, 17, 14, 13],
    ['diep', 'Phí Ngọc Diệp', 22, 21, 19, 20], ['ducminh', 'Thân Đức Minh', 13, 14, 12, 14], ['khanhhoa', 'Viên Khánh Hòa', 18, 19, 16, 15]
  ].map(function (r) { return { id: r[0], ten: r[1], p: { l: r[2], r: r[3], w: r[4], s: r[5] } }; });

  var NGUOI = {
    ha: { ten: 'Trần Ngọc Hà', ngan: 'Cô Hà', vai: 'GV', kn: ['L', 'R'] },
    khoa: { ten: 'Lê Minh Khoa', ngan: 'Thầy Khoa', vai: 'GV', kn: ['R', 'W1'] },
    trang: { ten: 'Phạm Thu Trang', ngan: 'Cô Trang', vai: 'GV', kn: ['S'] },
    huong: { ten: 'Đỗ Thu Hương', ngan: 'Cô Đỗ Thu Hương', vai: 'GV', kn: ['L', 'R', 'S'] },
    vy: { ten: 'Nguyễn Khánh Vy', ngan: 'QL Vy', vai: 'QL' },
    mai: { ten: 'Lê Ngọc Mai', ngan: 'QL Mai', vai: 'QL' },
    phong: { ten: 'Đỗ Vũ Tuấn Phong', ngan: 'QT Phong', vai: 'QT' },
    tam: { ten: 'Vũ Thanh Tâm', ngan: 'CX Tâm', vai: 'CX' }
  };

  /* ---------- khung demo: ?khung=… đặt data-khung trên <body>; nút Sáng / Tối ---------- */
  function datKhung() { document.body.dataset.khung = q.get('khung') || 'thuong'; }
  function doiSangToi() { var r = document.documentElement; r.dataset.theme = r.dataset.theme === 'dark' ? 'light' : 'dark'; }
  function moKhung(k) { var u = new URL(location.href); u.searchParams.set('khung', k); location.href = u.toString(); }
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  window.B2 = { q: q, lt: lt, wTong: wTong, tinh: tinh, oDiem: oDiem, BD_KQ: BD_KQ, FT101: FT101, FOU12: FOU12, VIEC_HV: VIEC_HV, NGUOI: NGUOI, datKhung: datKhung, doiSangToi: doiSangToi, moKhung: moKhung, esc: esc };
})();
