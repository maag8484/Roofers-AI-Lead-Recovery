import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, Search, Check, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { supabase, invokeFunction } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { SetupLayout } from "@/components/setup/SetupLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPhone } from "@/lib/utils";

const LOCATIONS = [
  { label: "Charlotte, NC",   codes: ["704", "980"] },
  { label: "Columbus, OH",    codes: ["614", "380"] },
  { label: "Dallas, TX",      codes: ["214", "469", "972", "945"] },
  { label: "Tampa, FL",       codes: ["813", "656"] },
];

export default function TwilioSetupPage() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();

  const [existing, setExisting] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selectedLocation, setSelectedLocation] = useState(null); // LOCATIONS entry
  const [selectedCode, setSelectedCode] = useState("");

  const [available, setAvailable] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);
  const [purchasing, setPurchasing] = useState(false);

  // Load any already-provisioned number
  useEffect(() => {
    if (!user) return;
    supabase
      .from("twilio_accounts")
      .select("phone_number, twilio_sid")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setExisting(data ?? null);
        setLoading(false);
      });
  }, [user]);

  const handleLocationChange = (label) => {
    const loc = LOCATIONS.find((l) => l.label === label);
    setSelectedLocation(loc ?? null);
    setSelectedCode("");
    setAvailable([]);
    setSelected(null);
  };

  const handleCodeSelect = (code) => {
    setSelectedCode(code);
    setAvailable([]);
    setSelected(null);
  };

  const searchNumbers = async () => {
    setSearching(true);
    setAvailable([]);
    setSelected(null);
    try {
      const res = await invokeFunction("twilio-search-numbers", { area_code: selectedCode });
      setAvailable(res?.numbers ?? []);
      if (!res?.numbers?.length) {
        toast.message("No numbers found for that area code — try another one.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Search failed. Make sure the Twilio edge functions are deployed.");
    } finally {
      setSearching(false);
    }
  };

  const purchase = async () => {
    if (!selected) return;
    setPurchasing(true);
    try {
      const res = await invokeFunction("twilio-purchase-number", {
        phone_number: selected.phone_number,
      });
      const number = res?.phone_number ?? selected.phone_number;
      setExisting({ phone_number: number, twilio_sid: res?.sid });
      await refreshProfile();
      toast.success("Number purchased!");
    } catch (err) {
      console.error(err);
      toast.error("Purchase failed. Check the twilio-purchase-number function.");
    } finally {
      setPurchasing(false);
    }
  };

  const goNext = async () => {
    if (user) {
      await supabase.from("roofing_companies").update({ setup_step: 4 }).eq("user_id", user.id);
      await refreshProfile();
    }
    navigate("/setup/calendar");
  };

  if (loading) {
    return (
      <SetupLayout current="twilio">
        <div className="flex justify-center py-20">
          <Spinner className="h-8 w-8" />
        </div>
      </SetupLayout>
    );
  }

  return (
    <SetupLayout current="twilio">
      <div className="mb-6 text-center">
        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50">
          <Phone className="h-6 w-6 text-brand-600" />
        </span>
        <h1 className="text-2xl font-extrabold text-ink">Get Your Business Phone Number</h1>
        <p className="mt-1.5 text-muted-foreground">
          This number receives missed calls, routes them to the AI agent, and sends confirmations.
        </p>
      </div>

      {existing ? (
        <Card className="border-emerald-200 bg-emerald-50/40">
          <CardContent className="space-y-4 p-6 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <Check className="h-6 w-6 text-emerald-600" />
            </span>
            <div>
              <p className="text-sm font-medium text-emerald-700">Your business number</p>
              <p className="text-2xl font-extrabold text-ink">
                {formatPhone(existing.phone_number)}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              This number is active and receiving calls. The AI handles calls automatically.
            </p>
            <Button className="w-full" onClick={goNext}>
              Next: Connect Calendar <ArrowRight />
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="space-y-6 p-6">

            {/* ── STEP 1: Pick a location ── */}
            <div className="space-y-1.5">
              <Label>1. Select your location</Label>
              <Select onValueChange={handleLocationChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose your city…" />
                </SelectTrigger>
                <SelectContent>
                  {LOCATIONS.map((loc) => (
                    <SelectItem key={loc.label} value={loc.label}>
                      {loc.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* ── STEP 2: Pick an area code ── */}
            {selectedLocation && (
              <div className="space-y-2">
                <Label>2. Select an area code</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedLocation.codes.map((code) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => handleCodeSelect(code)}
                      className={
                        "rounded-full border px-5 py-2 text-sm font-semibold transition-colors " +
                        (selectedCode === code
                          ? "border-brand-600 bg-brand-600 text-white"
                          : "border-border bg-white text-ink hover:bg-secondary")
                      }
                    >
                      {code}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── STEP 3: Search ── */}
            {selectedCode && (
              <Button
                variant="secondary"
                className="w-full"
                onClick={searchNumbers}
                disabled={searching}
              >
                {searching ? (
                  <Spinner />
                ) : (
                  <><Search className="h-4 w-4" /> Search Available Numbers for ({selectedCode})</>
                )}
              </Button>
            )}

            {/* ── STEP 4: Pick a number ── */}
            {available.length > 0 && (
              <div className="space-y-2">
                <Label>
                  3. Choose a number
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    — click one to select
                  </span>
                </Label>
                <div className="grid gap-2">
                  {available.map((n) => (
                    <button
                      key={n.phone_number}
                      onClick={() => setSelected(n)}
                      className={
                        "flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors " +
                        (selected?.phone_number === n.phone_number
                          ? "border-brand-600 bg-brand-50"
                          : "border-border hover:bg-secondary")
                      }
                    >
                      <span className="font-semibold text-ink">
                        {formatPhone(n.phone_number)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {n.locality ? `${n.locality}, ${n.region}` : (n.region || "US")}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── STEP 5: Purchase ── */}
            {selected && (
              <Button className="w-full" onClick={purchase} disabled={purchasing}>
                {purchasing ? (
                  <Spinner className="text-white" />
                ) : (
                  <>Purchase {formatPhone(selected.phone_number)}</>
                )}
              </Button>
            )}

            <p className="text-center text-xs text-muted-foreground">
              Your number will be provisioned instantly and is ready to use right away.
            </p>
          </CardContent>
        </Card>
      )}
    </SetupLayout>
  );
}
