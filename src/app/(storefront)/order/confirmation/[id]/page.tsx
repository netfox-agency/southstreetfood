import { getOrderById } from "@/lib/queries/orders";
import { notFound } from "next/navigation";
import { ConfirmationClient } from "./confirmation-client";

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrderById(id);

  if (!order) notFound();

  return <ConfirmationClient order={order} />;
}
