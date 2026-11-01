/**
 * TL-TQ (TRANG-LON, plan 2026-10-31-trang-lon.md) — `/tong-quan/v5`: bảng chi nhánh + Đạt MT / KQ MT dùng chung dữ liệu nạp, KHÔNG đổi con số.
 * Gốc = `chupHoacSo` (soGoc.ts): chụp trên origin/main, so trên nhánh.
 */
type Ctx = { check: (ten: string, fn: () => void) => void; assert: (ok: unknown, msg?: string) => void; P: any; TODAY: string };

export async function runPrTlTqTests({ check, assert, P }: Ctx) {
  const { db } = await import('../db.ts');
  const { chayTrongRequest } = await import('../platform/nguCanhRequest.ts');
  const { COT_BANG, khoangMacDinh } = await import('../../../shared/domain/index.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { demoToday } = await import('../demoConfig.ts');
  const { tongQuanV5 } = await import('../worklist/tongQuanV5.ts');
  const { bangChiNhanh, oBangChiNhanh } = await import('../worklist/bangChiNhanh.ts');
  const { LISTED_METRICS, metricSet } = await import('../worklist/metrics.ts');
  const { baoCao, ketQuaMt, tapDatMt } = await import('../phanTich/baoCao.ts');
  const { chupHoacSo } = await import('./soGoc.ts');

  const cx = (db().prepare(`SELECT ur.user_id AS id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = 'cx' ORDER BY ur.user_id LIMIT 1`).get() as any).id as number;
  const VAI: Array<[string, any]> = [['QL', P.mbManager], ['QT', P.admin], ['CX', loadPrincipal(cx)]];
  const chiNhanh = (db().prepare('SELECT id FROM branches ORDER BY id').all() as any[]).map((b) => b.id as number);
  const mb = P.mbManager.branchIds?.[0] ?? (db().prepare(`SELECT branch_id AS b FROM classes WHERE code = 'MB FT 101'`).get() as any).b as number;
  const KHOANG = { tu: '2026-07-06', den: '2026-09-20' };

  const ser = (v: unknown) => JSON.parse(JSON.stringify(v, (_k, x) => (x instanceof Map ? { __map: [...x] } : x instanceof Set ? { __set: [...x] } : x)) ?? 'null');
  /** Mỗi khoá một request GET (như thật); lỗi quyền ghi mã trạng thái. */
  const mot = (fn: () => unknown) => {
    try { return ser(chayTrongRequest('GET', fn)); } catch (e: any) { return String(e?.status ?? e?.message); }
  };

  check('TQ · giống hệt bản chụp', () => {
    chupHoacSo('tl-tq', () => {
      const out: Record<string, unknown> = {};
      const ky0 = khoangMacDinh(demoToday());
      for (const [, p] of VAI) {
        for (const ct of ['ft', 'thuong'] as const) {
          for (const branchId of [null, ...chiNhanh]) {
            for (const ky of [null, KHOANG]) {
              const k = ky ?? ky0;
              const loc = { branchId, ct, classId: null, tu: k.tu, den: k.den };
              const hau = `${p.userId}:${ct}:${branchId ?? '-'}:${ky ? 'khoang' : 'mac-dinh'}`;
              out[`tq:${hau}:0`] = mot(() => tongQuanV5(p, { branchId, ct, ky }));
              out[`tq:${hau}:1`] = mot(() => ({ tq: tongQuanV5(p, { branchId, ct, ky }), baoCao: baoCao(p, loc) }));
              out[`dat:${hau}`] = mot(() => tapDatMt(p, loc));
              out[`kq:${hau}`] = mot(() => ketQuaMt(p, loc));
            }
            out[`bang:${p.userId}:${ct}:${branchId ?? '-'}`] = mot(() => bangChiNhanh(p, { branchId, ct }));
          }
        }
      }
      /* Mọi ô có số của bảng QL MB — ô số = số dòng panel. */
      const p = P.mbManager;
      for (const ct of ['ft', 'thuong'] as const) {
        for (const chuY of [false, true]) {
          const b = chayTrongRequest('GET', () => bangChiNhanh(p, { branchId: mb, ct, chuY }));
          const hang = [...b.hang.flatMap((h) => [h, ...(h.lop ?? [])]), ...(b.conLai ? [b.conLai] : [])];
          for (const cot of COT_BANG) {
            for (const [khoa, o] of [['tong', b.tong[cot]], ...hang.map((h) => [h.khoa, h.o[cot]] as const)] as const) {
              if (o.n) out[`o:${p.userId}:${ct}:${chuY ? 1 : 0}:${cot}:${khoa}`] = mot(() => oBangChiNhanh(p, { branchId: mb, ct, cot, khoa, chuY }));
            }
          }
        }
      }
      for (const [, q] of VAI.slice(0, 2)) {
        for (const id of LISTED_METRICS) {
          for (const program of [null, 'ft', 'thuong'] as const) {
            out[`metric:${q.userId}:${id}:${program ?? '-'}`] = mot(() => {
              const { metric, ...r } = metricSet(q, id, { program });
              return r;
            });
          }
        }
      }
      return out;
    });
    assert(true);
  });
}
