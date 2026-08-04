"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";

interface Course {
  id: string; slug: string; title: string; description: string;
  level: "beginner"|"intermediate"|"advanced"; category: string;
  lessonsCount: number; duration: number; status: string;
}

const LEVELS = ["All","beginner","intermediate","advanced"];

export default function LearnPage() {
  const params = useParams();
  const locale = (params?.locale as string) ?? "vi";
  const [courses, setCourses] = useState<Course[]>([]);
  const [level, setLevel] = useState("All");

  useEffect(() => {
    api.get("/learn/courses", { params: { status:"published" } })
      .then(r => setCourses(r.data?.data ?? []))
      .catch(() => {});
  }, []);

  const filtered = courses.filter(c => level === "All" || c.level === level);
  const levelColor: Record<string,string> = {
    beginner:"text-green-400 bg-green-900/30",
    intermediate:"text-yellow-400 bg-yellow-900/30",
    advanced:"text-red-400 bg-red-900/30",
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Learn to Trade</h1>
          <p className="text-[#8b949e] mt-1">Free trading courses from beginner to advanced</p>
        </div>

        <div className="flex gap-2 mb-6">
          {LEVELS.map(l => (
            <button key={l} onClick={() => setLevel(l)}
              className={`px-4 py-1.5 rounded-full text-sm capitalize transition-colors ${level===l ? "bg-[#3b82f6] text-white" : "bg-[#161b22] border border-[#30363d] text-[#8b949e] hover:text-white"}`}>
              {l}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-[#8b949e]">No courses found</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(c => (
              <Link key={c.id} href={`/${locale}/learn/${c.slug}`}
                className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 hover:border-[#484f58] transition-colors block">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${levelColor[c.level] ?? "text-[#8b949e] bg-[#21262d]"}`}>{c.level}</span>
                  <span className="text-xs text-[#484f58]">{c.category}</span>
                </div>
                <h2 className="font-semibold mb-2">{c.title}</h2>
                <p className="text-xs text-[#8b949e] line-clamp-2">{c.description}</p>
                <div className="flex items-center gap-4 mt-4 text-xs text-[#484f58]">
                  <span>{c.lessonsCount ?? 0} lessons</span>
                  {c.duration && <span>{Math.round(c.duration / 60)} min</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
