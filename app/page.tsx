export default function Page() {
  if (typeof window !== "undefined") {
    window.location.href = "/dashboard"
  }
  return null
}
