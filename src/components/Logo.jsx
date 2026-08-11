import { cn } from "@/lib/utils";

const LOGO_SRC = "/media/roof_ai_lead_recovery_logo_transparent.png";

export function Logo({ className, iconOnly = false }) {
  return (
    <div
      className={cn(
        "inline-flex items-center overflow-hidden",
        iconOnly ? "h-11 w-11" : "h-12 w-auto sm:h-14",
        className
      )}
    >
      <img
        src={LOGO_SRC}
        alt={iconOnly ? "Roof AI" : "Roof AI Lead Recovery"}
        className={cn(
          "block h-full max-w-none select-none object-cover",
          iconOnly ? "w-28 object-left" : "w-auto"
        )}
        draggable="false"
      />
    </div>
  );
}
