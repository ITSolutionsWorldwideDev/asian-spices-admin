// apps/admin/app/_not-found/page.tsx
export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        fontFamily: "sans-serif",
      }}
    >
      <h1 style={{ fontSize: "48px", marginBottom: "12px" }}>404</h1>
      <p style={{ fontSize: "18px", color: "#666" }}>
        The page you are looking for does not exist.
      </p>
      <a
        href="/dashboard"
        style={{
          marginTop: "20px",
          color: "#2563eb",
          textDecoration: "underline",
        }}
      >
        Go back to Dashboard
      </a>
    </div>
  );
}
