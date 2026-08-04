"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";

interface BlogPost {
  id: string; slug: string; title: string; content: string;
  category: string; tags: string[]; createdAt: string;
  author?: { firstName: string; lastName: string };
}

export default function BlogPostPage() {
  const params = useParams();
  const locale = (params?.locale as string) ?? "vi";
  const slug   = params?.slug as string;
  const [post, setPost] = useState<BlogPost | null>(null);
  const [err, setErr]   = useState(false);

  useEffect(() => {
    api.get(`/blog/posts/${slug}`)
      .then(r => setPost(r.data?.data ?? null))
      .catch(() => setErr(true));
  }, [slug]);

  if (err) return (
    <div className="min-h-screen bg-[#0d1117] text-white flex items-center justify-center">
      <div className="text-center"><div className="text-4xl mb-3">📭</div><div>Article not found</div>
        <Link href={`/${locale}/blog`} className="text-[#3b82f6] text-sm mt-2 block">← Back to Blog</Link>
      </div>
    </div>
  );

  if (!post) return (
    <div className="min-h-screen bg-[#0d1117] text-white flex items-center justify-center">
      <div className="text-[#8b949e]">Loading…</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0d1117] text-white p-6">
      <div className="max-w-3xl mx-auto">
        <Link href={`/${locale}/blog`} className="text-[#8b949e] hover:text-white text-sm mb-6 block">← Back to Blog</Link>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs bg-[#3b82f6]/20 text-[#3b82f6] px-2 py-0.5 rounded-full">{post.category || "General"}</span>
          <span className="text-xs text-[#484f58]">{new Date(post.createdAt).toLocaleDateString()}</span>
          {post.author && <span className="text-xs text-[#484f58]">· by {post.author.firstName} {post.author.lastName}</span>}
        </div>
        <h1 className="text-3xl font-bold mb-6">{post.title}</h1>
        <div className="prose prose-invert max-w-none text-[#c9d1d9] leading-relaxed"
          dangerouslySetInnerHTML={{ __html: post.content?.replace(/\n/g,"<br/>") ?? "" }} />
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-[#30363d]">
            {post.tags.map(tag => <span key={tag} className="text-xs bg-[#21262d] px-2 py-1 rounded text-[#8b949e]">#{tag}</span>)}
          </div>
        )}
      </div>
    </div>
  );
}
