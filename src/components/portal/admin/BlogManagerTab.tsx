import { useCallback, useEffect, useRef, useState, DragEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, FileText, Globe, Image, Pencil, Trash2 } from "lucide-react";
import { usePortalAuth } from "@/components/portal/PortalAuthProvider";
import { getPortalHeaders } from "@/lib/portal-api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  imageUrl: string | null;
  category: string | null;
  readingTime: number | null;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

type DraftPost = {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  category: string;
  readingTime: string;
};

const emptyDraft = (): DraftPost => ({
  title: "", slug: "", excerpt: "", body: "", category: "", readingTime: "",
});

const toSlug = (title: string) =>
  title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "–" : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

// ── Main component ────────────────────────────────────────────────────────────

const BlogManagerTab = () => {
  const { user } = usePortalAuth();

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit/create state — null = list view
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [draft, setDraft] = useState<DraftPost>(emptyDraft());
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [dragOver, setDragOver] = useState(false);

  // Operation state
  const [saving, setSaving] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BlogPost | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // ── API helpers ────────────────────────────────────────────────────────────

  const authFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      if (!user?.email) throw new Error("Not authenticated");
      const headers = await getPortalHeaders(user.email);
      const resp = await fetch(url, { ...options, headers: { ...headers, ...(options.headers ?? {}) } });
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `Request failed (${resp.status})`);
      }
      return resp.json();
    },
    [user?.email],
  );

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await authFetch("/api/admin/portal/blog");
      setPosts(Array.isArray(data) ? data : []);
    } catch {
      // non-fatal
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => { void loadPosts(); }, [loadPosts]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditing(null);
    setIsNew(true);
    setDraft(emptyDraft());
    setImageFile(null);
    setImagePreview(null);
    setError(""); setNotice("");
  };

  const openEdit = (post: BlogPost) => {
    setEditing(post);
    setIsNew(false);
    setDraft({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt ?? "",
      body: post.body,
      category: post.category ?? "",
      readingTime: post.readingTime != null ? String(post.readingTime) : "",
    });
    setImageFile(null);
    setImagePreview(post.imageUrl ?? null);
    setError(""); setNotice("");
  };

  const backToList = () => {
    setEditing(null);
    setIsNew(false);
    setImageFile(null);
    setImagePreview(null);
    setError(""); setNotice("");
  };

  const handleTitleChange = (title: string) => {
    setDraft((prev) => ({
      ...prev,
      title,
      slug: isNew || !editing ? toSlug(title) : prev.slug,
    }));
  };

  const applyImageFile = (file: File) => {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) applyImageFile(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setError("Only JPEG, PNG, WebP or GIF images are allowed.");
      return;
    }
    applyImageFile(file);
  };

  const uploadImage = async (postId: string, headers: Record<string, string>) => {
    if (!imageFile) return;
    const formData = new FormData();
    formData.append("image", imageFile);
    const resp = await fetch(`/api/admin/portal/blog/${postId}/image`, {
      method: "POST",
      headers, // no Content-Type — FormData sets it automatically
      body: formData,
    });
    if (!resp.ok) throw new Error("Image upload failed");
  };

  const save = async () => {
    if (!draft.title.trim()) { setError("Title is required."); return; }
    if (!draft.body.trim()) { setError("Article body is required."); return; }
    setSaving(true); setError(""); setNotice("");
    try {
      if (!user?.email) throw new Error("Not authenticated");
      const headers = await getPortalHeaders(user.email);

      const payload: Record<string, unknown> = {
        title:       draft.title.trim(),
        slug:        draft.slug.trim() || toSlug(draft.title),
        body:        draft.body,
        excerpt:     draft.excerpt.trim() || undefined,
        category:    draft.category.trim() || undefined,
        readingTime: draft.readingTime ? parseInt(draft.readingTime, 10) : undefined,
      };

      let postId: string;

      if (isNew) {
        const created = await authFetch("/api/admin/portal/blog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        postId = (created as BlogPost).id;
        setIsNew(false);
        setEditing(created as BlogPost);
      } else {
        const updated = await authFetch(`/api/admin/portal/blog/${editing!.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        postId = (updated as BlogPost).id;
        setEditing(updated as BlogPost);
      }

      if (imageFile) await uploadImage(postId, headers);

      setNotice("Post saved.");
      void loadPosts();
    } catch (err) { setError(err instanceof Error ? err.message : "Save failed"); }
    finally { setSaving(false); }
  };

  const togglePublish = async (post: BlogPost) => {
    setPublishingId(post.id); setError(""); setNotice("");
    try {
      const updated = await authFetch(`/api/admin/portal/blog/${post.id}/publish`, { method: "POST" });
      const u = updated as BlogPost;
      setNotice(u.published ? "Post published." : "Post unpublished.");
      if (editing?.id === post.id) setEditing(u);
      void loadPosts();
    } catch (err) { setError(err instanceof Error ? err.message : "Publish toggle failed"); }
    finally { setPublishingId(null); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await authFetch(`/api/admin/portal/blog/${deleteTarget.id}`, { method: "DELETE" });
      setNotice("Post deleted.");
      if (editing?.id === deleteTarget.id) backToList();
      void loadPosts();
    } catch (err) { setError(err instanceof Error ? err.message : "Delete failed"); }
    finally { setDeleteTarget(null); }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const isEditorView = isNew || editing !== null;

  return (
    <div className="space-y-5">
      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {notice && <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</p>}

      {/* ── LIST VIEW ─────────────────────────────────────────────────────── */}
      {!isEditorView && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle className="text-xl font-bold">Blog Posts</CardTitle>
              <p className="text-sm text-muted-foreground">Manage published and draft articles.</p>
            </div>
            <Button variant="primary" onClick={openCreate}>+ New Post</Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading && <p className="text-sm text-muted-foreground">Loading posts…</p>}
            {!loading && posts.length === 0 && (
              <div className="rounded-xl border border-dashed border-border py-12 text-center">
                <FileText className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
                <p className="font-semibold text-foreground">No posts yet</p>
                <p className="mt-1 text-sm text-muted-foreground">Click "+ New Post" to write your first article.</p>
              </div>
            )}
            {posts.map((post) => (
              <div key={post.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-background px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-foreground">{post.title}</p>
                    <Badge variant={post.published ? "default" : "secondary"}>
                      {post.published ? "Published" : "Draft"}
                    </Badge>
                    {post.category && (
                      <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">{post.category}</span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {post.published && post.publishedAt ? `Published ${formatDate(post.publishedAt)}` : `Created ${formatDate(post.createdAt)}`}
                    {" · "}/blog/{post.slug}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant={post.published ? "secondary" : "primary"}
                    disabled={publishingId === post.id}
                    onClick={() => void togglePublish(post)}
                  >
                    <Globe className="mr-1 h-3.5 w-3.5" />
                    {post.published ? "Unpublish" : "Publish"}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => openEdit(post)}>
                    <Pencil className="mr-1 h-3.5 w-3.5" />Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(post)} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── EDITOR VIEW ───────────────────────────────────────────────────── */}
      {isEditorView && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <button
                type="button"
                onClick={backToList}
                className="mb-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to list
              </button>
              <CardTitle className="text-xl font-bold">{isNew ? "New Post" : "Edit Post"}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {!isNew && editing && (
                <Button
                  variant={editing.published ? "secondary" : "primary"}
                  disabled={publishingId === editing.id || saving}
                  onClick={() => void togglePublish(editing)}
                >
                  <Globe className="mr-1.5 h-4 w-4" />
                  {editing.published ? "Unpublish" : "Publish"}
                </Button>
              )}
              <Button variant="primary" disabled={saving} onClick={() => void save()}>
                {saving ? "Saving…" : "Save"}
              </Button>
              {!isNew && editing && (
                <Button
                  variant="ghost"
                  disabled={saving}
                  onClick={() => setDeleteTarget(editing)}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Title *</label>
              <input
                type="text"
                value={draft.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Article title"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-primary focus:ring-offset-2"
              />
            </div>

            {/* Slug */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Slug</label>
              <input
                type="text"
                value={draft.slug}
                onChange={(e) => setDraft((p) => ({ ...p, slug: e.target.value }))}
                placeholder="url-friendly-slug"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm outline-none ring-offset-background focus:ring-2 focus:ring-primary focus:ring-offset-2"
              />
              <p className="text-xs text-muted-foreground">URL: /blog/{draft.slug || "(auto)"}</p>
            </div>

            {/* Excerpt */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Excerpt</label>
              <textarea
                value={draft.excerpt}
                onChange={(e) => setDraft((p) => ({ ...p, excerpt: e.target.value }))}
                rows={2}
                placeholder="Short description shown in the blog listing…"
                className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-primary focus:ring-offset-2"
              />
            </div>

            {/* Body */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Article body (Markdown) *</label>
              <textarea
                value={draft.body}
                onChange={(e) => setDraft((p) => ({ ...p, body: e.target.value }))}
                rows={20}
                placeholder={"## Section heading\n\nParagraph text…\n\n## Another section\n\nMore text…"}
                className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs leading-relaxed outline-none ring-offset-background focus:ring-2 focus:ring-primary focus:ring-offset-2"
              />
              <p className="text-xs text-muted-foreground">Supports Markdown: ## headings, **bold**, - lists, etc.</p>
            </div>

            {/* Category + Reading time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Category</label>
                <input
                  type="text"
                  value={draft.category}
                  onChange={(e) => setDraft((p) => ({ ...p, category: e.target.value }))}
                  placeholder="e.g. Ad Strategy"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-primary focus:ring-offset-2"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Reading time (minutes)</label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={draft.readingTime}
                  onChange={(e) => setDraft((p) => ({ ...p, readingTime: e.target.value }))}
                  placeholder="e.g. 5"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-primary focus:ring-offset-2"
                />
              </div>
            </div>

            {/* Cover image */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Cover image</label>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => imageInputRef.current?.click()}
                className={`relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-colors ${
                  dragOver
                    ? "border-primary bg-primary/5"
                    : imagePreview
                    ? "border-border bg-background"
                    : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50"
                }`}
                style={{ minHeight: imagePreview ? undefined : "10rem" }}
              >
                {imagePreview ? (
                  <>
                    <img
                      src={imagePreview}
                      alt="Cover preview"
                      className="h-48 w-full rounded-xl object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                      <p className="text-sm font-medium text-white">Click or drag to replace</p>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-1 py-8 text-center">
                    <Image className="h-8 w-8 text-muted-foreground/50" />
                    <p className="text-sm font-medium text-foreground">Drag & drop an image here</p>
                    <p className="text-xs text-muted-foreground">or click to browse — JPEG, PNG, WebP, GIF · max 5 MB</p>
                  </div>
                )}
              </div>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleImageChange}
              />
              {imageFile && (
                <p className="text-xs text-muted-foreground">{imageFile.name} selected — will be saved with the post.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── DELETE CONFIRMATION ───────────────────────────────────────────── */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.title}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the article. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmDelete()}>Delete Post</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BlogManagerTab;
