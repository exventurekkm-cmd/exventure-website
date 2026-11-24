import Image from "next/image";

export function Brand({ tone = "light" }: { tone?: "light" | "dark" }) {
  return <Image src={"/brand/exventure-orange-" + tone + ".svg"} alt="EXVENTURE" width={183} height={50} unoptimized />;
}
