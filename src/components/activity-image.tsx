import Image from "next/image";
import type { EditorialPhoto } from "@/lib/editorial-content";
export function EditorialImage({ photo, priority = false }: { photo: EditorialPhoto; priority?: boolean }) {
  return <Image className="ed-photo" src={photo.src} alt={photo.alt}
    style={{ objectPosition: photo.position }} width={photo.width} height={photo.height}
    sizes="(max-width: 960px) calc(100vw - 48px), (max-width: 1359px) calc(100vw - 420px), calc(100vw - 820px)"
    priority={priority} />;
}
