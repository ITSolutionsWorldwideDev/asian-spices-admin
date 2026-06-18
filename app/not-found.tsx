// app/not-found.tsx

export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
      <h1>404</h1>
      <p>Page not found.</p>
      <a href="/">Go back</a>
    </div>
  );
}