import { db, tx } from '../db.ts';
import {
  MA_CHUONG_TRINH_MOI, MON_CHON, MON_GOP, MT_TOI_DA, PERMISSIONS, QUYEN_SUY_RA_GV, RATIO_PASS_THRESHOLD, ROUTES as BUILTIN_ROUTES, ROUTE_NAME, docLichMt,
  laChuongTrinhGoc, lichMtGoc, lyDoCamVai, nhanBaiThuong, programmeOf,
} from '../../../shared/domain/index.ts';
import { badRequest, notFound, nowIso } from '../util.ts';
import { clearScoringModeCache } from '../fasttrack/skillSchedule.ts';
import { require_, type Principal } from '../permissions.ts';
import { writeAudit } from './audit.ts';

/**
 * CẤU HÌNH HỆ THỐNG — mục 7.3: Quản trị hệ thống SỬA lộ trình và chương trình.
 *
 * LỘ TRÌNH FT không thêm mã mới (K1-48): lịch MT và kỳ vọng gắn với LT1 / LT2 / RF. CHƯƠNG TRÌNH thì thêm được từ OV-6b2 (bỏ K1-48 cho
 * chương trình): mã mới chấm đúng/tổng, môn chọn từ danh sách cố định, số tuần (Progress / Final) hoặc liên tục (Checkpoint mỗi n tuần) —
 * tên lớp `{CN} {MÃ} {số}`; luật riêng FOU / BE / ELE / FT không áp cho mã mới.
 *
 * ĐIỀU KHÔNG CHO PHÉP: XOÁ một lộ trình hay loại lớp đang có lớp/học viên dùng. Xoá nó thì
 * mọi lớp cũ mất chỗ tựa, và lịch sử đọc lại thành vô nghĩa. Thay vào đó là NGỪNG DÙNG:
 * biến mất khỏi các ô chọn khi tạo mới, nhưng lớp cũ vẫn đọc được.
 */

const KHONG_THEM_MA = 'Không thêm lộ trình mới ở đây — lịch MT và kỳ vọng đang gắn với LT1, LT2, RF.';
/** OV-6b1: lỗi 400 gắn đúng ô của panel sửa (`details.o`: ten · so-tuan · moc · nguong) — web hiện dưới ô, giữ chữ đã gõ. */
const loiO = (o: string, m: string) => badRequest(m, { o });

/* ------------------------------------------------------------------ lộ trình */

/** `includeInactive` = bản Quản trị: cả mã đã ngừng, kèm `inUse`. Bản chọn (`/ref/routes`) không có `inUse` (PR-Dọn, quét #10). */
export function listRoutes(includeInactive = false) {
  const conn = db();
  const rows = conn
    .prepare(`SELECT * FROM routes ${includeInactive ? '' : "WHERE status = 'active'"} ORDER BY seq, code`)
    .all() as any[];
  return rows.map((r) => ({
    code: r.code, name: r.name, note: r.note, seq: r.seq, status: r.status,
    /* OV-6b1: tuần học của từng MT — Quản trị sửa, chép vào lớp FT lúc tạo. */
    lichMt: docLichMt(r.lich_mt) ?? lichMtGoc(r.code),
    /* Đang có bao nhiêu lộ trình học viên dùng mã này — con số quyết định có ngừng được không. */
    ...(includeInactive ? {
      inUse: (conn.prepare('SELECT COUNT(*) n FROM learning_cycles WHERE route = ?').get(r.code) as any).n
        + (conn.prepare('SELECT COUNT(*) n FROM classes WHERE route = ?').get(r.code) as any).n,
      lopDangChay: (conn.prepare("SELECT COUNT(*) n FROM classes WHERE is_fast_track = 1 AND route = ? AND status = 'active'").get(r.code) as any).n,
    } : {}),
  }));
}

export function saveRoute(p: Principal, input: {
  code: string; name: string; note?: string | null; seq?: number; status?: string;
  /** OV-6b1: tuần học của MT1, MT2… (tăng dần, 1–104, tối đa MT8). Bỏ trống = giữ lịch đang có. */
  lichMt?: unknown;
}) {
  require_(p, PERMISSIONS.ADMIN_CONFIG, { anyScope: true }, 'Chỉ Quản trị hệ thống sửa được lộ trình.');
  const conn = db();
  const code = String(input.code ?? '').trim().toUpperCase();
  if (!/^[A-Z0-9-]{2,12}$/.test(code)) throw badRequest('Mã lộ trình dùng chữ in hoa, số và gạch ngang, 2–12 ký tự.');
  const name = String(input.name ?? '').trim();
  if (!name) throw loiO('ten', 'Đặt tên cho lộ trình.');
  const status = input.status === 'inactive' ? 'inactive' : 'active';

  const had = conn.prepare('SELECT * FROM routes WHERE code = ?').get(code) as any;
  if (!had) throw badRequest(KHONG_THEM_MA);
  const lichMt = input.lichMt === undefined ? had.lich_mt : JSON.stringify(kiemLichMt(input.lichMt));
  /* Ngừng dùng thì được; XOÁ thì không — xem chú thích đầu file. Tuần MT mới chỉ áp lớp FT mở sau (lớp đang chạy giữ `classes.lich_mt`). */
  conn.prepare('UPDATE routes SET name=?, note=?, seq=?, status=?, lich_mt=? WHERE code=?')
    .run(name, input.note ?? null, input.seq ?? had.seq, status, lichMt, code);
  writeAudit({
    actorUserId: p.userId, action: 'route_updated',
    entityType: 'routes', entityLabel: code, before: { lichMt: had.lich_mt }, after: { name, status, lichMt },
  });
  return { ok: true };
}

/** Tuần MT của lộ trình: 1–MT8 mốc, số nguyên 1–104, tăng dần. */
function kiemLichMt(v: unknown): number[] {
  if (!Array.isArray(v) || !v.length) throw loiO('moc', 'Cần ít nhất một Mock Test.');
  if (v.length > MT_TOI_DA) throw loiO('moc', `Tối đa MT${MT_TOI_DA}.`);
  const ds = v.map(Number);
  if (ds.some((w) => !Number.isInteger(w) || w < 1 || w > 104)) throw loiO('moc', 'Tuần học của Mock Test là số nguyên từ 1 đến 104.');
  if (ds.some((w, i) => i > 0 && w <= ds[i - 1])) throw loiO('moc', 'Tuần Mock Test phải tăng dần (MT sau ở tuần sau MT trước).');
  return ds;
}

/* ------------------------------------------------------------------ chương trình */

export function listProgrammes(p: Principal) {
  require_(p, PERMISSIONS.ADMIN_CONFIG, { anyScope: true }, 'Chỉ Quản trị hệ thống xem được cấu hình chương trình.');
  const conn = db();
  return (conn.prepare('SELECT * FROM programmes ORDER BY code').all() as any[]).map((r) => ({
    code: r.code, name: r.name, weeks: r.weeks, scoringMode: r.scoring_mode, status: r.status,
    skills: (conn.prepare('SELECT skill FROM programme_skills WHERE programme_code = ? ORDER BY seq')
      .all(r.code) as any[]).map((x) => x.skill),
    checkpoints: (conn.prepare('SELECT kind, study_week FROM programme_checkpoints WHERE programme_code = ? ORDER BY study_week')
      .all(r.code) as any[]).map((x) => ({ kind: x.kind, studyWeek: x.study_week })),
    /* OV-6b1: đạt từ (%) — chỉ chương trình đúng/tổng. */
    nguongDat: r.scoring_mode === 'ratio' ? Math.round((r.nguong_dat ?? RATIO_PASS_THRESHOLD) * 1000) / 10 : null,   // 0.725 → 72.5
    /* OV-6b2: liên tục — Checkpoint mỗi n tuần; `goc` = chương trình có sẵn trong mã (môn, cách chấm khoá); `coLop` = đã có lớp (môn khoá, mã không đổi). */
    lapMoiTuan: r.lap_moi_tuan ?? null, goc: laChuongTrinhGoc(r.code),
    coLop: !!conn.prepare('SELECT 1 FROM classes WHERE programme_code = ? LIMIT 1').get(r.code),
    /* Chỉ lớp ĐANG CHẠY — lớp đã kết thúc không còn chịu ảnh hưởng gì của cấu hình. */
    lopDangChay: (conn.prepare("SELECT COUNT(*) n FROM classes WHERE programme_code = ? AND status = 'active'").get(r.code) as any).n,
  }));
}

/**
 * SỬA CHƯƠNG TRÌNH — không thêm mã mới (K1-48).
 *
 * Hai thứ CỐ Ý KHOÁ với các chương trình gốc (FT, Pre FOU, FOU, BE, ELE):
 *
 *   cách chấm (`scoring_mode`) — đổi nó là đổi ý nghĩa của MỌI điểm đã nhập từ trước;
 *   bộ kỹ năng               — bỏ một kỹ năng là bỏ chỗ tựa của những ô điểm đã có.
 *
 * Tên, số tuần, hai mốc kiểm tra và "Đạt từ" (OV-6b1) thì sửa được: chỉ áp cho lớp tạo sau khi lưu — lớp đang học giữ bản chụp lúc tạo
 * (PF1: số tuần + mốc; OV-6b1: ngưỡng đạt). Lỗi gắn đúng ô (`details.o`), kiểm hết TRƯỚC khi ghi.
 */
export function saveProgramme(p: Principal, input: {
  code: string; name: string; weeks?: number | null;
  progressWeek?: number | null; finalWeek?: number | null;
  /** OV-6b1: đạt từ, phần trăm 1–100 (chỉ chương trình đúng/tổng). Bỏ trống = giữ. */
  nguongDat?: number | null;
  status?: string;
  /** OV-6b2: "+ Chương trình" — tạo mã mới (mã đã có → 400). Không có = sửa mã đã có. */
  taoMoi?: boolean;
  /** OV-6b2: môn (chọn từ `MON_CHON`) — chỉ chương trình mới, khi chưa có lớp nào. */
  skills?: unknown;
  /** OV-6b2: liên tục (`weeks` trống) — Checkpoint mỗi n tuần (1–52). */
  lapMoiTuan?: number | null;
}) {
  require_(p, PERMISSIONS.ADMIN_CONFIG, { anyScope: true }, 'Chỉ Quản trị hệ thống sửa được chương trình.');
  const conn = db();
  const code = String(input.code ?? '').trim().toUpperCase();
  if (input.taoMoi) {
    if (!MA_CHUONG_TRINH_MOI.test(code)) throw loiO('ma', 'Mã 2–6 ký tự: chữ in hoa và số, bắt đầu bằng chữ (vd PET).');
    if (programmeOf(code) !== code) throw loiO('ma', `${code} là mã cũ của ${programmeOf(code)} — chọn mã khác.`);   // OV-11b (QT-10f)
    if (conn.prepare('SELECT 1 FROM programmes WHERE code = ?').get(code)) throw loiO('ma', `Đã có chương trình ${code}.`);
    return taoChuongTrinh(p, code, input);
  }
  if (!/^[A-Z0-9-]{2,12}$/.test(code)) throw badRequest('Mã chương trình dùng chữ in hoa, số và gạch ngang, 2–12 ký tự.');
  const name = String(input.name ?? '').trim();
  if (!name) throw loiO('ten', 'Đặt tên cho chương trình.');

  const had = conn.prepare('SELECT * FROM programmes WHERE code = ?').get(code) as any;
  if (!had) throw badRequest('Không có chương trình này — thêm mới bằng "+ Chương trình".');
  /* OV-11b (QT-7, "Sửa sau khi lưu" 13/10): chương trình Quản trị tạo, chưa có lớp nào → sửa như lúc tạo (thêm / bỏ Progress, Số tuần ↔ Liên tục). */
  if (!laChuongTrinhGoc(code) && !conn.prepare('SELECT 1 FROM classes WHERE programme_code = ? LIMIT 1').get(code)) return taoChuongTrinh(p, code, input, had);
  /* Cách chấm không đổi sau khi tạo (đổi là đổi ý nghĩa mọi điểm đã nhập). Môn: chương trình gốc khoá; chương trình mới đổi được khi chưa có lớp. */
  const scoring = had.scoring_mode;
  const doiMon = !laChuongTrinhGoc(code) && input.skills !== undefined
    && !conn.prepare('SELECT 1 FROM classes WHERE programme_code = ? LIMIT 1').get(code) ? kiemMon(input.skills) : null;
  /* OV-6b2: liên tục giữ liên tục (không số tuần) — chỉ đổi "mỗi n tuần", áp lớp mở sau. */
  const lap = had.lap_moi_tuan == null ? null : input.lapMoiTuan === undefined ? had.lap_moi_tuan : kiemLap(input.lapMoiTuan);
  if (lap !== null) input = { ...input, weeks: null, progressWeek: null, finalWeek: null };
  const weeks = input.weeks === null || input.weeks === undefined ? null : Number(input.weeks);
  if (weeks !== null && (!Number.isInteger(weeks) || weeks < 1 || weeks > 104)) {
    throw loiO('so-tuan', 'Số tuần phải là số nguyên từ 1 đến 104, hoặc để trống nếu khoá không cố định.');
  }
  const status = input.status === 'inactive' ? 'inactive' : 'active';
  /* Tuần Cuối khoá bỏ trống = số tuần. Chương trình không có bài Giữa khoá (Pre FOU) không nhận tuần Giữa khoá;
     chương trình có thì bắt buộc — bỏ trống là xoá mất mốc mà màn này không thêm lại được. */
  const finalWeek = input.finalWeek || weeks;
  const progressWeek = input.progressWeek || null;
  const coGiuaKhoa = !!conn.prepare("SELECT 1 FROM programme_checkpoints WHERE programme_code = ? AND kind = 'progress'").get(code);
  if (progressWeek && !coGiuaKhoa) throw loiO('moc', 'Chương trình này không có bài Progress Test.');
  if (weeks !== null && coGiuaKhoa && !progressWeek) throw loiO('moc', 'Chọn tuần Progress Test.');
  /* Hai mốc kiểm tra chỉ có nghĩa với khoá có số tuần cố định. */
  if (weeks !== null && finalWeek) {
    for (const [kind, w] of [['progress', progressWeek], ['final', finalWeek]] as const) {
      if (!w) continue;
      const n = Number(w);
      if (!Number.isInteger(n) || n < 1 || n > weeks) throw loiO('moc', `Tuần ${nhanBaiThuong(kind)} phải nằm trong 1–${weeks}.`);
    }
  }
  if (progressWeek && finalWeek && Number(progressWeek) >= Number(finalWeek)) throw loiO('moc', 'Progress Test phải ở trước Final Test.');
  let nguong: number | null = had.nguong_dat ?? null;
  if (scoring === 'ratio' && input.nguongDat !== undefined && input.nguongDat !== null) {
    const pt = Number(input.nguongDat);
    if (!Number.isFinite(pt) || pt < 1 || pt > 100) throw loiO('nguong', 'Đạt từ là phần trăm từ 1 đến 100.');
    nguong = Math.round(pt * 100) / 10000;   // 72.5 % → 0.725, không lệch số lẻ dấu phẩy động
  }

  return tx(() => {
    /*
     * Cách chấm quyết định hạn chấm của từng môn, và câu trả lời đó được nhớ lại theo lớp
     * để danh sách không phải hỏi từng dòng. Sửa chương trình thì bỏ hết phần đã nhớ.
     */
    clearScoringModeCache();
    conn.prepare('UPDATE programmes SET name=?, weeks=?, scoring_mode=?, status=?, nguong_dat=?, lap_moi_tuan=? WHERE code=?')
      .run(name, weeks, scoring, status, nguong, lap, code);
    if (doiMon) ghiMon(conn, code, doiMon);

    if (weeks !== null && finalWeek) {
      conn.prepare('DELETE FROM programme_checkpoints WHERE programme_code = ?').run(code);
      if (progressWeek) {
        conn.prepare("INSERT INTO programme_checkpoints (programme_code, kind, study_week) VALUES (?, 'progress', ?)")
          .run(code, Number(progressWeek));
      }
      conn.prepare("INSERT INTO programme_checkpoints (programme_code, kind, study_week) VALUES (?, 'final', ?)")
        .run(code, Number(finalWeek));
    }

    writeAudit({
      actorUserId: p.userId, action: 'programme_updated',
      entityType: 'programmes', entityLabel: code, before: { nguongDat: had.nguong_dat, lapMoiTuan: had.lap_moi_tuan }, after: { name, weeks, scoring, status, nguongDat: nguong, lapMoiTuan: lap },
    });
    return { ok: true };
  });
}

/** OV-6b2: môn chọn từ danh sách cố định, không trùng, môn gộp không đi cùng môn nó đã gồm (L+S với L hoặc S). */
function kiemMon(v: unknown): string[] {
  if (!Array.isArray(v) || !v.length) throw loiO('mon', 'Chọn ít nhất một môn.');
  const ds = v.map(String);
  if (ds.some((k) => !(MON_CHON as readonly string[]).includes(k))) throw loiO('mon', 'Môn chỉ chọn trong L · R · W · S · L+S · R+W.');
  if (new Set(ds).size !== ds.length) throw loiO('mon', 'Môn bị trùng.');
  const gop = ds.find((k) => MON_GOP[k]?.some((x) => ds.includes(x)));
  if (gop) throw loiO('mon', `${gop === 'listening_speaking' ? 'L+S' : 'R+W'} đã gồm ${gop === 'listening_speaking' ? 'L và S' : 'R và W'} — bỏ môn lẻ.`);
  return ds;
}
function kiemLap(v: unknown): number {
  const n = Number(v);
  if (v === null || v === undefined || v === '' || !Number.isInteger(n) || n < 1 || n > 52) throw loiO('moc', 'Lặp mỗi 1–52 tuần.');
  return n;
}
function ghiMon(conn: any, code: string, mon: readonly string[]) {
  conn.prepare('DELETE FROM programme_skills WHERE programme_code = ?').run(code);
  mon.forEach((k, i) => conn.prepare('INSERT INTO programme_skills (programme_code, skill, seq) VALUES (?,?,?)').run(code, k, i));
}

/**
 * OV-6b2 — "+ CHƯƠNG TRÌNH": mã mới chấm Đúng / tổng ("Band IELTS" chỉ FT). Độ dài = số tuần (mốc Progress / Final cố định) hoặc liên tục
 * (Checkpoint mỗi n tuần). Kiểm hết trước khi ghi, lỗi gắn đúng ô (`details.o`). Áp cho lớp mở sau (bản chụp lúc tạo lớp).
 * OV-11b (QT-7): `had` = sửa chương trình mới chưa có lớp — cùng luật kiểm; môn / đạt từ / mỗi n tuần không gửi thì giữ.
 */
function taoChuongTrinh(p: Principal, code: string, input: Parameters<typeof saveProgramme>[1], had?: any) {
  const conn = db();
  const name = String(input.name ?? '').trim();
  if (!name) throw loiO('ten', 'Đặt tên cho chương trình.');
  const mon = had && input.skills === undefined
    ? (conn.prepare('SELECT skill FROM programme_skills WHERE programme_code = ? ORDER BY seq').all(code) as any[]).map((x) => x.skill as string)
    : kiemMon(input.skills);
  const nguongVao = had && (input.nguongDat === null || input.nguongDat === undefined)
    ? Math.round((had.nguong_dat ?? RATIO_PASS_THRESHOLD) * 1000) / 10 : input.nguongDat;
  const pt = Number(nguongVao);
  if (nguongVao === null || nguongVao === undefined || !Number.isFinite(pt) || pt < 1 || pt > 100) throw loiO('nguong', 'Đạt từ là phần trăm từ 1 đến 100.');
  const lienTuc = input.weeks === null || input.weeks === undefined;
  const lap = lienTuc ? kiemLap(had && input.lapMoiTuan === undefined ? had.lap_moi_tuan : input.lapMoiTuan) : null;
  let moc: [string, number][] = [];
  const weeks = lienTuc ? null : Number(input.weeks);
  if (weeks !== null) {
    if (!Number.isInteger(weeks) || weeks < 1 || weeks > 104) throw loiO('so-tuan', 'Số tuần phải là số nguyên từ 1 đến 104.');
    const fi = Number(input.finalWeek || weeks);
    const pr = input.progressWeek ? Number(input.progressWeek) : null;
    for (const [k, w] of [['progress', pr], ['final', fi]] as const) {
      if (w !== null && (!Number.isInteger(w) || w < 1 || w > weeks)) throw loiO('moc', `Tuần ${nhanBaiThuong(k)} phải nằm trong 1–${weeks}.`);
    }
    if (pr !== null && pr >= fi) throw loiO('moc', 'Progress Test phải ở trước Final Test.');
    moc = [...(pr !== null ? [['progress', pr] as [string, number]] : []), ['final', fi]];
  }
  const status = input.status === 'inactive' ? 'inactive' : 'active';
  return tx(() => {
    clearScoringModeCache();
    if (had) {
      conn.prepare('UPDATE programmes SET name=?, weeks=?, nguong_dat=?, lap_moi_tuan=?, status=? WHERE code=?')
        .run(name, weeks, Math.round(pt * 100) / 10000, lap, status, code);
      conn.prepare('DELETE FROM programme_checkpoints WHERE programme_code = ?').run(code);
    } else {
      conn.prepare(`INSERT INTO programmes (code, name, weeks, scoring_mode, nguong_dat, lap_moi_tuan, status, created_at) VALUES (?,?,?, 'ratio', ?,?,?,?)`)
        .run(code, name, weeks, Math.round(pt * 100) / 10000, lap, status, nowIso());
    }
    ghiMon(conn, code, mon);
    for (const [k, w] of moc) conn.prepare('INSERT INTO programme_checkpoints (programme_code, kind, study_week) VALUES (?,?,?)').run(code, k, w);
    writeAudit({ actorUserId: p.userId, action: had ? 'programme_updated' : 'programme_created', entityType: 'programmes', entityLabel: code,
      ...(had ? { before: { weeks: had.weeks, nguongDat: had.nguong_dat, lapMoiTuan: had.lap_moi_tuan } } : {}),
      after: { name, mon, weeks, lapMoiTuan: lap, nguongDat: pt, status } });
    return { ok: true };
  });
}

/**
 * Nạp bảng `routes` lần đầu từ danh sách viết cứng, nếu bảng còn trống.
 *
 * Gọi khi seed và khi nâng cấp, nên một database đã chạy vẫn có đủ LT1/LT2 sau khi cập nhật.
 * Bảng trống → nạp đủ LT1, LT2, RF.
 */
export function seedRoutes(conn: any) {
  const n = (conn.prepare('SELECT COUNT(*) n FROM routes').get() as any).n;
  if (n > 0) return 0;
  /* P7: KHAC nạp ở trạng thái ngừng (không mở lớp; không ghi `lich_mt` vì bảng cũ chưa có cột — `lichMtCua` trả [] cho KHAC), cùng dòng migrate `prSvLoTrinh` thêm cho DB cũ. */
  const ds = BUILTIN_ROUTES.filter((code) => code !== 'KHAC');
  ds.forEach((code, i) => {
    conn.prepare('INSERT INTO routes (code, name, note, seq, status, created_at) VALUES (?,?,?,?,?,?)')
      .run(code, ROUTE_NAME[code], null, i + 1, 'active', nowIso());
  });
  conn.prepare('INSERT INTO routes (code, name, note, seq, status, created_at) VALUES (?,?,?,?,?,?)')
    .run('KHAC', ROUTE_NAME.KHAC, 'Lộ trình "Khác" (Bước tiếp › Lộ trình mới) — không mở lớp, 0 MT', ds.length + 1, 'inactive', nowIso());
  return ds.length + 1;
}

/** Mã lộ trình đang dùng được — thay cho hằng số `ROUTES` ở những chỗ cần danh sách sống. */
export function activeRouteCodes(): string[] {
  const conn = db();
  const rows = conn.prepare("SELECT code FROM routes WHERE status = 'active' ORDER BY seq, code").all() as any[];
  return rows.length ? rows.map((r) => r.code) : [...BUILTIN_ROUTES];
}

// ==================================================================== quyền theo vai

/**
 * HAI QUYỀN KHÔNG GỠ ĐƯỢC KHỎI QUẢN TRỊ HỆ THỐNG.
 *
 * Bỏ tick `admin.config` của vai Quản trị hệ thống là tự khoá mình ra khỏi chính màn hình
 * đang đứng, và không còn đường nào vào lại ngoài sửa thẳng cơ sở dữ liệu. `student.view` là
 * điều kiện để còn nhìn thấy học viên — mất nó thì hệ thống vẫn chạy nhưng không ai vận hành
 * được nữa.
 */
const LOCKED: Record<string, string[]> = {
  system_admin: [PERMISSIONS.ADMIN_CONFIG, PERMISSIONS.STUDENT_VIEW],
};

/**
 * Bật/tắt MỘT ô trong bảng quyền theo vai.
 *
 * Cố ý làm từng ô một chứ không phải "lưu cả bảng": một lần lưu cả bảng là một lần có thể
 * ghi đè thay đổi của người khác mà không ai biết, và cũng khó ghi nhật ký cho tử tế.
 */
export function setRolePermission(p: Principal, input: {
  roleKey: string; permissionKey: string; granted: boolean;
}) {
  require_(p, PERMISSIONS.ADMIN_CONFIG, { anyScope: true },
    'Chỉ Quản trị hệ thống mới sửa được bảng quyền.');
  const conn = db();
  const role = conn.prepare('SELECT id, key, name_vi AS name FROM roles WHERE key = ?').get(input.roleKey) as any;
  if (!role) throw notFound(`Không có vai trò "${input.roleKey}".`);
  const perm = conn.prepare('SELECT id, key, name_vi AS name FROM permissions WHERE key = ?')
    .get(input.permissionKey) as any;
  if (!perm) throw notFound(`Không có quyền "${input.permissionKey}".`);

  if (!input.granted && (LOCKED[role.key] ?? []).includes(perm.key)) {
    throw badRequest(
      `Không gỡ được quyền "${perm.name}" khỏi vai ${role.name} — gỡ xong thì không còn ai vào được màn này.`,
    );
  }
  /* PR-QU (D): ô cấm bật — SCH-01 (`plan.week` cho Giáo viên) và quyền chỉ suy ra (`class.assign_subject`). Lý do hiện nguyên văn. */
  const cam = input.granted ? lyDoCamVai(role.key, perm.key) : null;
  if (cam) throw badRequest(`Không bật được "${perm.name}" cho vai ${role.name}. ${cam}`);

  return tx(() => {
    const had = !!conn
      .prepare('SELECT 1 FROM role_permissions WHERE role_id = ? AND permission_id = ?')
      .get(role.id, perm.id);
    if (had === input.granted) return { ok: true, changed: false };

    if (input.granted) {
      conn.prepare('INSERT INTO role_permissions (role_id, permission_id) VALUES (?,?)').run(role.id, perm.id);
    } else {
      conn.prepare('DELETE FROM role_permissions WHERE role_id = ? AND permission_id = ?').run(role.id, perm.id);
    }
    writeAudit({
      actorUserId: p.userId,
      action: input.granted ? 'role.permission.grant' : 'role.permission.revoke',
      entityType: 'role', entityId: role.id,
      entityLabel: `${role.name} · ${perm.name}`,
      /* Ghi cả hai đầu để tra lại được ai đổi cái gì, không chỉ trạng thái hiện tại. */
      before: had ? 'có' : 'không',
      /* PR-QU: kèm số tài khoản đang hoạt động đổi quyền theo ô này — tra lại được tầm ảnh hưởng của một lần bấm. */
      after: { trangThai: input.granted ? 'có' : 'không', soNguoiAnhHuong: soNguoiCuaVai(role.key) },
    });
    return { ok: true, changed: true };
  });
}

/**
 * UX-C7 (Q23): chế độ "Sửa quyền" gửi CHỈ các ô đã đổi, lưu MỘT lần. Kiểm hết khoá trước (sai một khoá → 400, không ghi ô nào), rồi ghi trong
 * MỘT giao dịch qua đúng đường một ô ở trên — mỗi ô một dòng nhật ký, luật khoá quyền Quản trị giữ nguyên (ném giữa chừng → cuộn lại cả lô).
 * Vẫn không ghi đè cả bảng: ô không gửi giữ nguyên, nên hai người sửa hai ô khác nhau không đè nhau.
 */
export function setRolePermissions(p: Principal, thayDoi: unknown) {
  require_(p, PERMISSIONS.ADMIN_CONFIG, { anyScope: true }, 'Chỉ Quản trị hệ thống mới sửa được bảng quyền.');
  if (!Array.isArray(thayDoi) || thayDoi.length === 0) throw badRequest('Chưa có ô nào thay đổi.');
  if (thayDoi.length > 200) throw badRequest('Tối đa 200 ô một lần lưu.');
  const conn = db();
  const vai = new Set((conn.prepare('SELECT key FROM roles').all() as { key: string }[]).map((r) => r.key));
  const quyen = new Set((conn.prepare('SELECT key FROM permissions').all() as { key: string }[]).map((r) => r.key));
  const ds = thayDoi.map((x: any, i) => {
    const roleKey = String(x?.roleKey ?? ''), permissionKey = String(x?.permissionKey ?? '');
    if (!vai.has(roleKey)) throw badRequest(`Ô ${i + 1}: không có vai trò "${roleKey}".`);
    if (!quyen.has(permissionKey)) throw badRequest(`Ô ${i + 1}: không có quyền "${permissionKey}".`);
    if (typeof x?.granted !== 'boolean') throw badRequest(`Ô ${i + 1}: thiếu bật/tắt.`);
    return { roleKey, permissionKey, granted: x.granted as boolean };
  });
  // ponytail: mỗi ô 3–4 câu SQL qua đường một ô (≤ 200 ô, chỉ Quản trị bấm Lưu); gom câu nếu bảng quyền lớn lên nhiều.
  return tx(() => ({ ok: true, changed: ds.filter((o) => setRolePermission(p, o).changed).length }));
}

/** PR-QU (D): số tài khoản đang hoạt động mang vai này (bất kỳ chi nhánh) — "Ảnh hưởng n tài khoản" ở hộp xác nhận. */
export function soNguoiCuaVai(roleKey: string): number {
  return (db().prepare(
    `SELECT COUNT(DISTINCT ur.user_id) n FROM user_roles ur JOIN roles r ON r.id = ur.role_id JOIN users u ON u.id = ur.user_id
      WHERE r.key = ? AND ur.status = 'active' AND u.status = 'active' AND u.deleted_at IS NULL`,
  ).get(roleKey) as any).n as number;
}

/** `GET /admin/roles/:key/permissions/:perm/impact` — trước khi bật/tắt một ô vai × quyền. */
export function anhHuongOVai(p: Principal, roleKey: string, permissionKey: string) {
  require_(p, PERMISSIONS.ADMIN_CONFIG, { anyScope: true }, 'Chỉ Quản trị hệ thống mới xem được phần này.');
  const conn = db();
  const role = conn.prepare('SELECT id, key FROM roles WHERE key = ?').get(roleKey) as any;
  if (!role) throw notFound(`Không có vai trò "${roleKey}".`);
  const perm = conn.prepare('SELECT id, key FROM permissions WHERE key = ?').get(permissionKey) as any;
  if (!perm) throw notFound(`Không có quyền "${permissionKey}".`);
  const dangCo = !!conn.prepare('SELECT 1 FROM role_permissions WHERE role_id = ? AND permission_id = ?').get(role.id, perm.id);
  return {
    soNguoiAnhHuong: soNguoiCuaVai(roleKey), dangCo,
    /** Lý do ô này bị khoá theo chiều sẽ bấm (gỡ khi đang có / bật khi chưa có), hoặc null. */
    khoa: dangCo
      ? ((LOCKED[roleKey] ?? []).includes(permissionKey) ? 'Gỡ xong thì không còn ai vào được màn Quản trị.' : null)
      : lyDoCamVai(roleKey, permissionKey),
  };
}

/** `GET /admin/permissions/matrix` — vai × quyền từ DB, kèm quyền suy ra cho cột GVCN (chỉ đọc) và lý do các ô bị khoá. */
export function maTranQuyen(p: Principal) {
  require_(p, PERMISSIONS.ADMIN_CONFIG, { anyScope: true }, 'Chỉ Quản trị hệ thống mới xem được ma trận quyền.');
  const conn = db();
  const vai = conn.prepare("SELECT key, name_vi AS ten FROM roles WHERE status = 'active' ORDER BY id").all() as { key: string; ten: string }[];
  const quyen = conn.prepare('SELECT key, name_vi AS ten FROM permissions ORDER BY id').all() as { key: string; ten: string }[];
  const co = conn.prepare(
    `SELECT r.key AS role_key, p.key AS perm_key FROM role_permissions rp JOIN roles r ON r.id = rp.role_id JOIN permissions p ON p.id = rp.permission_id`,
  ).all() as any[];
  const khoa: { vai: string; quyen: string; lyDo: string }[] = [];
  for (const v of vai) {
    for (const k of LOCKED[v.key] ?? []) khoa.push({ vai: v.key, quyen: k, lyDo: 'Không gỡ được: gỡ xong thì không còn ai vào được màn Quản trị.' });
    for (const q of quyen) { const l = lyDoCamVai(v.key, q.key); if (l) khoa.push({ vai: v.key, quyen: q.key, lyDo: l }); }
  }
  return {
    vai: vai.map((v) => ({ ...v, soNguoi: soNguoiCuaVai(v.key) })),
    quyen,
    co: Object.fromEntries(vai.map((v) => [v.key, co.filter((x) => x.role_key === v.key).map((x) => x.perm_key as string)])),
    suyRaGv: QUYEN_SUY_RA_GV,
    khoa,
  };
}
