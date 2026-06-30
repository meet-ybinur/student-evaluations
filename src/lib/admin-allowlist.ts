/* Who may access /admin. Configure via env:
   ADMIN_EMAILS        comma-separated allowed emails (default: ybinur@meet.mit.edu)
   ADMIN_EMAIL_DOMAIN  optional domain that is always allowed (e.g. meet.mit.edu) */
export function isAllowedAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const e = email.trim().toLowerCase();
  const list = (process.env.ADMIN_EMAILS || "ybinur@meet.mit.edu")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (list.includes(e)) return true;
  const domain = process.env.ADMIN_EMAIL_DOMAIN?.trim().toLowerCase();
  if (domain && e.endsWith(`@${domain}`)) return true;
  return false;
}
