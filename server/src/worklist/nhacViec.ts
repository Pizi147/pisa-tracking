/**
 * NHẮC (PR-Ra Q5) — Quản lý/Quản trị nhắc người phụ trách một dòng việc ở Hỗ trợ học viên.
 *
 * Không tin khoá/hạn gửi từ giao diện: tìm lại đúng dòng bằng cách dựng lại `myWork` của CHÍNH
 * người được nhắc rồi tra theo khoá — dữ liệu bịa hoặc đã đổi (việc đã xong, đã nhập điểm) thì
 * không còn khớp, và route trả 404 thay vì gửi một thông báo về một việc không còn tồn tại.
 *
 * PR-NV (NV-1): MỘT lõi `nhacViecNhieu` cho nút Nhắc một dòng và "Nhắc tất cả" — đọc "đã nhắc hôm nay" một câu, dựng
 * `myWork` MỘT lần mỗi người được nhắc (trong `trongBoNho`), ghi chuông + nhật ký bằng một câu nhiều dòng trong một `tx`,
 * và dừng trước khi Netlify cắt hàm (10 s): người chưa kịp xử lý → lỗi riêng 503, phần đã xử lý vẫn ghi.
 */
import { chenNhieuDong, db, tx } from '../db.ts';
import { demoToday } from '../demoConfig.ts';
import { HttpError, badRequest, forbidden, nowIso } from '../util.ts';
import { can, loadPrincipal, scopeFor, type Principal } from '../permissions.ts';
import { trongBoNho } from '../platform/nguCanhRequest.ts';
import { conLaiMs } from '../platform/hanGio.ts';
import { PERMISSIONS, TRAN_HANG_LOAT } from '../../../shared/domain/index.ts';
import { myWork, type WorkGroupKey } from './mywork.ts';

const THAN_BAO_TOI_DA = 200;
const catThanBao = (s: string): string => (s.length <= THAN_BAO_TOI_DA ? s : `${s.slice(0, THAN_BAO_TOI_DA - 1)}…`);
/** Còn ít hơn chừng này thì không dựng `myWork` của người kế (một người ~1–3 s trên Turso; `tx()` cần ≥ 2,5 s). */
const DUNG_KHI_CON_MS = 4_000;
/** Thẻ Mini Test tạo trước PR-NV mang khoá `mini_test:{id}`; `myWork` và thẻ mới dùng `minitest:{id}`. */
const khoaChuan = (k: string) => (k.startsWith('mini_test:') ? `minitest:${k.slice('mini_test:'.length)}` : k);
/**
 * NV-2: tiền tố khoá dòng `myWork` → nhóm của dòng, để chỉ dựng nhóm cần (`myWork(…, { chiNhom })`). Khoá mới ở `mywork.ts` mà quên thêm
 * vào đây thì chỉ chậm (tiền tố lạ → dựng đủ), không sai.
 */
const NHOM_CUA_TIEN_TO: Record<string, WorkGroupKey> = {
  score: 'score', week: 'missing_data', target: 'missing_data', 'lich-su': 'missing_data', moc: 'missing_data',
  action: 'ghi_ket_qua_pa', ban_giao: 'ban_giao', ban_giao_mon: 'ban_giao', support: 'no_plan',
  cause: 'cause', xnpa: 'xac_nhan_pa', baoph: 'phoi_hop', phoi_hop_sos: 'phoi_hop_sos', minitest: 'mini_test',
  owner: 'no_owner', khai_bac: 'khai_bac', yt_xu_ly: 'yt_xu_ly', yt_xem: 'yt_xem', yt_thuc_hien: 'yt_thuc_hien', ky_vong: 'ky_vong_dau_ra', thi_that: 'thi_that',
  mgmt: 'mgmt', chotft: 'chot_len_ft', xetlai: 'xet_lai_lo_trinh',   // PR-LCb: = Chốt lộ trình (khoá `class:` của "Chuyển tiếp lớp" đã bỏ)
};
/** Tập nhóm cho các khoá; có tiền tố lạ → undefined (dựng đủ). */
export function nhomCuaKhoa(keys: readonly string[]): Set<WorkGroupKey> | undefined {
  const out = new Set<WorkGroupKey>();
  for (const k of keys) {
    const g = Object.hasOwn(NHOM_CUA_TIEN_TO, k.split(':')[0]) ? NHOM_CUA_TIEN_TO[k.split(':')[0]] : undefined;
    if (!g) return undefined;
    out.add(g);
  }
  return out;
}

export type DongNhac = { tieuDe: string; than: string; duong: string | null };
export type ViecCanNhac = {
  /** id thẻ (Nhắc tất cả) | null (nút Nhắc một dòng). */
  the: number | null; key: string; ownerId: number;
  /**
   * Chỉ `nhacNhieu`: thẻ Báo QL KHÔNG có dòng `myWork` (Cuối khoá dời quá hạn, Mini Test chưa đạt). Nơi gọi đã kiểm phạm vi
   * thẻ; hàm này kiểm người nhận còn phụ trách và trả nội dung chuông, hoặc ném HttpError. Chỉ gọi khi thật sự phải gửi.
   */
  ngoaiMyWork?: () => DongNhac;
};
export type KetQuaNhac = {
  ok: { the: number | null; key: string; daNhacLuc: string; moi: boolean }[];
  loi: { the: number | null; key: string; loi: string; ma: number }[];
};

export function nhacViecNhieu(p: Principal, ds: readonly ViecCanNhac[], o: { boQuaDaNhacTruoc: boolean }): KetQuaNhac {
  if (!can(p, PERMISSIONS.CASE_APPROVE, { anyScope: true })) throw forbidden('Bạn chỉ xem được việc của mình.');
  const kq: KetQuaNhac = { ok: [], loi: [] };
  const loi = (v: ViecCanNhac, ma: number, chu: string) => kq.loi.push({ the: v.the, key: v.key, loi: chu, ma });
  /* Lỗi nghiệp vụ (HttpError) → lỗi riêng việc đó; lỗi lạ → ném cả lô (chưa ghi gì: ghi chỉ ở cuối, trong một `tx`). */
  const loiHttp = (v: ViecCanNhac, e: unknown) => { if (!(e instanceof HttpError)) throw e; loi(v, e.status, e.message); };
  /* Tự nhắc: chặn trước MỌI tra khoá (khoá bịa vẫn báo "chính mình", không 404). */
  const conLai: ViecCanNhac[] = [];
  for (const v of ds) {
    if (v.ownerId === p.userId) loi(v, 403, 'Không tự nhắc chính mình.');
    else conLai.push({ ...v, key: khoaChuan(v.key) });
  }
  if (!conLai.length) return kq;

  return trongBoNho(() => {
    const today = demoToday();
    const daNhac = new Map<string, string>();
    for (const r of db()
      .prepare(`SELECT user_id, dedup_key, created_at FROM notifications WHERE kind = 'nhac_viec' AND dedup_key LIKE ?`)
      .all(`nhac:%:${today}`) as any[]) daNhac.set(`${r.user_id}|${r.dedup_key}`, r.created_at);
    const khoaBao = (v: ViecCanNhac) => `nhac:${v.key}:${today}`;
    const nhacLuc = (v: ViecCanNhac) => daNhac.get(`${v.ownerId}|${khoaBao(v)}`);

    /* Thẻ (khoá + người lấy từ thẻ máy chủ đã kiểm phạm vi): đã nhắc hôm nay → xong ngay, không dựng `myWork`. */
    const theoNguoi = new Map<number, ViecCanNhac[]>();
    for (const v of conLai) {
      const luc = o.boQuaDaNhacTruoc ? nhacLuc(v) : undefined;
      if (luc) { kq.ok.push({ the: v.the, key: v.key, daNhacLuc: luc, moi: false }); continue; }
      theoNguoi.set(v.ownerId, [...(theoNguoi.get(v.ownerId) ?? []), v]);
    }

    const scope = scopeFor(p, PERMISSIONS.ATTEMPT_VIEW);
    const gui: (ViecCanNhac & DongNhac)[] = [];
    let hetGio = false;
    for (const [ownerId, cua] of theoNguoi) {
      const con = conLaiMs();
      if (hetGio || (con !== null && con < DUNG_KHI_CON_MS)) {
        hetGio = true;
        for (const v of cua) loi(v, 503, 'Chưa kịp nhắc — bấm lại.');
        continue;
      }
      let dong: Map<string, any> | null = null;
      let ten = '';
      let loiNguoi: unknown = null;
      if (cua.some((v) => !v.ngoaiMyWork)) {
        try {
          if (!scope.all) {
            /*
             * KIỂM NHANH (trước khi dựng `myWork`): người được nhắc phải làm việc ở MỘT chi nhánh
             * trong phạm vi — rẻ, tránh tải dữ liệu vô ích cho giáo viên rõ ràng ngoài phạm vi. CHƯA
             * đủ: giáo viên dạy nhiều chi nhánh thì qua được kiểm này dù DÒNG cụ thể lại thuộc chi
             * nhánh khác (VD: QL Monbay, giáo viên dạy cả Monbay lẫn Bãi Cháy, dòng là lớp Bãi Cháy) —
             * kiểm đúng DÒNG bằng `can(..., ATTEMPT_VIEW, { classId, studentId })` ngay dưới mới là
             * chốt chặn thật.
             */
            const branches = db()
              .prepare(`SELECT DISTINCT branch_id FROM user_roles WHERE user_id = ? AND status = 'active' AND branch_id IS NOT NULL`)
              .all(ownerId) as any[];
            if (!branches.some((b) => scope.branchIds.includes(b.branch_id))) {
              throw forbidden('Giáo viên này không thuộc chi nhánh bạn quản lý.');
            }
          }
          const target = loadPrincipal(ownerId);
          ten = target.fullName;
          const chiNhom = nhomCuaKhoa(cua.filter((v) => !v.ngoaiMyWork).map((v) => v.key));
          /* Người không còn phạm vi (gỡ vai): `myWork` không có `items` → mọi việc 404, không làm hỏng cả lô. */
          dong = new Map(((myWork(target, { chiNhom }) as any).items ?? []).map((it: any) => [it.key, it]));
        } catch (e) { loiNguoi = e; }
      }
      for (const v of cua) {
        let d: DongNhac;
        if (v.ngoaiMyWork) {
          try { d = v.ngoaiMyWork(); } catch (e) { loiHttp(v, e); continue; }
        } else {
          if (loiNguoi) { loiHttp(v, loiNguoi); continue; }
          const row = dong!.get(v.key);
          if (!row) { loi(v, 404, `Việc này không còn trong danh sách của ${ten}.`); continue; }
          if (!can(p, PERMISSIONS.ATTEMPT_VIEW, { classId: row.classId, studentId: row.studentId })) {
            loi(v, 403, 'Dòng này không thuộc phạm vi bạn quản lý.');
            continue;
          }
          d = {
            tieuDe: `${row.actionLabel}${row.studentName ? ` · ${row.studentName}` : ''} · ${p.fullName} nhắc`,
            than: [row.studentName, row.contextLabel, row.reason].filter(Boolean).join(' · '),
            /* PR-DUYET (K5-12): bấm chuông về đúng chỗ làm việc đó (hồ sơ HV / Ngăn Case), không phải trang Công việc chung. */
            duong: row.href ?? null,
          };
        }
        /* Nút một dòng (khoá do web gửi): kiểm dòng xong mới trả "đã nhắc" — không cho dò khoá ngoài phạm vi qua giờ đã nhắc. */
        const luc = nhacLuc(v);
        if (luc) { kq.ok.push({ the: v.the, key: v.key, daNhacLuc: luc, moi: false }); continue; }
        gui.push({ ...v, ...d });
      }
    }
    if (!gui.length) return kq;

    /* ponytail: hai QL nhắc cùng việc cùng giây → daNhacLuc trả về lệch vài ms so với dòng đã có; đọc lại bằng RETURNING nếu cần chính xác */
    const now = nowIso();
    /* Hai thẻ cùng (người, việc) → một chuông; thẻ sau `moi: false`. */
    const daGui = new Set<string>();
    const dau = gui.map((g) => { const k = `${g.ownerId}|${khoaBao(g)}`; const lan1 = !daGui.has(k); daGui.add(k); return lan1; });
    const moi = gui.filter((_, i) => dau[i]);
    try {
      tx(() => {
        chenNhieuDong(
          'INSERT INTO notifications (user_id, kind, title, body, entity_type, entity_id, dedup_key, created_at, duong)',
          moi.map((g) => [g.ownerId, 'nhac_viec', g.tieuDe, catThanBao(g.than), 'nhac_viec', null, khoaBao(g), now, g.duong]),
          ' ON CONFLICT(user_id, dedup_key) DO UPDATE SET title = excluded.title, body = excluded.body',
        );
        chenNhieuDong(
          'INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, entity_label, before_json, after_json, created_at)',
          moi.map((g) => [p.userId, 'work.remind', 'nhac_viec', null, g.key, null, null, now]),
        );
      });
    } catch (e) {
      for (const g of gui) loiHttp(g, e);   // `tx` từ chối khi sắp hết giờ / database bận → 503 từng việc, chưa ghi gì
      return kq;
    }
    gui.forEach((g, i) => kq.ok.push({ the: g.the, key: g.key, daNhacLuc: now, moi: dau[i] }));
    return kq;
  });
}

export function nhacViec(p: Principal, i: { key: string; ownerId: number }): { daNhacLuc: string } {
  const kq = nhacViecNhieu(p, [{ the: null, key: i.key, ownerId: i.ownerId }], { boQuaDaNhacTruoc: false });
  if (kq.loi.length) throw new HttpError(kq.loi[0].ma, kq.loi[0].loi);
  return { daNhacLuc: kq.ok[0].daNhacLuc };
}

/**
 * VIEC-NHO-2: "Nhắc tất cả (n)" ở Công việc › Của GV — lô (khoá, người) do web gửi, tối đa `TRAN_HANG_LOAT`. Quyền như Nhắc ở Chờ duyệt
 * (Quản lý/Quản trị duyệt yêu cầu); từng dòng vẫn qua lõi: tra lại `myWork` của người nhận, kiểm phạm vi DÒNG, đã nhắc hôm nay → không gửi
 * lại (`moi = false`). `boQuaDaNhacTruoc: false` vì khoá do web gửi: kiểm dòng xong mới trả giờ đã nhắc (không dò được khoá ngoài phạm vi).
 */
export function nhacViecLo(p: Principal, ds: unknown) {
  if (!can(p, PERMISSIONS.REQUEST_APPROVE, { anyScope: true })) throw forbidden('Chỉ Quản lý và Quản trị hệ thống nhắc được giáo viên.');
  if (!Array.isArray(ds) || !ds.length || ds.length > TRAN_HANG_LOAT) throw badRequest(`Chọn từ 1 đến ${TRAN_HANG_LOAT} việc để nhắc.`);
  const viec: ViecCanNhac[] = [];
  const da = new Set<string>();
  for (const x of ds) {
    const key = x?.key, ownerId = x?.ownerId;
    if (typeof key !== 'string' || !key || key.length > 200 || !Number.isInteger(ownerId) || ownerId <= 0) throw badRequest('Việc cần nhắc không hợp lệ.');
    if (da.has(`${ownerId}|${key}`)) continue;
    da.add(`${ownerId}|${key}`);
    viec.push({ the: viec.length, key, ownerId });
  }
  const kq = nhacViecNhieu(p, viec, { boQuaDaNhacTruoc: false });
  /* `the` = chỉ số trong lô → trả lại đúng (khoá web gửi, người); lõi đã chuẩn hoá khoá Mini Test cũ. */
  const goc = (i: number | null) => ({ key: viec[i!].key, ownerId: viec[i!].ownerId });
  return {
    ok: kq.ok.map((x) => ({ ...goc(x.the), daNhacLuc: x.daNhacLuc, moi: x.moi })),
    loi: kq.loi.map((x) => ({ ...goc(x.the), loi: x.loi, ma: x.ma })),
  };
}
