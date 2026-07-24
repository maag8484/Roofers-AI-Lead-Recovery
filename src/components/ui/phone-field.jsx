import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { Label } from "@/components/ui/label";

// International phone input: flag + searchable country dropdown + dial code +
// per-country auto-formatting. Value is E.164 (e.g. "+15551234567"); the
// selected ISO country is surfaced via onCountryChange for separate storage.
//
// The library ships unstyled inputs; the scoped overrides below make its number
// field match the app's <Input> (h-11, rounded-lg, brand focus ring).
export function PhoneField({
  label,
  value,
  onChange,
  onCountryChange,
  defaultCountry = "US",
  error,
  hint,
  id = "phone",
}) {
  return (
    <div className="space-y-1.5">
      {label && <Label htmlFor={id}>{label}</Label>}
      <div className="rai-phone">
        <PhoneInput
          id={id}
          value={value}
          onChange={(v) => onChange(v ?? "")}
          onCountryChange={onCountryChange}
          defaultCountry={defaultCountry}
          international
          countryCallingCodeEditable={false}
          placeholder="Enter phone number"
        />
      </div>
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}

      {/* Scoped styling so the library matches the app's inputs. */}
      <style>{`
        .rai-phone .PhoneInput {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .rai-phone .PhoneInputCountry {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          height: 2.75rem;
          padding: 0 0.625rem;
          border: 1px solid hsl(var(--border));
          border-radius: 0.5rem;
          background: #fff;
          box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
        }
        .rai-phone .PhoneInputCountryIcon {
          width: 1.35rem;
          height: 1rem;
          box-shadow: none;
        }
        .rai-phone .PhoneInputCountrySelectArrow {
          opacity: 0.5;
          margin-left: 0.1rem;
        }
        .rai-phone .PhoneInputInput {
          height: 2.75rem;
          width: 100%;
          border: 1px solid hsl(var(--input));
          border-radius: 0.5rem;
          background: #fff;
          padding: 0.5rem 0.875rem;
          font-size: 0.875rem;
          box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
          outline: none;
          transition: box-shadow 0.15s, border-color 0.15s;
        }
        .rai-phone .PhoneInputInput::placeholder {
          color: hsl(var(--muted-foreground));
        }
        .rai-phone .PhoneInputInput:focus,
        .rai-phone .PhoneInputCountrySelect:focus + .PhoneInputCountryIcon {
          border-color: hsl(var(--ring));
          box-shadow: 0 0 0 2px hsl(var(--ring) / 0.4);
        }
      `}</style>
    </div>
  );
}
