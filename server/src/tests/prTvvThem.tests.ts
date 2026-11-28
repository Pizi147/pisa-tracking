/**
 * PHÉP KIỂM TVV-THEM (chủ SP 28/11): ô TVV khi thêm học viên — không bắt buộc; TVV thêm → mặc định chính mình (máy chủ, cả khi web không gửi);
 * vai khác → trống; TVV ngoài chi nhánh lớp → 400; cột chữ "TVV" dán từ Excel khớp tên → gán tài khoản. Em có TVV ngay khi tạo → việc TVV
 * về đúng TVV (không về Lead TVV / Head). Mỗi ca cuộn lại.
 */
export async function runPrTvvThemTests(t: any) {
  const { check, assert, conn, P, classId } = t;
  const { loadPrincipal } = await import('../permissions.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const intake: any = await import('../classes/intake.ts');
  const accounts: any = await import('../platform/accounts.ts');
  const { chuViecTvv } = await import('../worklist/viecTvv.ts');
  const { emailThu } = await import('../seed/emailThu.ts');
  console.log('\nTVV-THEM · ô TVV khi thêm học viên (chủ SP 28/11)');

  const thu = (fn: () => void) => { conn.exec('BEGIN IMMEDIATE'); try { xoaNho(); fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); } };
  const ma = (fn: () => unknown): number | null => { try { fn(); return null; } catch (e: any) { return e?.status ?? -1; } };
  const tvvCua = (sid: number) => (conn.prepare('SELECT consultant_user_id v FROM students WHERE id = ?').get(sid) as any).v as number | null;
  let seq = 0;
  const tao = (branch: string) => {
    seq += 1;
    return accounts.createAccount(P.admin, { email: `tvvthem.${seq}${accounts.EMAIL_SUFFIX}`, password: 'matkhau-tvvthem', fullName: `Thu TVVTHEM ${seq}`,
      roles: [{ role: 'consultant', branches: [branch] }] }).userId as number;
  };
  const LOP = classId('MB FT 101');
  const QL = P.mbManager;
  const them = (who: any, row: Record<string, unknown> = {}) => {
    const r = intake.commitIntake(who, { classId: LOP, rows: [{ fullName: `TVVTHEM Em ${++seq}`, email: emailThu(), dob: '2010-01-01', ...row }] });
    assert(r.added === 1, `thêm em: ${JSON.stringify(r.failed)}`);
    return r.studentIds[0] as number;
  };

  check('TVV-THEM-1 · TVV thêm, không gửi trường → TVV chính mình; việc TVV của em về TVV đó (không Lead / Head)', () => thu(() => {
    const idTvv = tao('MB');
    const TVV = loadPrincipal(idTvv)!;
    const pv = intake.previewIntake(TVV, { classId: LOP, rows: [{ fullName: 'A' }] });
    assert(pv.tvv.some((x: any) => x.id === idTvv) && pv.rows[0].consultantUserId === idTvv, `xem trước: ${JSON.stringify(pv.rows[0].consultantUserId)}`);
    const sid = them(TVV);
    assert(tvvCua(sid) === idTvv, `consultant_user_id = ${tvvCua(sid)}`);
    assert(chuViecTvv(TVV, sid, idTvv)?.mine === true, 'TVV phải giữ việc TVV của em');
    assert(chuViecTvv(QL, sid, idTvv, true)?.ownerId === idTvv, `QL "Tất cả" thấy việc của: ${JSON.stringify(chuViecTvv(QL, sid, idTvv, true))}`);
    /* TVV tự bỏ trống → trống. */
    assert(tvvCua(them(TVV, { consultantUserId: null })) === null, 'TVV chọn trống phải trống');
  }));

  check('TVV-THEM-2 · QL thêm không chọn → trống; chọn TVV chi nhánh lớp → gán; TVV chi nhánh khác → 400; id lạ → 400', () => thu(() => {
    const idTvv = tao('MB');
    const idTvvCp = tao('CP');
    assert(tvvCua(them(QL)) === null, 'QL không chọn phải trống');
    assert(tvvCua(them(QL, { consultantUserId: idTvv })) === idTvv, 'QL chọn TVV MB phải gán');
    assert(tvvCua(them(QL, { consultantUserId: String(idTvv) })) === idTvv, 'id dạng chữ (lưới) phải gán');
    assert(ma(() => them(QL, { consultantUserId: idTvvCp })) === 400, 'TVV chi nhánh khác phải 400');
    assert(ma(() => them(QL, { consultantUserId: QL.userId })) === 400, 'tài khoản không phải TVV phải 400');
    assert(ma(() => them(QL, { consultantUserId: 'abc' })) === 400, 'id lạ phải 400');
  }));

  check('TVV-THEM-3 · cột chữ "TVV" (dán Excel) khớp tên TVV chi nhánh lớp → gán; không khớp → lưu ý, trống', () => thu(() => {
    const idTvv = tao('MB');
    const ten = (conn.prepare('SELECT full_name n FROM users WHERE id = ?').get(idTvv) as any).n as string;
    const sid = them(QL, { consultant: ten.toUpperCase() });
    assert(tvvCua(sid) === idTvv, `khớp tên: ${tvvCua(sid)}`);
    const pv = intake.previewIntake(QL, { classId: LOP, rows: [{ fullName: 'B', consultant: 'Không Ai Tên Này' }] });
    assert(pv.rows[0].consultantUserId === null && pv.rows[0].issues.some((i: any) => i.field === 'consultantUserId' && i.muc === 'luu_y'), JSON.stringify(pv.rows[0].issues));
  }));
}
