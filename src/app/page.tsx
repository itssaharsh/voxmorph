import { CommandCenter } from "@/components/CommandCenter";
import { demoSeed } from "@/state/demoSeed";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  // ?stream=0 is the back-pocket kill switch: a URL param, not an env var, so it
  // needs no redeploy if streaming ever misbehaves right before a demo.
  const forceJson = sp.stream === "0";
  // ?fresh=1 opens on the empty state instead of the saved example.
  const seed = sp.fresh === "1" ? undefined : demoSeed;
  return <CommandCenter seed={seed} forceJson={forceJson} />;
}
