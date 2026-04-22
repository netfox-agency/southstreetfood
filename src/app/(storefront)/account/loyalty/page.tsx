import { redirect } from "next/navigation";

// Ancien chemin deprecie, on canonicalise sur /fidelite
export default function LoyaltyRedirect() {
  redirect("/fidelite");
}
