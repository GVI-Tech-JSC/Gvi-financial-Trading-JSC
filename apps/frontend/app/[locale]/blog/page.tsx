"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";

interface BlogPost {
  id: string; slug: string; title: string; excerpt: string;
  category: string; tags: string[]; status: string;
  createdAt: string; author?: { firstName: string; lastName: string };
}

const CATEGORIES = ["All","Market Analysis","Tutorials","News","DeFi","Trading Tips"];

export default function BlogPage() {
  const params  = useParams();
  const locale  = (params?.locale as string) ?? "vi";
  const [posts, setPosts]     = useState<BlogPost[]>([]);
  const [cat, setCat]         = useState("All");
  const [search, setSearch]   = useState("");

  useEffect(() => {
    api.get("/blog/posts", { params: { status:"published", limit:20 } })
      .then(r => setPosts(r.data?.data ?? []))
      .catch(() => {});
  }, []);

  const filtered = posts.filter(p =>
    (cat === "All" || p.category === cat) &&
    (p.title.toLowerCase().includes(search.toLowerCase()) || p.excerpt?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#0d1117] text-white p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Blog & Insights</h1>
          <p className="text-[#8b949e] mt-1">Market analysis, trading guides and crypto news</p>
        </div>

        {/* Search */}
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search articles…"
          className="w-full bg-[#161b22] border border-[#30363d] rounded-xl px-4 py-3 text-sm placeholder-[#484f58] focus:outline-none focus:border-[#3b82f6] mb-4" />

        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className={`px-4 py-1.5 rounded-full text-sm transition-colors ${cat===c ? "bg-[#3b82f6] text-white" : "bg-[#161b22] border border-[#30363d] text-[#8b949e] hover:text-white"}`}>
              {c}
            </button>
          ))}
        </div>

        {/* Posts grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-[#8b949e]">No articles found</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(post => (
              <Link key={post.id} href={`/${locale}/blog/${post.slug}`}
                className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 hover:border-[#484f58] transition-colors block">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs bg-[#3b82f6]/20 text-[#3b82f6] px-2 py-0.5 rounded-full">{post.category || "General"}</span>
                  <span className="text-xs text-[#484f58]">{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
                <h2 className="font-semibold text-sm leading-snug mb-2 line-clamp-2">{post.title}</h2>
                <p className="text-xs text-[#8b949e] line-clamp-3">{post.excerpt}</p>
                {post.author && (
                  <div className="mt-3 text-xs text-[#484f58]">
                    by {post.author.firstName} {post.author.lastName}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
