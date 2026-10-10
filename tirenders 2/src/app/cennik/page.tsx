import Link from "next/link";
import PriceTable from "@/components/PriceTable";
import PricingInfo from "@/components/pricing/PricingInfo";
import Split from "@/components/Split";
import { getLang, tr } from "@/lib/i18n";

export const metadata = { title: "Cennik" };

export default function Page() {
  const l = getLang();
  return (
    <>
      <div className="wrap page-hero">
        <p className="eyebrow" data-reveal>{tr(l, { pl: "Cennik", en: "Pricing" })}</p>
        <Split as="h1" text={tr(l, { pl: "Płacisz za minuty.", en: "Pay for minutes." })} />
        <p data-reveal>{tr(l, { pl: "Ceny brutto za jedno stanowisko, jedną osobę.", en: "Gross prices per rig, per person." })}</p>
      </div>
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div data-reveal>
            <PriceTable lang={l} />
          </div>
          <div style={{ marginTop: 70 }}>
            <PricingInfo lang={l} />
          </div>
          <div style={{ marginTop: 40 }} data-reveal>
            <Link href="/rezerwacja" className="btn-white magnetic">
              {tr(l, { pl: "Zarezerwuj stanowisko", en: "Book a rig" })}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
