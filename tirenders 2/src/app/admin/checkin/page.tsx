import { redirect } from "next/navigation";
import CheckIn from "@/components/admin/CheckIn";
import { staffUser } from "@/lib/auth";

export default async function Page() {
  if (!(await staffUser("checkin"))) redirect("/admin");
  return (
    <>
      <h1>Check-in</h1>
      <CheckIn />
    </>
  );
}
