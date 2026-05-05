"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Calendar, User, Clock, Share2 } from "lucide-react";
import { BlogPost } from "@/types";

export default function BlogDetailClient({ slug }: { slug: string }) {
  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { html: processedContent, bottomImage } = useMemo(() => {
    const fallback = { html: blog?.content || "", bottomImage: null as string | null };
    if (!blog?.content) return fallback;

    const normalize = (u?: string | null) => {
      if (!u) return "";
      try {
        return new URL(u, typeof window !== "undefined" ? window.location.href : "https://sobhagya.in")
          .pathname.split("/").pop() || u;
      } catch {
        return u;
      }
    };
    const heroKey = normalize(blog.image);

    if (typeof window === "undefined" || typeof DOMParser === "undefined") {
      // SSR fallback — drop all images
      const noImagesHtml = blog.content.replace(/<img[^>]*>/gi, "");
      return { html: noImagesHtml, bottomImage: null };
    }

    try {
      const doc = new DOMParser().parseFromString(
        `<div id="__root">${blog.content}</div>`,
        "text/html"
      );
      const root = doc.getElementById("__root");
      if (!root) return fallback;

      let extractedBottom: string | null = null;

      root.querySelectorAll("img").forEach((img) => {
        const src = img.getAttribute("src") || "";
        
        // Save the first non-hero image to use at the bottom
        if (!extractedBottom && normalize(src) !== heroKey) {
          extractedBottom = src;
        }

        let target: Element = img;
        const parent = img.parentElement;
        if (
          parent &&
          (parent.tagName === "FIGURE" || parent.tagName === "P") &&
          parent.querySelectorAll("img").length === 1 &&
          parent.textContent?.trim() === ""
        ) {
          target = parent;
        }
        target.remove();
      });

      return { html: root.innerHTML, bottomImage: extractedBottom };
    } catch {
      return fallback;
    }
  }, [blog?.content, blog?.image]);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/blog/wp?slug=${slug}`);
        const data = await res.json();
        
        if (data.success && data.data) {
          setBlog(data.data);
        } else {
          setError("Blog not found. It might have been removed.");
        }
      } catch (err) {
        console.error("Error fetching blog:", err);
        setError("Failed to load the article. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchBlog();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50/60 via-white to-amber-50/30 pt-8 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="animate-pulse flex flex-col gap-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-12 bg-gray-200 rounded w-3/4"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            <div className="h-[400px] bg-gray-200 rounded-2xl w-full my-6"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50/60 via-white to-amber-50/30 pt-16 pb-20 flex flex-col items-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Oops!</h1>
        <p className="text-gray-600 mb-8">{error || "Blog not found"}</p>
        <Link 
          href="/blog"
          className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Blogs
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/30 pb-20 pt-6 sm:pt-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Article Header */}
        <header className="mb-10 text-center sm:text-left">
          {blog.tags && blog.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start mb-4">
              {blog.tags.map(tag => (
                <span key={tag} className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full uppercase tracking-wider">
                  {tag}
                </span>
              ))}
            </div>
          )}
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight" dangerouslySetInnerHTML={{ __html: blog.title }}></h1>
          
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 sm:gap-6 text-gray-500 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-orange-200 flex items-center justify-center overflow-hidden">
                {blog.authorImage ? (
                  <img src={blog.authorImage} alt={blog.author} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4 text-orange-600" />
                )}
              </div>
              <span className="font-medium text-gray-700">{blog.author}</span>
            </div>
            
            <div className="flex items-center gap-1.5 opacity-80">
              <Calendar className="w-4 h-4" />
              <span>{blog.date}</span>
            </div>
            
            <div className="flex items-center gap-1.5 opacity-80">
              <Clock className="w-4 h-4" />
              <span>{blog.readTime}</span>
            </div>
            
            <button 
              className="ml-auto flex items-center gap-1.5 text-gray-600 hover:text-orange-600 transition-colors"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: blog.title,
                    text: blog.excerpt,
                    url: window.location.href,
                  });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert("Link copied to clipboard!");
                }
              }}
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>
        </header>

        {/* Featured Image */}
        {blog.image && (
          <div className="relative w-full aspect-[16/9] md:aspect-[2/1] rounded-2xl overflow-hidden mb-12 shadow-md">
            <Image 
              src={blog.image} 
              alt={blog.title} 
              fill 
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 800px"
            />
          </div>
        )}

        {/* Article Content */}
        <article className="prose prose-lg prose-orange max-w-none bg-white p-6 sm:p-10 rounded-2xl shadow-sm border border-gray-100">
          <div
            dangerouslySetInnerHTML={{ __html: processedContent }}
            className="wp-content"
          />
        </article>

        {/* Bottom Image */}
        {(bottomImage || blog.image) && (
          <div className="relative w-full aspect-[16/9] md:aspect-[2/1] rounded-2xl overflow-hidden mt-8 shadow-md">
            <Image 
              src={bottomImage || blog.image!} 
              alt={`${blog.title} - ending`} 
              fill 
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 800px"
            />
          </div>
        )}
      </div>

      <style jsx global>{`
        .wp-content {
          color: #374151;
          line-height: 1.8;
        }
        .wp-content p {
          margin-bottom: 1.5em;
        }
        .wp-content h2, .wp-content h3, .wp-content h4 {
          color: #111827;
          font-weight: 700;
          margin-top: 2em;
          margin-bottom: 1em;
        }
        .wp-content img {
          border-radius: 0.75rem;
          margin: 2em auto;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          max-width: 100%;
          height: auto;
        }
        .wp-content a {
          color: #ea580c;
          text-decoration: underline;
          text-underline-offset: 4px;
        }
        .wp-content ul, .wp-content ol {
          margin-bottom: 1.5em;
          padding-left: 1.5em;
        }
        .wp-content li {
          margin-bottom: 0.5em;
        }
        .wp-content blockquote {
          border-left: 4px solid #f97316;
          padding-left: 1rem;
          margin-left: 0;
          font-style: italic;
          color: #4b5563;
          background: #fff7ed;
          padding: 1rem;
          border-radius: 0 0.5rem 0.5rem 0;
        }
      `}</style>
    </div>
  );
}
