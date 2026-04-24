import { redirect } from "next/navigation";

// Ancien chemin deprecie : "Ingredients" est maintenant integre a
// la page complete "Gestion stock" (articles + extras + ingredients).
export default function IngredientsRedirect() {
  redirect("/admin/stock");
}
