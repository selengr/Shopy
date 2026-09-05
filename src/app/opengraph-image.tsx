import { ImageResponse } from "next/og";

export const alt = "Shopy";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          background: "linear-gradient(145deg, #f4efe6 0%, #e4ddd0 55%, #d7ebe6 100%)",
          padding: 72,
          color: "#14110e",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              background: "#1f4a45",
              color: "#f4efe6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
              fontWeight: 700,
            }}
          >
            ش
          </div>
          <div style={{ fontSize: 48, fontWeight: 700 }}>Shopy</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 56, fontWeight: 700, lineHeight: 1.2 }}>
            پنل فروشگاه کوچک
          </div>
          <div style={{ fontSize: 28, color: "#5c564d", maxWidth: 820 }}>
            ورود با موبایل، کاتالوگ، سفارش و فروشگاه عمومی
          </div>
        </div>
      </div>
    ),
    size,
  );
}
