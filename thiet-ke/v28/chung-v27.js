/* CHÉP NGUYÊN từ ../v27/tuyen-cong-viec.html (dòng 79–159 + formBaoPh + bangEm): cách vẽ khuôn A, panel 720, khối việc ô bấm, Việc con, khối Tuyến, chuỗi chấm. Không sửa ở đây — sửa ở v27 rồi chép lại. */
/* ================= CHUNG (chép cách vẽ v24) ================= */
const chev = (c) => `<svg class="chev ${c}" aria-hidden="true"><use href="#i-chev"/></svg>`;
const ic = (t) => `<svg class="ic" aria-hidden="true"><use href="#i-${t}"/></svg>`;
const hanChu = (h) => (h ? `<span class="hn ${h[1] || ''}">${h[0]}</span>` : '<span class="hn"></span>');
const demQua = (vs) => vs.filter((v) => v.han?.[1] === 'qua').length;
function dong(v, o, laCon) {
  const lop = [['v', 1], ['kl', v.tieuDe], ['chon', o.chon === v.id], ['re', o.re === v.id]].filter((x) => x[1]).map((x) => x[0]).join(' ');
  const mo = v.em ? ` aria-expanded="${o.mo === v.id}"` : '';
  const sos = v.sos ? `<span class="chip sos${v.sos}">SOS ${v.sos}</span>` : '';
  let h = `<button type="button" class="${lop}"${mo}><span class="lop">${laCon ? '' : v.lop ?? ''}</span><span class="ai">${v.tieuDe ?? v.ten ?? `${v.n} em`}${v.em ? chev('xo') : ''}${sos}</span><span class="ct">${v.ct ?? ''}</span>${hanChu(v.han)}${v.trang ? chev('di') : ''}</button>`;
  if (v.em) h += `<div class="con">${v.em.map((e) => dong(e, o, true)).join('')}</div>`;
  return h;
}
const veNhom = (n, o) => { const q = demQua(n.viec); return `<section class="ds"><div class="ds-dau"><h3>${n.ten}</h3><span>${n.viec.length} ${n.donVi ?? 'việc'}${q ? ` · <span class="qua-chu">${q} quá hạn</span>` : ''}</span>${n.gap ? `<span class="phai">${chev('')}</span>` : ''}</div>${n.gap ? '' : n.viec.map((v) => dong(v, o)).join('')}</section>`; };
const danhSach = (nhom, o = {}) => `<div class="lg">${nhom.map((n) => veNhom(n, o)).join('')}</div>`;
const hangTab = (cac, dang) => `<div class="tabs" role="tablist">${cac.map(([ten, so, doo]) => `<button class="tab" role="tab" aria-selected="${ten === dang}">${ten}${so ? ` <span class="bd${doo ? ' do' : ''}">${so}</span>` : ''}</button>`).join('')}</div>`;
const dem = (n, q) => `<span class="dem"><b>${n}</b> việc${q ? ` · <span class="qua"><b>${q}</b> quá hạn</span>` : ''}</span>`;
const dauTrang = (n, q, nut = '+ Task', phamVi = false) => `<div class="dau-trang"><h1>Công việc</h1>${dem(n, q)}${nut && !phamVi ? `<span class="phai"><span class="o-chon">Lọc thêm</span><button class="nut">${nut}</button></span>` : ''}</div>${phamVi ? `<div class="hang-pv"><div class="doan"><button class="on">Của tôi</button><button>Của GV</button><button>Tất cả</button></div><span class="o-chon">Lọc thêm</span><button class="nut">+ Giao việc</button></div>` : ''}`;
const thanhTren = (ten, av, menu, so, dang = 'Công việc') => `<div class="tt"><span class="logo"><b>PISA</b><span>TRACKING</span></span>${menu.map((m) => (m === dang ? `<span class="m dang">${m}${so && m === 'Công việc' ? ` <span class="so-nav">${so}</span>` : ''}</span>` : `<span class="m">${m}</span>`)).join('')}
  <span class="phai"><span class="tim-tt">${ic('tim')}Tìm học viên, lớp</span><span class="nut-tt">?</span><span class="nut-tt">${ic('chuong')}<i class="cham"></i></span><span class="ten-tt nw"><span class="av-tt">${av}</span>${ten}</span></span></div>`;
const ttDt = `<div class="tt"><span class="logo"><b>PISA</b><span>TRACKING</span></span><span class="nut-tt">${ic('tim')}</span><span class="nut-tt">${ic('chuong')}<i class="cham"></i></span><span class="nut-tt">${ic('menu')}</span></div>`;
const MENU = ['Tổng quan', 'Học viên &amp; Lớp', 'Test', 'Công việc'];
const ttGvcn = thanhTren('Trần Ngọc Hà', 'NH', MENU, 6);
const ttGv = thanhTren('Lê Minh Khoa', 'MK', MENU, 3);
const ttTvv = (dang) => thanhTren('Phan Mai', 'PM', ['Tổng quan', 'Học viên &amp; Lớp', 'Công việc'], 3, dang);
const ttBpxl = thanhTren('Lương Thu Trang', 'TT', ['Test', 'Học viên &amp; Lớp', 'Công việc'], 1);
const ttHead = (dang) => thanhTren('Nguyễn Khánh Vy', 'KV', [...MENU, 'Phân tích', 'Tutor'], 8, dang);
const gocPn = `<span class="goc"><button class="nut-i" aria-label="Giải thích">${ic('i')}</button><button class="vuong" aria-label="Thêm thao tác">${ic('ba')}</button><button class="vuong" aria-label="Đóng">${ic('x')}</button></span>`;
const dauPn = (ten, meta, dt) => `<div class="pn-dau">${dt ? `<button class="vuong quay" aria-label="Quay lại danh sách">${ic('lui')}</button>` : ''}<h2>${ten}</h2>${dt ? gocPn : ''}<div class="meta">${meta}</div>${dt ? '' : gocPn}</div>`;
const chanPn = (luu, nut) => `<div class="pn-chan">${luu}<span class="phai">${nut}</span></div>`;
const NUT_LUU = (dt, chinh = 'Lưu · việc tiếp ›') => `${dt ? '' : '<button class="nut">Lưu</button>'}<button class="nut nut-chinh">${chinh}</button>`;
const ntd = (t, x = true) => `<span class="ntd">${t}${x ? `<button aria-label="Bỏ ${t}">✕</button>` : ''}</span>`;
/* KHỐI VIỆC BASE (= web `KhoiGiaoViec` + `HanBam` #2211, như panel Vận hành): Phụ trách · Hạn (bấm ngày để sửa) · Theo dõi — một khối nền phụ đầu thân panel.
   pt: tên người phụ trách ('Bạn' = mình) · giao: 'mặc định' | '{tên} giao' · han: [dd/mm/yyyy, ''|'gan'|'qua'|'tam'] · td: người theo dõi · them: +n · doi: có nút Đổi */
const pht = (pt, td, { doi = true, them = 0, han, giao = 'mặc định', toi } = {}) => {
  const ban = pt === 'Bạn';
  return `<div class="kgv" role="group" aria-label="Phụ trách, hạn, theo dõi"><span class="cum"><span class="lb">Phụ trách</span>${doi ? `<button class="o-bam" aria-haspopup="dialog" aria-label="Đổi người phụ trách: ${ban ? toi ?? 'Bạn' : pt}"><b>${ban ? toi ?? 'Bạn' : pt}</b>${ban && toi ? '<span class="dim">bạn</span>' : ''}<span class="mui" aria-hidden="true">▾</span></button>` : `<span class="o-bam khoa"><b>${ban ? toi ?? 'Bạn' : pt}</b>${ban && toi ? '<span class="dim">bạn</span>' : ''}</span>`}<span class="the-giao${giao === 'mặc định' ? ' md' : ''}">${giao}</span></span>`
    + (han ? `<span class="cum"><span class="lb">Hạn</span>${han[1] === 'tam' ? `<span class="o-bam khoa tam">dừng · ${han[0]}</span>` : `<button class="o-bam han ${han[1] || ''}" aria-label="Sửa hạn ${han[0]}">${han[0]}</button>`}</span>` : '')
    + `<span class="cum rong"><span class="lb">Theo dõi</span><span class="gt">${td.length ? td.map((x) => ntd(x, false)).join('') : '<span class="dim">Chưa có</span>'}${them ? `<span class="dim">+${them} người</span>` : ''}<button class="them" aria-label="Thêm người theo dõi">+</button></span></span></div>`;
};
/* VIỆC CON (như Vận hành N59): một cấp, mỗi việc con có người + hạn; "+ Việc con" luôn có */
const viecCon = (ds = []) => `<section class="vcon" aria-label="Việc con"><h4>Việc con${ds.length ? ` <span class="dim">${ds.filter((x) => x[3]).length}/${ds.length}</span>` : ''}</h4>${ds.map(([ten, ng, han, xong]) => `<div class="vc-dong${xong ? ' xong' : ''}"><input type="checkbox" class="tick" aria-label="Xong: ${ten}"${xong ? ' checked' : ''}><span class="vc-ten">${ten}</span><span class="dim">${ng}</span>${xong ? `<span class="tb-ngay">${han}</span>` : `<button class="o-bam han nho ${Array.isArray(han) ? han[1] : ''}" aria-label="Sửa hạn">${Array.isArray(han) ? han[0] : han}</button>`}</div>`).join('')}<button class="nut nut-nho vc-them">+ Việc con</button></section>`;
/* Việc con đứng trước Lịch sử (thứ tự panel Vận hành: khối · nội dung · Việc con · Lịch sử) */
const datCon = (than, con) => { if (con === undefined) return than; const i = than.lastIndexOf('<details class="gap">'); return i < 0 ? than + viecCon(con) : than.slice(0, i) + viecCon(con) + than.slice(i); };
/* panel: khối việc base đầu thân; hạn chỉ ở khối (bỏ ngày ở đầu panel cho khỏi lặp) */
const panel = ({ ten, meta, dt, dai = '', ph = '', than, con, chan = '' }) => `<section class="pn" aria-label="${ten}">${dauPn(ten, ph ? meta.replace(/<span class="hn[^"]*">[^<]*<\/span>/, '') : meta, dt)}${dai}<div class="pn-than">${ph}${datCon(than, con)}</div>${chan}</section>`;
const lichSu = (n, tom) => `<details class="gap"><summary>${chev('')}<span class="ten-gap">Lịch sử</span><span class="tom"><span>${n} mục</span><span>${tom}</span></span></summary></details>`;
const hinh = (nhan, anh, than) => `<figure><figcaption>${nhan}</figcaption>${than.replace('data-web', `data-web data-anh="${anh}"`)}</figure>`;
/* màn 1440 có danh sách bên trái + panel 720 */
const man = ({ tt, dau, tabs, ds, pn = '', h = 900 }) => `<div class="man toi" data-web style="height:${h}px">${tt}<div class="noi-dung">${dau}<div class="cv${pn ? ' co-pn' : ''}"><div class="trai kA">${tabs}${ds}</div></div></div>${pn}</div>`;
const manDt = (than, cao = true) => `<div class="dt sang${cao ? ' cao' : ''}" data-web>${ttDt}${than}</div>`;

/* ================= KHỐI TUYẾN ================= */
const SVG = { xong: '<path d="M3.5 8.3l3 3 6-6.6"/>', bo: '<path d="M4.5 4.5l7 7M11.5 4.5l-7 7"/>', tam: '<path d="M6 4.5v7M10 4.5v7"/>' };
const TT_CHU = { xong: 'Xong', dang: 'Đang ở bước này', cho: 'Chưa tới lượt', bo: 'Đã bỏ', tam: 'Tạm dừng' };
const dauB = (tt) => `<span class="tb-dau" aria-hidden="true">${SVG[tt] ? `<svg viewBox="0 0 16 16" stroke="currentColor">${SVG[tt]}</svg>` : ''}</span>`;
const ngayB = (b) => { if (!b.ngay) return '<span class="tb-ngay"></span>'; const [t, m] = Array.isArray(b.ngay) ? b.ngay : [b.ngay, '']; return `<span class="tb-ngay ${m}">${/\d/.test(t) && !t.startsWith('chờ') ? t : `<span class="chu">${t}</span>`}</span>`; };
function buoc(b) {
  if (b.nhom) return `<li class="nhom"><span>${b.nhom}</span></li>`;
  if (b.lanTruoc) return `<li class="lan-truoc"><span>${b.lanTruoc}</span></li>`;
  if (b.xem) return `<li class="xem"><button type="button" aria-expanded="false">${b.xem}${chev('xo')}</button></li>`;
  const ng = b.ban ? '<span class="ban">Bạn</span>' : (b.ng ?? '');
  const mo = b.nd ? `<button class="tb-mo" aria-expanded="${!!b.mo}" aria-label="Nội dung: ${b.ten}">${chev('')}</button>` : `<span${b.khoa ? ' title="Không xem được nội dung" aria-label="Không xem được nội dung"' : ''}></span>`;
  let h = `<li class="tb ${b.tt}${b.con ? ' con' : ''}">${dauB(b.tt)}<span class="tb-ten"><span class="sr">${TT_CHU[b.tt]}: </span>${b.ten}</span><span class="tb-ct">${b.ct ?? ''}</span><span class="tb-ng">${ng}</span>${ngayB(b)}${mo}<span class="tb-phu2">${ng}${b.ct ? `${ng ? ' · ' : ''}${b.ct}` : ''}</span></li>`;
  if (b.nd && b.mo) h += `<li class="nd"><div class="nd-than">${b.nd}</div></li>`;
  return h;
}
/* gap: true = gập còn bước đang ở / tạm dừng + "Xem cả n bước"; tự gập khi > 4 bước trừ khi mo:true */
function tuyen({ ten, buoc: bs, gap, mo }) {
  const soBuoc = bs.filter((b) => b.tt).length; const xong = bs.filter((b) => b.tt === 'xong').length; const dang = bs.filter((b) => b.tt === 'dang').length;
  const gapLai = gap ?? (!mo && soBuoc > 4);
  /* gập: ẩn bước đã xong; GIỮ bước cha đã xong nếu còn bước con chưa xong (bước con không lơ lửng) */
  const conChuaXong = (i) => { for (let j = i + 1; j < bs.length && bs[j].con; j++) if (bs[j].tt !== 'xong') return true; return false; };
  const giu = bs.filter((b, i) => b.tt !== 'xong' || (!b.con && conChuaXong(i)));
  const giuGon = giu.filter((b, i) => !b.nhom || (giu[i + 1] && !giu[i + 1].nhom));   /* bỏ nhãn nhóm lẻ (cả nhóm đã gập) */
  const ds = gapLai ? [{ xem: `Xem ${bs.filter((b) => b.tt === 'xong' && !giu.includes(b)).length} bước đã xong` }, ...giuGon] : bs;
  const li = ds.map(buoc).join('').replace(/^<li class="/, '<li class="dau-ds ').replace(/<li class="([^"]*)"((?:(?!<li ).)*)$/s, '<li class="$1 cuoi-ds"$2');
  return `<section class="tn" aria-label="Tuyến · ${ten}"><div class="tn-dau"><h3>Tuyến</h3><span class="ten-tn">${ten}</span><span class="phai"><span class="tien">Xong <b>${xong}</b>/${soBuoc}${dang > 1 ? ` · đang <b>${dang}</b>` : ''}</span><button class="nut-i" aria-label="Tuyến công việc là gì">${ic('i')}</button></span></div><ol class="tn-ds">${li}</ol></section>`;
}
const cc = (s, o = '') => { const ten = { x: 'xong', d: 'đang ở', c: 'chưa tới lượt', t: 'tạm dừng', b: 'đã bỏ' }; const dem = {}; [...s].forEach((k) => { dem[k] = (dem[k] || 0) + 1; });
  return `<span class="cc" role="img" aria-label="${Object.entries(dem).map(([k, n]) => `${n} ${ten[k]}`).join(', ')}${o ? ` · đang ở ${o}` : ''}">${[...s].map((k) => `<i class="${k}"></i>`).join('')}</span>`; };
const formBaoPh = (dt, nd = '') => `<div class="truong"><span class="lb">Kết quả <span class="sao">*</span></span><div class="doan"><button class="on">Đã báo PH</button><button>Chưa liên hệ được</button></div></div>
    <div class="truong"><span class="lb">Ngày</span><span class="o" style="max-width:${dt ? '100%' : '220px'}">14/09/2026 ${ic('lich')}</span></div>
    <div class="truong"><span class="lb">Nội dung <span class="sao">*</span></span><span class="o lon go"><span>${nd}<span class="con"></span></span></span></div>`;
const bangEm = ({ dau, hang, mo, khay, dt }) => `<div class="bem" role="table" aria-label="Học viên"><div class="h dau" role="row">${dau.map((d) => `<span role="columnheader">${d}</span>`).join('')}</div>${hang.map((h, i) => `<div class="h${i === mo ? ' mo' : ''}" role="row">${h.map((c) => `<span role="cell">${c}</span>`).join('')}</div>${i === mo ? `<div class="khay">${khay}</div>` : ''}`).join('')}</div>`;
