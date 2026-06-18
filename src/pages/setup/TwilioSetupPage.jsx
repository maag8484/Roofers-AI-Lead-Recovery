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

// Supported service cities and the area codes available in each.
const CITIES = [
  { id: "columbus-oh", label: "Columbus, OH", areaCodes: ["614", "380"] },
  { id: "dallas-tx", label: "Dallas, TX", areaCodes: ["214", "469", "972", "945"] },
  { id: "tampa-fl", label: "Tampa, FL", areaCodes: ["813", "656"] },
  { id: "charlotte-nc", label: "Charlotte, NC", areaCodes: ["704", "980"] },
];

const cityById = (id) => CITIES.find((c) => c.id === id);

export default function TwilioSetupPage() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();

  const [existing, setExisting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cityId, setCityId] = useState(CITIES[0].id);
  const [areaCode, setAreaCode] = useState(CITIES[0].areaCodes[0]);
  const [available, setAvailable] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);
  const [purchasing, setPurchasing] = useState(false);

  const areaCodes = cityById(cityId)?.areaCodes ?? [];

  // Picking a new city resets the area code to that city's first one
  // and clears any previous search results.
  const handleCityChange = (id) => {
    setCityId(id);
    setAreaCode((cityById(id)?.areaCodes ?? [])[0] ?? "");
    setAvailable([]);
    setSelected(null);
  };

  // Load any already-provisioned number.
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

  const searchNumbers = async () => {
    setSearching(true);
    setAvailable([]);
    setSelected(null);
    try {
      const res = await invokeFunction("twilio-search-numbers", { area_code: areaCode });
      setAvailable(res?.numbers ?? []);
      if (!res?.numbers?.length) toast.message("No numbers found for that area code.");
    } catch (err) {
      console.error(err);
      toast.error("Number search failed. Is the twilio-search-numbers function deployed?");
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
          This number receives missed calls, routes to the AI agent, and sends confirmations.
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
              This number is active and receiving calls. n8n handles the call logic automatically.
            </p>
            <Button className="w-full" onClick={goNext}>
              Next: Connect Calendar <ArrowRight />
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="space-y-5 p-6">
            <div className="space-y-1.5">
              <Label>Location (city)</Label>
              <Select value={cityId} onValueChange={handleCityChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose your city" />
                </SelectTrigger>
                <SelectContent>
                  {CITIES.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <div className="space-y-1.5">
                <Label>Area code</Label>
                <Select value={areaCode} onValueChange={setAreaCode} disabled={!areaCodes.length}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an area code" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {areaCodes.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="secondary" onClick={searchNumbers} disabled={searching || !areaCode}>
                {searching ? <Spinner /> : (<><Search className="h-4 w-4" /> Search</>)}
              </Button>
            </div>

            {available.length > 0 && (
              <div className="space-y-2">
                <Label>Available numbers</Label>
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
                      <span className="font-medium text-ink">{formatPhone(n.phone_number)}</span>
                      <span className="text-sm text-muted-foreground">
                        {n.locality || n.region || "US"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Button className="w-full" onClick={purchase} disabled={!selected || purchasing}>
              {purchasing ? <Spinner className="text-white" /> : "Confirm & Purchase ($1.00/month)"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Don't see a search result? Make sure the Twilio edge functions are deployed.
            </p>
          </CardContent>
        </Card>
      )}
    </SetupLayout>
  );
}
