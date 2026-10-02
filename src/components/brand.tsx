import Image from "next/image";

/** Approved orange ribbon X identity. Keep identical in the three apps. */

export function Brand({ label = "엑스벤처", tone = "light" }: { label?: string; tone?: "light" | "dark" }) {
  return (
    <span className="exv-brand" data-tone={tone}>
      <Image className="exv-logo exv-logo-default" src="/brand/exventure-orange-light.svg" width={441} height={121} alt="exventure · 엑스벤처" loading="eager" unoptimized />
      <Image className="exv-logo exv-logo-reversed" src="/brand/exventure-orange-dark.svg" width={441} height={121} alt="exventure · 엑스벤처" loading="eager" unoptimized />
      {label !== "엑스벤처" && <small className="exv-brand-label">{label}</small>}
    </span>
  );
}
