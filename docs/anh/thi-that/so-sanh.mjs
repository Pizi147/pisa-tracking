// So sánh luật C10 (cũ, SQL chỉ đọc) với luật mới 2F (thongKeThiThat) trên bản sao 29/10 — chỉ đọc.
const W = process.argv[2];
const { db } = await import(`file:///${W}/dist-server/server/src/db.js`);
const { mucThiTheoGv, oThiGv } = await import(`file:///${W}/dist-server/server/src/phanTich/thiThatThongKe.js`);
const conn = db();
const q = (s, ...a) => conn.prepare(s).all(...a);
console.log('Phân công thiếu effective_to:', JSON.stringify(q(`SELECT ta.status, ta.is_core, COUNT(*) n FROM teacher_assignments ta GROUP BY ta.status, ta.is_core, ta.effective_to IS NULL HAVING ta.effective_to IS NULL`)));
console.log('— trong đó status ended (đã kết thúc mà không ngày):', q(`SELECT COUNT(*) n FROM teacher_assignments WHERE effective_to IS NULL AND status = 'ended'`)[0].n);
console.log('Kết quả thi thật đủ 4 KN:', q(`SELECT COUNT(*) n, SUM(khong_cam_ket) kck, MIN(thi_that_ngay) tu, MAX(thi_that_ngay) den FROM learning_cycles WHERE route IS NOT NULL AND thi_that_l IS NOT NULL AND thi_that_r IS NOT NULL AND thi_that_w IS NOT NULL AND thi_that_s IS NOT NULL`)[0]);
// C10 cũ: lớp lúc thi = ghi danh FT hiệu lực ngày thi (muộn nhất); GV = phân công kỹ năng hiệu lực ngày thi (id lớn nhất); Pass = outcome reached; một dòng một lần thi.
const cu = q(`
WITH thi AS (SELECT c.id, c.student_id, c.thi_that_ngay d, c.outcome FROM learning_cycles c
  WHERE c.route IS NOT NULL AND c.thi_that_ngay IS NOT NULL AND COALESCE(c.thi_that_khong_thi,0)=0 AND COALESCE(c.khong_cam_ket,0)=0 AND c.outcome IN ('reached','not_reached')
    AND COALESCE(c.thi_that_target, c.target_score) IS NOT NULL AND c.thi_that_l IS NOT NULL AND c.thi_that_r IS NOT NULL AND c.thi_that_w IS NOT NULL AND c.thi_that_s IS NOT NULL),
lop AS (SELECT id, lop, outcome, d FROM (SELECT t.id, e.class_id lop, t.outcome, t.d, ROW_NUMBER() OVER (PARTITION BY t.id
    ORDER BY (e.ended_at IS NULL OR substr(e.ended_at,1,10)>=t.d) DESC, e.started_at DESC, e.id DESC) rn
  FROM thi t JOIN enrollments e ON e.student_id=t.student_id AND substr(e.started_at,1,10)<=t.d) WHERE rn=1),
gv AS (SELECT l.id, l.outcome, l.lop, (SELECT ta.user_id FROM teacher_assignments ta WHERE ta.class_id=l.lop AND ta.skill=sk.s AND ta.status IN ('active','ended')
    AND ta.effective_from<=l.d AND (ta.effective_to IS NULL OR ta.effective_to>=l.d) ORDER BY ta.id DESC LIMIT 1) u
  FROM lop l, (SELECT 'listening' s UNION ALL SELECT 'reading' UNION ALL SELECT 'writing1' UNION ALL SELECT 'writing2' UNION ALL SELECT 'speaking') sk)
SELECT g.u, us.full_name ten, k.branch_id cn, COUNT(DISTINCT g.id) tong, COUNT(DISTINCT CASE WHEN g.outcome='reached' THEN g.id END) dung
FROM gv g JOIN users us ON us.id=g.u JOIN classes k ON k.id=g.lop WHERE g.u IS NOT NULL GROUP BY g.u, k.branch_id ORDER BY k.branch_id, us.full_name`);
const cn = q(`SELECT DISTINCT branch_id id FROM classes WHERE is_fast_track = 1`).map((r) => r.id);
const moi = new Map();
for (const c of cn) for (const [u, ds] of mucThiTheoGv(c, '2000-01-01', '2100-12-31')) moi.set(`${u}:${c}`, { ...oThiGv(ds), duoi: Math.round(100 * ds.filter((m) => m.duoi).reduce((x, m) => x + m.w, 0) / ds.reduce((x, m) => x + m.w, 0)) });
const ten = new Map(q(`SELECT id, full_name FROM users`).map((r) => [r.id, r.full_name]));
const ma = new Map(q(`SELECT id, code FROM branches`).map((r) => [r.id, r.code]));
const khoa = new Set([...cu.map((r) => `${r.u}:${r.cn}`), ...moi.keys()]);
const dong = [...khoa].map((k) => { const [u, c] = k.split(':').map(Number); const a = cu.find((r) => r.u === u && r.cn === c); const b = moi.get(k);
  return { cn: ma.get(c), gv: process.env.CO_TEN ? ten.get(u) : `GV #${u}`, /* repo: chỉ mã GV (dữ liệu thật); CO_TEN=1 khi cần bảng có tên gửi riêng */ truoc: a ? `${a.dung}/${a.tong} lần thi · ${Math.round(100 * a.dung / a.tong)} %` : '—', sau: b?.k === 'so' ? `${b.dung}/${b.tong} mục · ${b.pt} %` : '—', duoi: b?.k === 'so' ? `${b.duoi} %` : '—', doi: !a || !b || b.k !== 'so' || Math.round(100 * a.dung / a.tong) !== b.pt }; })
  .sort((x, y) => (x.cn + x.gv).localeCompare(y.cn + y.gv, 'vi'));
console.log('\n| Chi nhánh | GV | Trước (C10: Pass theo lần thi) | Sau (Pass theo OVR · mục em × kỹ năng · % tuần dạy) | KN dưới Target (% tuần dạy) | % Pass |\n|---|---|---|---|---|---|');
for (const r of dong) console.log(`| ${r.cn} | ${r.gv} | ${r.truoc} | ${r.sau} | ${r.duoi} | ${r.doi ? 'đổi' : ''} |`);
