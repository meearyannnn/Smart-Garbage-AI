const API_BASE = "http://127.0.0.1:8000";

export async function runDetection(
  image: File,
  mode: "single" | "pile"
) {
  const backendMode = mode === "single" ? "yolo_cnn" : "dual_yolo";

  const formData = new FormData();
  formData.append("file", image);
  formData.append("mode", backendMode);

  const res = await fetch(`${API_BASE}/detect`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Detection failed");
  }

  return res.json();
}
