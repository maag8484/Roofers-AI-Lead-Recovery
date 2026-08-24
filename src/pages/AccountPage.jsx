import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import {
  ArrowLeft,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Wrench,
  Clock,
  LifeBuoy,
  Activity,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Pencil,
  X,
  Save,
  Users,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { pickActiveSubscription } from "@/lib/subscription";
import { Logo } from "@/components/Logo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  PHONE_PROVIDER_GROUPS,
  PHONE_PROVIDER_OTHER,
} from "@/config/phoneProviders";
import { PhoneField } from "@/components/ui/phone-field";
import { AccountMenu } from "@/components/AccountMenu";
import { formatPhone, formatDateTime, cn } from "@/lib/utils";
import { isValidPhoneNumber } from "react-phone-number-input";

const CONVERSION_OPTIONS = [
  { value: "scheduled_appointment", label: "Schedule appointment", hint: "Requires a scheduling link." },
  { value: "warm_transfer", label: "Warm transfer", hint: "Requires a transfer number." },
  { value: "take_message", label: "Take a message", hint: "We capture details and email them." },
];
const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

const parseEmailList = (raw) =>
  (raw || "")
    .split(/[,;\n]/)
    .map((e) => e.trim())
    .filter(Boolean);

const serializeEmployees = (rows) =>
  (rows || [])
    .map((r) => ({
      name: (r?.name || "").trim(),
      transfer_line: (r?.transfer_line || "").trim(),
      email: (r?.email || "").trim(),
    }))
    .filter((r) => r.name || r.transfer_line || r.email);

const CONVERSION_LABEL = {
  scheduled_appointment: "Scheduled appointment",
  warm_transfer: "Warm transfer",
  take_message: "Take a message",
};

const SUB_LABEL = {
  active: "Active",
  trialing: "Trial",
  canceled: "Canceled",
  incomplete: "Incomplete",
  past_due: "Past due",
};

export default function AccountPage() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    formState: { errors },
  } = useForm({ mode: "onTouched" });

  register("business_phone", {
    validate: (v) => !v ? "Required" : isValidPhoneNumber(v) || "Enter a valid phone number",
  });
  register("phone_country");

  const conversion = watch("conversion_preference");
  const phoneProvider = watch("phone_provider");

  const {
    fields: employeeFields,
    append: appendEmployee,
    remove: removeEmployee,
  } = useFieldArray({ control, name: "employees" });

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase
        .from("subscriptions")
        .select("status, trial_ends_at, current_period_end, stripe_customer_id, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("status_history")
        .select("from_status, to_status, note, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(8),
    ]).then(([sub, hist]) => {
      setSubscription(pickActiveSubscription(sub.data));
      setHistory(hist.data ?? []);
      setLoading(false);
    });
  }, [user]);

  const openEdit = () => {
    reset({
      company_name: profile?.company_name || "",
      address: profile?.address || "",
      business_phone: profile?.business_phone || "",
      phone_country: profile?.phone_country || "US",
      phone_provider: profile?.phone_provider || "",
      phone_provider_other: profile?.phone_provider_other || "",
      contact_name: profile?.contact_name || "",
      contact_email: profile?.contact_email || "",
      service_areas: profile?.service_areas || "",
      services: profile?.services || "",
      conversion_preference: profile?.conversion_preference || "scheduled_appointment",
      calendly_link: profile?.calendly_link || "",
      transfer_number: profile?.transfer_number || "",
      employees:
        Array.isArray(profile?.employees) && profile.employees.length
          ? profile.employees.map((e) => ({
              name: e?.name ?? "",
              transfer_line: e?.transfer_line ?? "",
              email: e?.email ?? "",
            }))
          : [{ name: "", transfer_line: "", email: "" }],
      summary_emails: Array.isArray(profile?.summary_emails)
        ? profile.summary_emails.join(", ")
        : profile?.summary_emails || "",
      business_hours: profile?.business_hours || "",
      after_hours_preference: profile?.after_hours_preference || "",
    });
    setEditing(true);
  };

  const onSave = async (values) => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("roofing_companies").upsert(
      {
        user_id: user.id,
        company_name: values.company_name,
        address: values.address,
        business_phone: values.business_phone,
        phone_country: values.phone_country || null,
        phone_provider: values.phone_provider || null,
        phone_provider_other:
          values.phone_provider === PHONE_PROVIDER_OTHER ? values.phone_provider_other || null : null,
        contact_name: values.contact_name,
        contact_email: values.contact_email,
        service_areas: values.service_areas,
        services: values.services,
        conversion_preference: values.conversion_preference,
        calendly_link: values.conversion_preference === "scheduled_appointment" ? values.calendly_link || null : null,
        transfer_number: values.conversion_preference === "warm_transfer" ? values.transfer_number || null : null,
        employees: serializeEmployees(values.employees),
        summary_emails: parseEmailList(values.summary_emails),
        business_hours: values.business_hours,
        after_hours_preference: values.after_hours_preference,
      },
      { onConflict: "user_id" }
    );
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refreshProfile();
    setEditing(false);
    toast.success("Business details updated!");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const fullName = user?.user_metadata?.full_name || profile?.contact_name || "—";
  const status = profile?.status ?? "new";
  const paid = ["active", "trialing"].includes(subscription?.status);
  const trialing = subscription?.status === "trialing";

  // Onboarding progress from the real lifecycle.
  const progressSteps = [
    { label: "Account created", done: true },
    { label: "Payment completed", done: paid },
    { label: "Business information submitted", done: !!profile?.details_submitted },
    { label: "Configuration in progress", done: status === "live", active: status === "in_progress" },
    { label: "AI activated", done: status === "live" },
  ];
  const completed = progressSteps.filter((s) => s.done).length;
  const pct = Math.round((completed / progressSteps.length) * 100);

  const renewal = subscription?.current_period_end
    ? formatDateTime(subscription.current_period_end)
    : trialing && subscription?.trial_ends_at
    ? formatDateTime(subscription.trial_ends_at)
    : "—";

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="sticky top-0 z-30 border-b border-border bg-white">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              to="/dashboard"
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-ink"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <Link to="/" aria-label="Roof AI Lead Recovery home">
              <Logo />
            </Link>
          </div>
          <AccountMenu />
        </div>
      </header>

      <main className="container max-w-4xl space-y-6 py-8">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Account Overview</h1>
          <p className="text-muted-foreground">Everything about your account in one place.</p>
        </div>

        {/* Onboarding progress */}
        <Card>
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold text-ink">Onboarding Status</h2>
              <span className="text-sm font-semibold text-brand-600">{pct}% complete</span>
            </div>
            <div className="mb-5 h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-brand-600 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <ul className="space-y-2.5">
              {progressSteps.map((s) => (
                <li key={s.label} className="flex items-center gap-3 text-sm">
                  {s.done ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : s.active ? (
                    <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
                  ) : (
                    <span className="h-5 w-5 rounded-full border-2 border-border" />
                  )}
                  <span className={s.done ? "text-ink" : s.active ? "font-medium text-brand-700" : "text-muted-foreground"}>
                    {s.label}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Account Information */}
          <Section title="Account Information" icon={User}>
            <Row icon={User} label="Name" value={fullName} />
            <Row icon={Mail} label="Email" value={user?.email} />
            <Row icon={Building2} label="Company" value={profile?.company_name} />
            <Row icon={Phone} label="Business phone" value={formatPhone(profile?.business_phone)} />
            {profile?.phone_country && (
              <Row icon={MapPin} label="Country" value={profile.phone_country} />
            )}
            <Row icon={MapPin} label="Address" value={profile?.address} />
            {subscription?.created_at && (
              <Row icon={Clock} label="Created" value={formatDateTime(subscription.created_at)} />
            )}
          </Section>

          {/* Subscription */}
          <Section title="Subscription" icon={CreditCard}>
            <Row icon={CreditCard} label="Plan" value="Roof AI Lead Recovery · $299/mo" />
            <Row
              icon={Activity}
              label="Status"
              value={
                <Badge variant={paid ? "success" : "muted"}>
                  {SUB_LABEL[subscription?.status] ?? subscription?.status ?? "No plan"}
                </Badge>
              }
            />
            {trialing && (
              <Row
                icon={Clock}
                label="Trial ends"
                value={formatDateTime(subscription?.trial_ends_at)}
              />
            )}
            <Row icon={Clock} label="Renewal" value={renewal} />
            <div className="pt-1">
              <Button variant="secondary" size="sm" asChild>
                <Link to="/billing">
                  Manage subscription <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </Section>

          {/* Business Details */}
          <Card className="md:col-span-2">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50">
                    <Wrench className="h-4 w-4 text-brand-600" />
                  </span>
                  <h2 className="font-bold text-ink">Business Details</h2>
                </div>
                {!editing && (
                  <Button variant="secondary" size="sm" onClick={openEdit}>
                    <Pencil className="h-4 w-4" /> Edit
                  </Button>
                )}
              </div>

              {editing ? (
                <form onSubmit={handleSubmit(onSave)} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <EditField label="Business name" name="company_name" register={register} rules={{ required: "Required" }} error={errors.company_name} />
                    <EditField label="Address" name="address" register={register} rules={{ required: "Required" }} error={errors.address} />
                  </div>
                  <PhoneField
                    label="Business phone"
                    id="business_phone"
                    value={watch("business_phone") || ""}
                    onChange={(v) => setValue("business_phone", v, { shouldValidate: true, shouldDirty: true })}
                    onCountryChange={(c) => setValue("phone_country", c || null)}
                    defaultCountry={watch("phone_country") || "US"}
                    error={errors.business_phone?.message}
                  />
                  <div className="space-y-1.5">
                    <Label htmlFor="phone_provider">Phone provider</Label>
                    <Select
                      value={phoneProvider || ""}
                      onValueChange={(v) =>
                        setValue("phone_provider", v, { shouldValidate: true, shouldDirty: true })
                      }
                    >
                      <SelectTrigger id="phone_provider">
                        <SelectValue placeholder="Select your phone or VoIP provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {PHONE_PROVIDER_GROUPS.map((group) => (
                          <SelectGroup key={group.label}>
                            <SelectLabel>{group.label}</SelectLabel>
                            {group.options.map((name) => (
                              <SelectItem key={name} value={name}>
                                {name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ))}
                        <SelectGroup>
                          <SelectItem value={PHONE_PROVIDER_OTHER}>Other (not listed)</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  {phoneProvider === PHONE_PROVIDER_OTHER && (
                    <EditField
                      label="Provider name"
                      name="phone_provider_other"
                      register={register}
                      rules={{ required: "Required" }}
                      error={errors.phone_provider_other}
                    />
                  )}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <EditField label="Contact name" name="contact_name" register={register} rules={{ required: "Required" }} error={errors.contact_name} />
                    <EditField label="Contact email" name="contact_email" type="email" register={register} rules={{ required: "Required" }} error={errors.contact_email} />
                  </div>
                  <EditTextArea label="Service area" name="service_areas" register={register} rules={{ required: "Required" }} error={errors.service_areas} />
                  <EditTextArea label="Services offered" name="services" register={register} rules={{ required: "Required" }} error={errors.services} />

                  <div className="space-y-2">
                    <Label>Conversion goal</Label>
                    <RadioGroup value={conversion} onValueChange={(v) => setValue("conversion_preference", v)} className="space-y-2">
                      {CONVERSION_OPTIONS.map((opt) => (
                        <label key={opt.value} className={cn(
                          "flex cursor-pointer items-start gap-3 rounded-lg border px-3.5 py-3 text-sm transition-colors",
                          conversion === opt.value ? "border-brand-600 bg-brand-50" : "border-border hover:bg-secondary"
                        )}>
                          <RadioGroupItem value={opt.value} className="mt-0.5" />
                          <span>
                            <span className="font-medium text-ink">{opt.label}</span>
                            <span className="block text-xs text-muted-foreground">{opt.hint}</span>
                          </span>
                        </label>
                      ))}
                    </RadioGroup>
                    {conversion === "scheduled_appointment" && (
                      <EditField label="Scheduling link" name="calendly_link" placeholder="https://calendly.com/..." register={register} rules={{ required: "Required" }} error={errors.calendly_link} />
                    )}
                    {conversion === "warm_transfer" && (
                      <EditField label="Transfer number" name="transfer_number" type="tel" register={register} rules={{ required: "Required" }} error={errors.transfer_number} />
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label>Employee directory</Label>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Who callers can be transferred to.
                      </p>
                    </div>
                    {employeeFields.map((field, index) => (
                      <div key={field.id} className="rounded-lg border border-border bg-secondary/30 p-3.5">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Employee {index + 1}
                          </span>
                          {employeeFields.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeEmployee(index)}
                              className="flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-muted-foreground hover:bg-white hover:text-destructive"
                              aria-label={`Remove employee ${index + 1}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Remove
                            </button>
                          )}
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="space-y-1.5">
                            <Label htmlFor={`employees.${index}.name`} className="text-xs">Name</Label>
                            <Input
                              id={`employees.${index}.name`}
                              placeholder="Jane Doe"
                              {...register(`employees.${index}.name`, {
                                validate: (v, all) => {
                                  const row = all.employees?.[index] || {};
                                  if ((row.transfer_line || row.email) && !(v || "").trim())
                                    return "Name is required";
                                  return true;
                                },
                              })}
                            />
                            {errors.employees?.[index]?.name && (
                              <p className="text-xs text-destructive">{errors.employees[index].name.message}</p>
                            )}
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor={`employees.${index}.transfer_line`} className="text-xs">Transfer line</Label>
                            <Input
                              id={`employees.${index}.transfer_line`}
                              type="tel"
                              placeholder="(555) 123-4567"
                              {...register(`employees.${index}.transfer_line`)}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor={`employees.${index}.email`} className="text-xs">Email</Label>
                            <Input
                              id={`employees.${index}.email`}
                              type="email"
                              placeholder="jane@apexroofing.com"
                              {...register(`employees.${index}.email`, {
                                validate: (v) =>
                                  !(v || "").trim() || EMAIL_RE.test(v.trim()) ? true : "Enter a valid email",
                              })}
                            />
                            {errors.employees?.[index]?.email && (
                              <p className="text-xs text-destructive">{errors.employees[index].email.message}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => appendEmployee({ name: "", transfer_line: "", email: "" })}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border px-3.5 py-2.5 text-sm font-medium text-brand-600 hover:bg-brand-50"
                    >
                      <Plus className="h-4 w-4" /> Add another employee
                    </button>
                  </div>

                  <EditTextArea
                    label="Summary email recipients"
                    name="summary_emails"
                    register={register}
                    rules={{
                      required: "Required",
                      validate: (v) => {
                        const list = parseEmailList(v);
                        if (!list.length) return "At least one summary email is required";
                        const bad = list.find((e) => !EMAIL_RE.test(e));
                        return bad ? `"${bad}" is not a valid email` : true;
                      },
                    }}
                    error={errors.summary_emails}
                  />

                  <EditTextArea label="Business hours" name="business_hours" register={register} rules={{ required: "Required" }} error={errors.business_hours} />
                  <EditTextArea label="After-hours preference" name="after_hours_preference" register={register} rules={{ required: "Required" }} error={errors.after_hours_preference} />

                  <div className="flex gap-3 pt-2">
                    <Button type="submit" disabled={saving} className="min-w-28">
                      {saving ? <Spinner className="text-white" /> : <><Save className="h-4 w-4" /> Save</>}
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => setEditing(false)} disabled={saving}>
                      <X className="h-4 w-4" /> Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3">
                  <Row icon={Building2} label="Business name" value={profile?.company_name} />
                  <Row icon={MapPin} label="Address" value={profile?.address} />
                  <Row icon={Phone} label="Business phone" value={formatPhone(profile?.business_phone)} />
                  <Row
                    icon={Phone}
                    label="Phone provider"
                    value={
                      profile?.phone_provider === PHONE_PROVIDER_OTHER
                        ? profile?.phone_provider_other || PHONE_PROVIDER_OTHER
                        : profile?.phone_provider
                    }
                  />
                  <Row icon={User} label="Contact name" value={profile?.contact_name} />
                  <Row icon={Mail} label="Contact email" value={profile?.contact_email} />
                  <Row icon={MapPin} label="Service area" value={profile?.service_areas} />
                  <Row icon={Wrench} label="Services" value={profile?.services} />
                  <Row icon={Phone} label="Conversion goal" value={CONVERSION_LABEL[profile?.conversion_preference] ?? profile?.conversion_preference} />
                  <Row
                    icon={Users}
                    label="Team directory"
                    value={
                      Array.isArray(profile?.employees) && profile.employees.length ? (
                        <ul className="space-y-0.5">
                          {profile.employees.map((e, i) => (
                            <li key={i} className="break-words">
                              {[e?.name, formatPhone(e?.transfer_line), e?.email]
                                .filter(Boolean)
                                .join(" · ")}
                            </li>
                          ))}
                        </ul>
                      ) : null
                    }
                  />
                  <Row
                    icon={Mail}
                    label="Summary emails"
                    value={
                      Array.isArray(profile?.summary_emails) && profile.summary_emails.length
                        ? profile.summary_emails.join(", ")
                        : null
                    }
                  />
                  <Row icon={Clock} label="Business hours" value={profile?.business_hours} />
                  <Row icon={Clock} label="After hours" value={profile?.after_hours_preference} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Support */}
          <Section title="Support" icon={LifeBuoy}>
            <p className="text-sm text-muted-foreground">
              Need a hand? Our team is here to help you get the most out of Roof AI.
            </p>
            <div className="mt-3 flex flex-col gap-2">
              <Button variant="secondary" size="sm" asChild>
                <a href="mailto:support@roofaileadrecovery.com">
                  <Mail className="h-4 w-4" /> Contact support
                </a>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="h-4 w-4" /> Back to dashboard
              </Button>
            </div>
          </Section>
        </div>

        {/* Recent Activity */}
        <Section title="Recent Activity" icon={Activity} full>
          <ul className="space-y-3">
            <ActivityItem label="Account created" when={subscription?.created_at} />
            {paid && <ActivityItem label="Payment completed" when={subscription?.created_at} />}
            {profile?.details_submitted && (
              <ActivityItem label="Business information submitted" when={null} />
            )}
            {history.map((h, i) => (
              <ActivityItem
                key={i}
                label={`Status changed to "${(h.to_status || "").replace(/_/g, " ")}"${h.note ? ` — ${h.note}` : ""}`}
                when={h.created_at}
              />
            ))}
          </ul>
        </Section>
      </main>
    </div>
  );
}

function Section({ title, icon: Icon, children, full }) {
  return (
    <Card className={full ? "md:col-span-2" : ""}>
      <CardContent className="p-6">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50">
            <Icon className="h-4 w-4 text-brand-600" />
          </span>
          <h2 className="font-bold text-ink">{title}</h2>
        </div>
        <div className="space-y-3">{children}</div>
      </CardContent>
    </Card>
  );
}

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <div className="text-sm text-ink">
          {value ? (
            typeof value === "string" ? (
              <span className="break-words">{value}</span>
            ) : (
              value
            )
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </div>
      </div>
    </div>
  );
}

function EditField({ label, name, type = "text", placeholder, register, rules, error }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} type={type} placeholder={placeholder} {...register(name, rules)} />
      {error && <p className="text-xs text-destructive">{error.message}</p>}
    </div>
  );
}

function EditTextArea({ label, name, placeholder, register, rules, error }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <textarea
        id={name}
        rows={2}
        placeholder={placeholder}
        className="flex w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-1"
        {...register(name, rules)}
      />
      {error && <p className="text-xs text-destructive">{error.message}</p>}
    </div>
  );
}

function ActivityItem({ label, when }) {
  return (
    <li className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 border-b border-border/60 pb-3 last:border-0 last:pb-0">
      <span className="flex min-w-0 items-center gap-2.5 text-sm text-ink">
        <span className="h-2 w-2 shrink-0 rounded-full bg-brand-500" /> {label}
      </span>
      {when && <span className="text-xs text-muted-foreground">{formatDateTime(when)}</span>}
    </li>
  );
}
