import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { resolveAvatarUrl } from "../../lib/media";
import { cn } from "../ui/utils";

type StudentAvatarProps = {
  /** Stored avatar path (e.g. /avatars/<UUID>.jpg). null/undefined → default avatar. */
  avatar?: string | null;
  /** Student name — used for the alt text and the initials fallback. */
  name: string;
  /** Extra classes for sizing (defaults to size-10). */
  className?: string;
};

// Shows a student's avatar, falling back to the shared default avatar
// (BASEURL/PREFIX/avatars/default.webp). If even that image fails to load, the
// gradient initials placeholder is shown so the slot is never empty.
export function StudentAvatar({ avatar, name, className }: StudentAvatarProps) {
  const initial = name?.trim().charAt(0).toUpperCase() || "?";
  return (
    <Avatar className={cn("size-10", className)}>
      <AvatarImage
        src={resolveAvatarUrl(avatar)}
        alt={name ? `${name}'s avatar` : "Profile photo"}
        className="object-cover"
      />
      <AvatarFallback className="bg-linear-to-br from-[#610981] to-[#ff691d] text-white font-semibold">
        {initial}
      </AvatarFallback>
    </Avatar>
  );
}
