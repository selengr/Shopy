import callApi from "@/helpers/callApi";
import type { WaitlistEntry } from "@/models/waitlist";

export async function JoinProductWaitlist(
  productId: number,
  values: { customerName: string; customerPhone: string },
) {
  const res = await callApi().post(`/shop/products/${productId}/waitlist`, values);
  return res.data?.entry as WaitlistEntry;
}

export async function GetWaitlist() {
  const res = await callApi().get("/waitlist");
  return (res.data?.waitlist ?? []) as WaitlistEntry[];
}

export async function MarkWaitlistDone(id: number) {
  const res = await callApi().post(`/waitlist/${id}/done`);
  return res.data?.entry as WaitlistEntry;
}
