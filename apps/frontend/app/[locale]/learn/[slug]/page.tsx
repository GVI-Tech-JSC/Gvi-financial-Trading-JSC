"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";

interface Lesson { id: string; title: string; content: string; order: number; duration: number; }
interface Course { id: string; title: string; description: string; level: string; lessons: Lesson[]; }

export default function CoursePage() {
  const params    = useParams();
  const locale    = (params?.locale as string) ?? "vi";
  const slug      = params?.slug as string;
  const [course, setCourse]     = useState<Course | null>(null);
  const [activeLesson, setActive] = useState<Lesson | null>(null);

  useEffect(() => {
    api.get(`/learn/courses/${slug}`)
      .then(r => { const c = r.data?.data ?? null; setCourse(c); setActive(c?.lessons?.[0] ?? null); })
      .catch(() => {});
  }, [slug]);

  if (!course) return (
    <div className="min-h-screen bg-[#0d1117] text-white flex items-center justify-center">
      <div className="text-[#8b949e]">Loading…</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0d1117] text-white">
      <div className="max-w-6xl mx-auto p-6">
        <Link href={`/${locale}/learn`} className="text-[#8b949e] hover:text-white text-sm mb-4 block">← Back to Courses</Link>
        <h1 className="text-2xl font-bold mb-6">{course.title}</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lessons list */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 h-fit">
            <div className="text-sm font-semibold mb-3 text-[#8b949e]">{course.lessons?.length ?? 0} Lessons</div>
            <div className="space-y-1">
              {course.lessons?.map((l, i) => (
                <button key={l.id} onClick={() => setActive(l)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeLesson?.id===l.id ? "bg-[#3b82f6]/20 text-[#3b82f6]" : "text-[#c9d1d9] hover:bg-[#21262d]"}`}>
                  <span className="text-[#484f58] mr-2">{i+1}.</span>{l.title}
                  {l.duration && <span className="float-right text-xs text-[#484f58]">{l.duration}m</span>}
                </button>
              ))}
            </div>
          </div>
          {/* Lesson content */}
          <div className="lg:col-span-2 bg-[#161b22] border border-[#30363d] rounded-xl p-6">
            {activeLesson ? (
              <>
                <h2 className="text-xl font-semibold mb-4">{activeLesson.title}</h2>
                <div className="text-[#c9d1d9] text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: activeLesson.content?.replace(/\n/g,"<br/>") ?? "" }} />
              </>
            ) : (
              <div className="text-center text-[#8b949e] py-12">Select a lesson to begin</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
