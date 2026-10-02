import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Users, Clock, TrendingUp } from "lucide-react";
import Layout from "@/components/Layout";

type PanditStatus = "online" | "busy" | "offline";

const AdminPanel = () => {
  const [status, setStatus] = useState<PanditStatus>(
    () => (localStorage.getItem("pandit_status") as PanditStatus) || "offline"
  );
  const [sessions, setSessions] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, today: 0, revenue: 0 });

  useEffect(() => {
    localStorage.setItem("pandit_status", status);
    window.dispatchEvent(new CustomEvent("pandit-status-change", { detail: status }));
  }, [status]);

  useEffect(() => {
    const stored = localStorage.getItem("call_sessions");
    if (stored) {
      const data = JSON.parse(stored);
      setSessions(data);
      setStats({
        total: data.length,
        today: data.filter((s: any) => new Date(s.startTime).toDateString() === new Date().toDateString()).length,
        revenue: data.reduce((sum: number, s: any) => sum + (s.amount || 551), 0),
      });
    }
  }, []);

  const statusConfig = {
    online: { label: "Online", dot: "bg-green-500", text: "text-green-300", border: "border-green-400/50", bg: "bg-green-500/20", desc: "🟢 Users connect immediately." },
    busy: { label: "Busy", dot: "bg-orange-500", text: "text-orange-300", border: "border-orange-400/50", bg: "bg-orange-500/20", desc: "🟡 Users hear IVR waiting message." },
    offline: { label: "Offline", dot: "bg-gray-500", text: "text-gray-300", border: "border-gray-400/50", bg: "bg-gray-500/20", desc: "⚫ Users are shown offline message." },
  };
  const cfg = statusConfig[status];

  return (
    <Layout>
      <div className="p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">🔱 Admin Panel</h1>
          <p className="text-gray-400 text-sm mt-1">My Astro Sutra — Consultation Management</p>
        </div>

        {/* Status Control */}
        <Card className="bg-[hsl(16_32%_9%)] border-orange-500/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Phone className="w-5 h-5 text-amber-300" /> Pandit Ji Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${cfg.border} ${cfg.bg}`}>
              <div className={`w-3 h-3 rounded-full ${cfg.dot} ${status === "online" ? "animate-pulse" : ""}`} />
              <span className={`font-semibold ${cfg.text}`}>{cfg.label}</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {(["online", "busy", "offline"] as PanditStatus[]).map((s) => {
                const c = statusConfig[s];
                return (
                  <Button key={s} onClick={() => setStatus(s)} variant="outline"
                    className={`border-2 font-semibold capitalize h-12 ${status === s ? `${c.border} ${c.bg} ${c.text}` : "border-white/10 text-gray-400 hover:border-white/30"}`}>
                    <div className={`w-2.5 h-2.5 rounded-full ${c.dot} mr-2`} />
                    {s}
                  </Button>
                );
              })}
            </div>

            <p className="text-sm text-gray-400 bg-white/5 rounded-lg p-3 border border-white/10">{cfg.desc}</p>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Users, label: "Total Sessions", value: stats.total, color: "text-teal-300" },
            { icon: Clock, label: "Today", value: stats.today, color: "text-green-300" },
            { icon: TrendingUp, label: "Revenue", value: `₹${stats.revenue}`, color: "text-amber-300" },
          ].map((s) => (
            <Card key={s.label} className="bg-[hsl(16_32%_9%)] border-white/10">
              <CardContent className="p-4 flex items-center gap-3">
                <s.icon className={`w-8 h-8 ${s.color}`} />
                <div>
                  <p className="text-2xl font-bold text-white">{s.value}</p>
                  <p className="text-xs text-gray-400">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Sessions */}
        <Card className="bg-[hsl(16_32%_9%)] border-white/10">
          <CardHeader><CardTitle className="text-white text-base">Recent Sessions</CardTitle></CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-6">No sessions yet.</p>
            ) : (
              <div className="space-y-2">
                {sessions.slice(-10).reverse().map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                    <div>
                      <p className="text-sm text-white font-medium">{s.sessionId}</p>
                      <p className="text-xs text-gray-400">{new Date(s.startTime).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <Badge className={s.status === "completed" ? "bg-green-500/20 text-green-300 border-green-400/30" : "bg-yellow-500/20 text-yellow-300"}>
                        {s.status}
                      </Badge>
                      <p className="text-xs text-gray-400 mt-1">₹{s.amount || 551}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </div>
    </Layout>
  );
};

export default AdminPanel;
