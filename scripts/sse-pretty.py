import sys, json
for line in sys.stdin:
    if not line.startswith("data:"):
        continue
    try:
        e = json.loads(line[5:])
    except Exception:
        continue
    t = e.get("type")
    if t == "card":
        c = e["card"]
        txt = json.dumps((c.get("text") or "")[:74])
        print("  {:9} {:9} src={:12} err={:10} {}".format(
            c["id"], c["status"], str(c.get("source")), str(c.get("llmError")), txt))
    elif t == "transcript":
        tr = e["transcript"]
        print("  TRANSCRIPT verbatim = " + json.dumps(tr["verbatim"][:66]))
        print("             clean    = " + json.dumps((tr.get("clean") or "")[:66]))
        lo = [w for w in tr.get("words", []) if w["confidence"] < 0.7]
        print("             words={} lowConf={} conf={:.3f}".format(
            len(tr.get("words", [])), len(lo), tr.get("confidence", 0)))
    elif t == "done":
        print("  DONE ok={} degraded={} failed={} totalMs={} variance={}".format(
            e["ok"], e["degraded"], e["failed"], e["totalMs"], e["transcriptVariance"]))
    elif t == "error":
        print("  ERROR {} {}".format(e.get("code"), e.get("message")))
