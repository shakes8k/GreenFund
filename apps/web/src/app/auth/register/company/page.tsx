"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setUser } from "@/lib/auth";

const STEPS = ["Account", "Identity", "People", "Documentation", "Financials"];

const categories = [
  "solar", "wind", "ocean_tech", "carbon_capture",
  "green_hydrogen", "sustainable_agriculture", "ev_mobility",
  "energy_storage", "waste_tech", "biodiversity", "diverse",
];

interface KeyPerson {
  name: string;
  role: string;
  linkedin: string;
}

// ─── Reusable upload field ────────────────────────────────────────────────────

function UploadField({
  label,
  multiple,
  onUploaded,
}: {
  label: string;
  multiple?: boolean;
  onUploaded: (urls: string[]) => void;
}) {
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList) {
    setUploading(true);
    const urls: string[] = [];
    const names: string[] = [];
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (data.url) {
          urls.push(data.url as string);
          names.push(file.name);
        }
      } catch {
        // skip failed uploads
      }
    }
    setFileNames((prev) => [...prev, ...names]);
    onUploaded(urls);
    setUploading(false);
  }

  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500">
        {label}
      </label>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full rounded-lg border border-dashed border-white/20 bg-white/[0.02] px-4 py-3 text-sm text-gray-400 transition hover:border-green-500/40 hover:text-white disabled:opacity-50"
      >
        {uploading ? "Uploading…" : `Click to upload${multiple ? " (multiple)" : ""}`}
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple={multiple}
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />
      {fileNames.length > 0 && (
        <ul className="mt-2 space-y-1">
          {fileNames.map((n, i) => (
            <li key={i} className="flex items-center gap-2 text-xs text-green-400">
              <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {n}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Single-file upload with image preview ────────────────────────────────────

function LogoUploadField({ onUploaded }: { onUploaded: (url: string) => void }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) {
        setPreviewUrl(data.url as string);
        onUploaded(data.url as string);
      }
    } catch {
      // ignore
    }
    setUploading(false);
  }

  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500">
        Company Logo
      </label>
      <div className="flex items-center gap-4">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="Logo preview" className="h-14 w-14 rounded-lg object-cover border border-white/10" />
        ) : (
          <div className="h-14 w-14 rounded-lg border border-dashed border-white/20 bg-white/[0.02] flex items-center justify-center text-gray-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 12V6.75A2.25 2.25 0 015.25 4.5h13.5A2.25 2.25 0 0121 6.75V12" />
            </svg>
          </div>
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-400 transition hover:border-green-500/40 hover:text-white disabled:opacity-50"
        >
          {uploading ? "Uploading…" : previewUrl ? "Change" : "Upload logo"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CompanyRegisterPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Step 0 — Account
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Step 0 extras (for startup record)
  const [category, setCategory] = useState("solar");
  const [countryCode, setCountryCode] = useState("IN");
  const [teamSize, setTeamSize] = useState("1–10");
  const [description, setDescription] = useState("");

  // Step 1 — Identity
  const [legalName, setLegalName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [incorporationDate, setIncorporationDate] = useState("");
  const [jurisdiction, setJurisdiction] = useState("");
  const [registeredAddress, setRegisteredAddress] = useState("");
  const [operatingAddress, setOperatingAddress] = useState("");
  const [website, setWebsite] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  // Step 2 — People
  const [keyPeople, setKeyPeople] = useState<KeyPerson[]>([{ name: "", role: "", linkedin: "" }]);

  // Step 3 — Documentation
  const [legalDocUrls, setLegalDocUrls] = useState<string[]>([]);
  const [kycDocUrls, setKycDocUrls] = useState<string[]>([]);

  // Step 4 — Financials
  const [financialDocUrls, setFinancialDocUrls] = useState<string[]>([]);
  const [patentDocUrls, setPatentDocUrls] = useState<string[]>([]);
  const [esgCertUrls, setEsgCertUrls] = useState<string[]>([]);

  function addPerson() {
    setKeyPeople((prev) => [...prev, { name: "", role: "", linkedin: "" }]);
  }

  function removePerson(index: number) {
    setKeyPeople((prev) => prev.filter((_, i) => i !== index));
  }

  function updatePerson(index: number, field: keyof KeyPerson, value: string) {
    setKeyPeople((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  }

  async function finish() {
    setLoading(true);
    // 1. Register user
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        password,
        role: "company",
        companyName: legalName,
        category,
        stage: "pre_seed",
        countryCode,
        teamSize,
        companyDescription: description,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "Registration failed. Please try again.");
      setLoading(false);
      return;
    }

    // 2. Create startup record
    const startupRes = await fetch("/api/company/startup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyName: legalName,
        description: description || `${legalName} — a climate-focused company.`,
        category,
        stage: "pre_seed",
        countryCode,
        teamSize,
        companyEmail: email,
      }),
    });
    const startupData = await startupRes.json();
    const startupId: string | undefined = startupData?.id;

    // 3. Submit onboarding if we have a startup id
    if (startupId) {
      await fetch("/api/company/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startupId,
          legalName,
          registrationNumber,
          incorporationDate,
          jurisdiction,
          registeredAddress,
          operatingAddress,
          website: website || null,
          logoUrl: logoUrl || null,
          keyPeople,
          legalDocUrls,
          kycDocUrls,
          financialDocUrls,
          patentDocUrls,
          esgCertUrls,
        }),
      });
    }

    setUser(data);
    router.push("/dashboard/company");
  }

  const canProceed0 = name.trim() !== "" && email.trim() !== "" && password.length >= 8;
  const canProceed1 =
    legalName.trim() !== "" &&
    registrationNumber.trim() !== "" &&
    incorporationDate !== "" &&
    jurisdiction.trim() !== "" &&
    registeredAddress.trim() !== "" &&
    operatingAddress.trim() !== "";
  const canProceed2 = keyPeople.length > 0 && keyPeople.every((p) => p.name.trim() !== "" && p.role.trim() !== "");

  return (
    <main className="flex min-h-[calc(100vh-73px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <Link
          href="/auth/register"
          className="mb-6 flex items-center gap-1 text-sm text-gray-500 hover:text-white transition"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to role selection
        </Link>

        <div className="mb-6 flex items-center gap-2">
          <span className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-0.5 text-xs font-medium text-green-400">
            Company Registration
          </span>
        </div>

        {/* Progress bar */}
        <div className="mb-8 flex gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex flex-1 flex-col gap-1">
              <div
                className={`h-0.5 rounded-full transition-colors ${
                  i <= step ? "bg-green-500" : "bg-white/10"
                }`}
              />
              <span
                className={`text-[10px] font-medium ${
                  i === step ? "text-green-400" : "text-gray-600"
                }`}
              >
                {s}
              </span>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8">
          {/* ── Step 0: Account ── */}
          {step === 0 && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold text-white">Account Details</h2>
              <Field
                label="Your Full Name"
                type="text"
                value={name}
                onChange={setName}
                placeholder="Jane Smith"
              />
              <Field
                label="Work Email"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="jane@yourcompany.com"
              />
              <Field
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="Min. 8 characters"
              />

              <div className="border-t border-white/5 pt-5">
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                  Company Classification
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <SelectField
                    label="Category"
                    value={category}
                    onChange={setCategory}
                    options={categories.map((c) => ({
                      value: c,
                      label: c.replace(/_/g, " ").replace(/\b\w/g, (x) => x.toUpperCase()),
                    }))}
                  />
                  <SelectField
                    label="Team Size"
                    value={teamSize}
                    onChange={setTeamSize}
                    options={["1–10", "11–50", "51–200", "200+"].map((s) => ({ value: s, label: s }))}
                  />
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500">
                      Country Code
                    </label>
                    <input
                      type="text"
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value.toUpperCase().slice(0, 2))}
                      maxLength={2}
                      placeholder="IN"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-green-500/40 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500">
                    Company Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Describe your climate solution, technology, and impact model…"
                    className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-green-500/40 focus:outline-none"
                  />
                </div>
              </div>

              <button
                disabled={!canProceed0}
                onClick={() => setStep(1)}
                className="w-full rounded-lg bg-green-500 py-3 text-sm font-semibold text-black transition hover:bg-green-400 disabled:opacity-40"
              >
                Continue to Identity →
              </button>
            </div>
          )}

          {/* ── Step 1: Identity ── */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold text-white">Legal Identity</h2>

              <Field
                label="Legal Company Name"
                type="text"
                value={legalName}
                onChange={setLegalName}
                placeholder="SolarTech Private Limited"
              />
              <Field
                label="Registration Number (CIN)"
                type="text"
                value={registrationNumber}
                onChange={setRegistrationNumber}
                placeholder="U12345MH2024PTC123456"
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500">
                    Date of Incorporation
                  </label>
                  <input
                    type="date"
                    value={incorporationDate}
                    onChange={(e) => setIncorporationDate(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-green-500/40 focus:outline-none [color-scheme:dark]"
                  />
                </div>
                <Field
                  label="Country & Jurisdiction"
                  type="text"
                  value={jurisdiction}
                  onChange={setJurisdiction}
                  placeholder="India, Maharashtra"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500">
                  Registered Address
                </label>
                <textarea
                  value={registeredAddress}
                  onChange={(e) => setRegisteredAddress(e.target.value)}
                  rows={2}
                  placeholder="123 MG Road, Fort, Mumbai, Maharashtra 400001"
                  className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-green-500/40 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500">
                  Operating Address
                </label>
                <textarea
                  value={operatingAddress}
                  onChange={(e) => setOperatingAddress(e.target.value)}
                  rows={2}
                  placeholder="456 Tech Park, Whitefield, Bengaluru, Karnataka 560066"
                  className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-green-500/40 focus:outline-none"
                />
              </div>

              <Field
                label="Website URL (optional)"
                type="url"
                value={website}
                onChange={setWebsite}
                placeholder="https://yourcompany.com"
              />

              <LogoUploadField onUploaded={setLogoUrl} />

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep(0)}
                  className="flex-1 rounded-lg border border-white/10 py-3 text-sm text-gray-400 hover:text-white transition"
                >
                  ← Back
                </button>
                <button
                  disabled={!canProceed1}
                  onClick={() => setStep(2)}
                  className="flex-1 rounded-lg bg-green-500 py-3 text-sm font-semibold text-black hover:bg-green-400 disabled:opacity-40 transition"
                >
                  Continue to People →
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: People ── */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Key People</h2>
                <button
                  type="button"
                  onClick={addPerson}
                  className="flex items-center gap-1 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-400 hover:bg-green-500/20 transition"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Add person
                </button>
              </div>

              {keyPeople.map((person, index) => (
                <div
                  key={index}
                  className="relative rounded-xl border border-white/10 bg-white/[0.02] p-5 space-y-4"
                >
                  {keyPeople.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePerson(index)}
                      className="absolute right-4 top-4 text-gray-600 hover:text-red-400 transition"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-600">
                    Person {index + 1}
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <Field
                      label="Full Name"
                      type="text"
                      value={person.name}
                      onChange={(v) => updatePerson(index, "name", v)}
                      placeholder="Priya Sharma"
                    />
                    <Field
                      label="Role / Title"
                      type="text"
                      value={person.role}
                      onChange={(v) => updatePerson(index, "role", v)}
                      placeholder="Co-Founder & CEO"
                    />
                  </div>
                  <Field
                    label="LinkedIn URL"
                    type="url"
                    value={person.linkedin}
                    onChange={(v) => updatePerson(index, "linkedin", v)}
                    placeholder="https://linkedin.com/in/priyasharma"
                  />
                </div>
              ))}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-lg border border-white/10 py-3 text-sm text-gray-400 hover:text-white transition"
                >
                  ← Back
                </button>
                <button
                  disabled={!canProceed2}
                  onClick={() => setStep(3)}
                  className="flex-1 rounded-lg bg-green-500 py-3 text-sm font-semibold text-black hover:bg-green-400 disabled:opacity-40 transition"
                >
                  Continue to Docs →
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Documentation ── */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white">Documentation</h2>
              <p className="text-sm text-gray-400">
                Upload your company&apos;s legal and compliance documents. All files are stored securely.
              </p>

              <UploadField
                label="Legal Documents (MOA, AOA, Certificate of Incorporation)"
                multiple
                onUploaded={(urls) => setLegalDocUrls((prev) => [...prev, ...urls])}
              />

              <UploadField
                label="KYC Records (Director ID proofs, GST certificate)"
                multiple
                onUploaded={(urls) => setKycDocUrls((prev) => [...prev, ...urls])}
              />

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 rounded-lg border border-white/10 py-3 text-sm text-gray-400 hover:text-white transition"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="flex-1 rounded-lg bg-green-500 py-3 text-sm font-semibold text-black hover:bg-green-400 transition"
                >
                  Continue to Financials →
                </button>
              </div>
            </div>
          )}

          {/* ── Step 4: Financials ── */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white">Financial & ESG Records</h2>
              <p className="text-sm text-gray-400">
                Upload audited financials, patents, and environmental certifications to strengthen your profile.
              </p>

              <UploadField
                label="Audited Financial Records"
                multiple
                onUploaded={(urls) => setFinancialDocUrls((prev) => [...prev, ...urls])}
              />

              <UploadField
                label="Patent Documents"
                multiple
                onUploaded={(urls) => setPatentDocUrls((prev) => [...prev, ...urls])}
              />

              <UploadField
                label="ESG / Environmental Certifications"
                multiple
                onUploaded={(urls) => setEsgCertUrls((prev) => [...prev, ...urls])}
              />

              <div className="rounded-lg border border-green-500/10 bg-green-500/5 p-3 text-xs text-gray-400">
                After submission your startup enters the DVN queue for expert assessment. Fundraising is unlocked once your onboarding is verified.
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 rounded-lg border border-white/10 py-3 text-sm text-gray-400 hover:text-white transition"
                >
                  ← Back
                </button>
                <button
                  onClick={finish}
                  disabled={loading}
                  className="flex-1 rounded-lg bg-green-500 py-3 text-sm font-semibold text-black hover:bg-green-400 disabled:opacity-50 transition"
                >
                  {loading ? "Creating account…" : "Submit & Create Account →"}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-sm font-light text-gray-600">
          Already registered?{" "}
          <Link href="/auth/login" className="font-medium text-green-400 hover:text-green-300">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

// ─── Helper components ────────────────────────────────────────────────────────

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-green-500/40 focus:outline-none"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-green-500/40 focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
