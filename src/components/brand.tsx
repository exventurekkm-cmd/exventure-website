import Image from "next/image";

/** Supplied official artwork. Keep this component identical in the three apps. */

export function Brand({ label = "엑스벤처", tone = "light" }: { label?: string; tone?: "light" | "dark" }) {
  return (
    <span className="exv-brand" data-tone={tone}>
      <Image className="exv-logo exv-logo-default" src="/brand/exventure-logo.png" width={1558} height={280} alt="Exventure Inc. · 엑스벤처" loading="eager" unoptimized />
      <Image className="exv-logo exv-logo-reversed" src="/brand/exventure-logo-white.png" width={1558} height={280} alt="Exventure Inc. · 엑스벤처" loading="eager" unoptimized />
      {label !== "엑스벤처" && <small className="exv-brand-label">{label}</small>}
    </span>
  );
}
