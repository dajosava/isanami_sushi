import { AnaliticaDashboard } from "./components/AnaliticaDashboard";
import { requireRolAnalitica } from "@/lib/auth/usuario";

export default async function AnaliticaPage() {
  await requireRolAnalitica();
  return <AnaliticaDashboard />;
}
