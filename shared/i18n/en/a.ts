import type { VI_A } from '../vi/a.ts';
import type { BangEn } from '../en.ts';

const soNhieu = (n: unknown, mot: string, nhieu: string) => `${n} ${Number(n) === 1 ? mot : nhieu}`;

export const EN_A: BangEn<typeof VI_A> = {
  'chung.luu': 'Save',
  'chung.quaHanNgay': (b) => `${soNhieu(b.n, 'day', 'days')} overdue`,

  'loi.coLoi': 'Error · code {ma}. Try again in a few minutes; if it persists, send this code to the system admin.',
  'loi.duLieuHong': 'The data sent could not be read. Reload the page and try again.',
  'loi.quaLon': 'The data sent is too large.',
  'loi.trung': 'Duplicate data or a rule was broken.',
  'loi.khongCoEndpoint': 'Endpoint not found.',
  'loi.matKetNoi': 'Cannot reach the server — check your network and try again.',
  'loi.ngonNguKhongHopLe': 'Invalid language.',
  'loi.toiDaKyTu': '{ten}: max {toiDa} characters (now {n}).',
  'loi.http': 'Error {status}',
  'loi.khongGoiDuocMayChu': 'Cannot reach the server.',
  'nn.ngonNgu': 'Language',
  'nn.hoiMatChu': 'You have unsaved changes — switching language reloads the page and loses them. Switch anyway?',
};
