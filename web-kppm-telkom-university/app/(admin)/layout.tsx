// Grup (admin) tidak punya layout tambahan — login dan dashboard punya layout masing-masing.
export default function AdminGroupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
