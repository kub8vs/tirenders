import { BOOKING, PRICES, SIMULATORS, type PriceGroup } from "@/config/site";

const GROUP_LABEL: Record<PriceGroup, { pl: [string, string]; en: [string, string] }> = {
  STANDARD: { pl: ["Karoseria", "BMW M4 F82 · Nissan 370Z"], en: ["Car body", "BMW M4 F82 · Nissan 370Z"] },
  GT3: { pl: ["GT3 Cockpit", "Kokpit wyścigowy"], en: ["GT3 Cockpit", "Race cockpit"] },
  MOTION5: { pl: ["Motion 5DOF", "2 platformy ruchu"], en: ["Motion 5DOF", "2 motion rigs"] },
  MOTION6: { pl: ["Motion 6DOF", "Pełne 6 stopni swobody"], en: ["Motion 6DOF", "Full 6 degrees of freedom"] },
};

export default function PriceTable({ lang }: { lang: "pl" | "en" }) {
  const groups = (Object.keys(PRICES) as PriceGroup[]).filter((g) => SIMULATORS.some((s) => s.priceGroup === g));
  return (
    <div className="table-scroll">
      <table className="price-table">
        <thead>
          <tr>
            <th scope="col">{lang === "pl" ? "Stanowisko" : "Rig"}</th>
            {BOOKING.durations.map((d) => (
              <th scope="col" key={d}>
                {d} min
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => (
            <tr key={g}>
              <td>
                {GROUP_LABEL[g][lang][0]}
                <small>{GROUP_LABEL[g][lang][1]}</small>
              </td>
              {BOOKING.durations.map((d) => (
                <td key={d}>{PRICES[g][d]} zł</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
