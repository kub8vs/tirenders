import { BOOKING, GROUP_DISCOUNTS, PRICES, SIMULATORS, WHOLE_SALON_PERCENT } from "@/config/site";

// Cennik per stanowisko, tak jak podał Tirenders. Wszystkie kwoty brutto (z VAT).
export default function PriceTable({ lang }: { lang: "pl" | "en" }) {
  const [a, b] = GROUP_DISCOUNTS;
  return (
    <div>
      <div className="table-scroll">
        <table className="price-table">
          <thead>
            <tr>
              <th scope="col">{lang === "pl" ? "Symulator" : "Rig"}</th>
              {BOOKING.durations.map((d) => (
                <th scope="col" key={d}>
                  {d} min
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SIMULATORS.map((s) => (
              <tr key={s.id}>
                <td>
                  {s.name}
                  {s.status !== "ACTIVE" && <small>{lang === "pl" ? "Wkrótce" : "Coming soon"}</small>}
                </td>
                {BOOKING.durations.map((d) => (
                  <td key={d}>{PRICES[s.priceGroup][d]} zł</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="price-note">
        {lang === "pl"
          ? `Wszystkie ceny brutto (z VAT), za jedno stanowisko. Rękawiczki w cenie. Rabat grupowy: ${a.min}+ stanowiska o tej samej godzinie −${a.percent}%, ${b.min}+ −${b.percent}%, cały salon −${WHOLE_SALON_PERCENT}%.`
          : `All prices include VAT, per rig. Gloves included. Group discount: ${a.min}+ rigs at the same time −${a.percent}%, ${b.min}+ −${b.percent}%, the whole venue −${WHOLE_SALON_PERCENT}%.`}
      </p>
    </div>
  );
}
