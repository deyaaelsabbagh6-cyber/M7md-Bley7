import { requireRole } from './role'
// تحقق من السيرفر أن المستخدم مالك — يُستدعى في كل صفحة وكل action
export async function requireOwner() { return requireRole('owner') }
