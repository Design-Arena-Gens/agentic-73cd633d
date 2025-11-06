"use client";

import { useMemo, useState } from "react";

type FormValues = {
  fullName: string;
  email: string;
  phone: string;
  department: string;
  city: string;
  state: string;
  pinCode: string;
  notes: string;
};

type Entry = FormValues & {
  id: string;
  createdAt: string;
};

const emptyForm: FormValues = {
  fullName: "",
  email: "",
  phone: "",
  department: "",
  city: "",
  state: "",
  pinCode: "",
  notes: "",
};

const requiredMessage = "यह जानकारी आवश्यक है";

const validators: Record<keyof FormValues, (value: string) => string | null> = {
  fullName: (value) => (value.trim() ? null : requiredMessage),
  email: (value) => {
    if (!value.trim()) return requiredMessage;
    return /\S+@\S+\.\S+/.test(value) ? null : "सही ईमेल लिखें";
  },
  phone: (value) => {
    if (!value.trim()) return requiredMessage;
    return /^\d{10}$/.test(value.replace(/\D/g, ""))
      ? null
      : "10 अंकों का मोबाइल नंबर दर्ज करें";
  },
  department: (value) => (value.trim() ? null : requiredMessage),
  city: (value) => (value.trim() ? null : requiredMessage),
  state: (value) => (value.trim() ? null : requiredMessage),
  pinCode: (value) => {
    if (!value.trim()) return requiredMessage;
    return /^\d{6}$/.test(value.replace(/\D/g, ""))
      ? null
      : "6 अंकों का पिनकोड दर्ज करें";
  },
  notes: () => null,
};

const statesOfIndia = [
  "दिल्ली",
  "महाराष्ट्र",
  "उत्तर प्रदेश",
  "गुजरात",
  "पश्चिम बंगाल",
  "कर्नाटक",
  "राजस्थान",
  "तेलंगाना",
  "तमिलनाडु",
  "मध्य प्रदेश",
  "छत्तीसगढ़",
  "हरियाणा",
  "बिहार",
  "पंजाब",
  "जम्मू और कश्मीर",
];

const sampleDepartments = [
  "सेल्स",
  "मार्केटिंग",
  "मानव संसाधन",
  "ऑपरेशन्स",
  "आईटी सपोर्ट",
];

export default function Home() {
  const [formValues, setFormValues] = useState<FormValues>(emptyForm);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [touched, setTouched] = useState<Partial<Record<keyof FormValues, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const errors = useMemo(() => {
    const currentErrors: Partial<Record<keyof FormValues, string>> = {};
    (Object.keys(formValues) as (keyof FormValues)[]).forEach((key) => {
      const validator = validators[key];
      const message = validator(formValues[key]);
      if (message) {
        currentErrors[key] = message;
      }
    });
    return currentErrors;
  }, [formValues]);

  const isFormValid = useMemo(
    () => Object.keys(errors).length === 0,
    [errors]
  );

  const handleChange = (field: keyof FormValues, value: string) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleBlur = (field: keyof FormValues) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const resetForm = () => {
    setFormValues(emptyForm);
    setEditingId(null);
    setTouched({});
    setSubmitAttempted(false);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitAttempted(true);

    if (!isFormValid) {
      return;
    }

    const timestamp = new Date().toISOString();

    if (editingId) {
      setEntries((prev) =>
        prev.map((entry) =>
          entry.id === editingId
            ? {
                ...entry,
                ...formValues,
              }
            : entry
        )
      );
    } else {
      const newEntry: Entry = {
        id: crypto.randomUUID(),
        createdAt: timestamp,
        ...formValues,
      };
      setEntries((prev) => [newEntry, ...prev]);
    }

    resetForm();
  };

  const handleEdit = (id: string) => {
    const entryToEdit = entries.find((entry) => entry.id === id);
    if (!entryToEdit) return;

    const { fullName, email, phone, department, city, state, pinCode, notes } =
      entryToEdit;

    setFormValues({
      fullName,
      email,
      phone,
      department,
      city,
      state,
      pinCode,
      notes,
    });
    setTouched({});
    setSubmitAttempted(false);
    setEditingId(id);
  };

  const handleDelete = (id: string) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
    if (editingId === id) {
      resetForm();
    }
  };

  const handleExport = () => {
    if (!entries.length) return;

    const headers = [
      "नाम",
      "ईमेल",
      "मोबाइल",
      "विभाग",
      "शहर",
      "राज्य",
      "पिनकोड",
      "नोट्स",
      "तारीख",
    ];

    const rows = entries.map((entry) => [
      entry.fullName,
      entry.email,
      entry.phone,
      entry.department,
      entry.city,
      entry.state,
      entry.pinCode,
      entry.notes.replace(/\n/g, " "),
      new Date(entry.createdAt).toLocaleString("hi-IN"),
    ]);

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `data-entries-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const totalDepartments = useMemo(() => {
    const counter = new Map<string, number>();
    entries.forEach((entry) => {
      counter.set(entry.department, (counter.get(entry.department) || 0) + 1);
    });
    return Array.from(counter.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [entries]);

  const pendingErrors = (Object.keys(errors) as (keyof FormValues)[]).filter(
    (key) => errors[key]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-sky-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <header className="rounded-3xl bg-white/80 p-8 shadow-xl shadow-orange-100 backdrop-blur">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold text-zinc-900 sm:text-4xl">
              डेटा प्रविष्टि केंद्र
            </h1>
            <p className="text-base text-zinc-600 sm:text-lg">
              कर्मचारियों या ग्राहकों की जानकारी जल्दी से जोड़ें, अपडेट करें और डाउनलोड करें। सभी
              फ़ील्ड हिंदी में प्रदर्शित किये गये हैं ताकि टीम आसानी से डेटा भर सके।
            </p>
          </div>
        </header>

        <main className="grid gap-6 lg:grid-cols-[minmax(0,1fr),minmax(280px,320px)]">
          <section className="rounded-3xl bg-white/90 p-6 shadow-lg shadow-orange-100/60 backdrop-blur">
            <div className="flex items-center justify-between gap-4 border-b border-orange-100 pb-4">
              <div>
                <h2 className="text-2xl font-semibold text-zinc-900">
                  {editingId ? "जानकारी अपडेट करें" : "नई जानकारी जोड़ें"}
                </h2>
                <p className="text-sm text-zinc-500">
                  अनिवार्य फ़ील्ड पर * अंकित है। डेटा सुरक्षित रूप से स्थानीय ब्राउज़र में रहता है।
                </p>
              </div>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:border-orange-400 hover:text-orange-500"
              >
                फॉर्म साफ़ करें
              </button>
            </div>
            <form className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-zinc-700">
                  पूरा नाम *
                </label>
                <input
                  type="text"
                  value={formValues.fullName}
                  onChange={(event) => handleChange("fullName", event.target.value)}
                  onBlur={() => handleBlur("fullName")}
                  placeholder="जैसे - रीना शर्मा"
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                />
                {(touched.fullName || submitAttempted) && errors.fullName && (
                  <p className="text-sm text-red-500">{errors.fullName}</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-zinc-700">
                  ईमेल *
                </label>
                <input
                  type="email"
                  value={formValues.email}
                  onChange={(event) => handleChange("email", event.target.value)}
                  onBlur={() => handleBlur("email")}
                  placeholder="example@company.com"
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                />
                {(touched.email || submitAttempted) && errors.email && (
                  <p className="text-sm text-red-500">{errors.email}</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-zinc-700">
                  मोबाइल नंबर *
                </label>
                <input
                  type="tel"
                  value={formValues.phone}
                  onChange={(event) => handleChange("phone", event.target.value)}
                  onBlur={() => handleBlur("phone")}
                  placeholder="10 अंकों का मोबाइल नंबर"
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                />
                {(touched.phone || submitAttempted) && errors.phone && (
                  <p className="text-sm text-red-500">{errors.phone}</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-zinc-700">
                  विभाग *
                </label>
                <select
                  value={formValues.department}
                  onChange={(event) => handleChange("department", event.target.value)}
                  onBlur={() => handleBlur("department")}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                >
                  <option value="">विभाग चुनें</option>
                  {sampleDepartments.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {(touched.department || submitAttempted) && errors.department && (
                  <p className="text-sm text-red-500">{errors.department}</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-zinc-700">
                  शहर *
                </label>
                <input
                  type="text"
                  value={formValues.city}
                  onChange={(event) => handleChange("city", event.target.value)}
                  onBlur={() => handleBlur("city")}
                  placeholder="उदा. जयपुर"
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                />
                {(touched.city || submitAttempted) && errors.city && (
                  <p className="text-sm text-red-500">{errors.city}</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-zinc-700">
                  राज्य *
                </label>
                <select
                  value={formValues.state}
                  onChange={(event) => handleChange("state", event.target.value)}
                  onBlur={() => handleBlur("state")}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                >
                  <option value="">राज्य चुनें</option>
                  {statesOfIndia.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {(touched.state || submitAttempted) && errors.state && (
                  <p className="text-sm text-red-500">{errors.state}</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-zinc-700">
                  पिनकोड *
                </label>
                <input
                  type="text"
                  value={formValues.pinCode}
                  onChange={(event) => handleChange("pinCode", event.target.value)}
                  onBlur={() => handleBlur("pinCode")}
                  placeholder="छः अंकों का पिन"
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                />
                {(touched.pinCode || submitAttempted) && errors.pinCode && (
                  <p className="text-sm text-red-500">{errors.pinCode}</p>
                )}
              </div>

              <div className="md:col-span-2 flex flex-col gap-2">
                <label className="text-sm font-medium text-zinc-700">
                  नोट्स
                </label>
                <textarea
                  value={formValues.notes}
                  onChange={(event) => handleChange("notes", event.target.value)}
                  placeholder="अतिरिक्त जानकारी लिखें"
                  rows={4}
                  className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              {pendingErrors.length > 0 && submitAttempted && (
                <div className="md:col-span-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  कृपया सभी अनिवार्य फ़ील्ड सही तरीके से भरें।
                </div>
              )}

              <div className="md:col-span-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600 sm:w-auto"
                >
                  {editingId ? "रिकॉर्ड अपडेट करें" : "रिकॉर्ड जोड़ें"}
                </button>
                <p className="text-xs text-zinc-500">
                  कुल {entries.length} रिकॉर्ड सुरक्षित किये गये हैं।
                </p>
              </div>
            </form>
          </section>

          <aside className="flex flex-col gap-6">
            <div className="rounded-3xl bg-white/90 p-6 shadow-lg shadow-sky-100/60 backdrop-blur">
              <h3 className="text-lg font-semibold text-zinc-900">रिकॉर्ड सारांश</h3>
              <p className="mt-1 text-sm text-zinc-500">
                दर्ज की गयी जानकारी का त्वरित अवलोकन।
              </p>
              <dl className="mt-4 flex flex-col gap-3 text-sm">
                <div className="flex items-center justify-between rounded-2xl bg-orange-50 px-4 py-3 text-orange-700">
                  <dt>कुल रिकॉर्ड</dt>
                  <dd className="text-base font-semibold">{entries.length}</dd>
                </div>
                <div className="flex flex-col gap-2 rounded-2xl border border-zinc-100 px-4 py-3 text-zinc-600">
                  <dt className="font-medium text-zinc-700">शीर्ष विभाग</dt>
                  {totalDepartments.length === 0 ? (
                    <dd>डेटा जोड़ा जाने पर सूची दिखाई देगी।</dd>
                  ) : (
                    totalDepartments.map(([name, count]) => (
                      <dd key={name} className="flex items-center justify-between">
                        <span>{name}</span>
                        <span className="font-semibold text-zinc-900">{count}</span>
                      </dd>
                    ))
                  )}
                </div>
              </dl>
              <button
                type="button"
                onClick={handleExport}
                disabled={entries.length === 0}
                className="mt-4 w-full rounded-full border border-sky-200 bg-sky-500/10 px-5 py-2.5 text-sm font-semibold text-sky-600 transition hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:bg-zinc-100 disabled:text-zinc-400"
              >
                CSV में डाउनलोड करें
              </button>
            </div>

            <div className="rounded-3xl bg-white/90 p-6 shadow-lg shadow-sky-100/60 backdrop-blur">
              <h3 className="text-lg font-semibold text-zinc-900">रिकॉर्ड सूची</h3>
              <p className="mt-1 text-sm text-zinc-500">
                किसी रिकॉर्ड पर क्लिक कर संशोधित या हटाएं।
              </p>
              <div className="mt-4 flex max-h-[420px] flex-col gap-3 overflow-y-auto pr-1">
                {entries.length === 0 ? (
                  <p className="rounded-2xl bg-zinc-50 px-4 py-3 text-sm text-zinc-500">
                    अभी तक कोई डेटा प्रविष्टि नहीं जोड़ी गयी है।
                  </p>
                ) : (
                  entries.map((entry) => (
                    <article
                      key={entry.id}
                      className="group rounded-2xl border border-zinc-100 bg-white px-4 py-3 shadow-sm transition hover:border-orange-200 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-semibold text-zinc-900">
                            {entry.fullName}
                          </h4>
                          <p className="text-xs text-zinc-500">
                            {new Date(entry.createdAt).toLocaleString("hi-IN", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(entry.id)}
                            className="rounded-full border border-transparent px-3 py-1 text-xs font-medium text-sky-600 transition hover:border-sky-100 hover:bg-sky-50"
                          >
                            संपादित करें
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(entry.id)}
                            className="rounded-full border border-transparent px-3 py-1 text-xs font-medium text-red-500 transition hover:border-red-100 hover:bg-red-50"
                          >
                            हटाएं
                          </button>
                        </div>
                      </div>
                      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-zinc-600">
                        <div>
                          <dt className="font-medium text-zinc-700">ईमेल</dt>
                          <dd>{entry.email}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-zinc-700">मोबाइल</dt>
                          <dd>{entry.phone}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-zinc-700">विभाग</dt>
                          <dd>{entry.department}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-zinc-700">शहर / राज्य</dt>
                          <dd>
                            {entry.city}, {entry.state}
                          </dd>
                        </div>
                        {entry.notes && (
                          <div className="col-span-2">
                            <dt className="font-medium text-zinc-700">नोट्स</dt>
                            <dd className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-zinc-600">
                              {entry.notes}
                            </dd>
                          </div>
                        )}
                      </dl>
                    </article>
                  ))
                )}
              </div>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}
