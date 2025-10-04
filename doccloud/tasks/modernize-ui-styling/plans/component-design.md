# Component Design Plan - UI Modernization

**Goal:** Transform QuokkaQ into a modern, professional application with proper glassmorphism, generous spacing, clear typography hierarchy, and visually appealing layouts.

**Approach:** Page-by-page component improvements with specific className changes and layout recommendations. All changes are purely visual/CSS - no functional changes.

---

## Design Principles

1. **Generous Spacing** - Increase padding, margins, and gaps throughout
2. **Glass Effects** - Proper use of QDS v2.0 glassmorphism tokens
3. **Typography Hierarchy** - Clear visual hierarchy with purposeful type scales
4. **Visual Depth** - Layered glass effects and proper elevation
5. **Interactive States** - Consistent hover, focus, active patterns
6. **Modern Layouts** - Hero sections, improved grids, better structure
7. **Helpful Empty States** - Visually appealing with clear CTAs
8. **Responsive Design** - Scale spacing and typography with breakpoints

---

## Page-by-Page Improvements

### 1. Navigation Header (`components/layout/nav-header.tsx`)

**Current Issues:**
- Basic background without glass effect
- Standard spacing
- Plain link styles
- Small user avatar

**Design Changes:**

**Before:**
```tsx
<header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
  <div className="container flex h-16 items-center justify-between px-4 md:px-8">
```

**After:**
```tsx
<header className="sticky top-0 z-50 w-full border-b border-border/40 glass-panel">
  <div className="container flex h-20 items-center justify-between px-6 md:px-8">
```

**Specific Changes:**
- Replace `bg-background/95 backdrop-blur` with `glass-panel` utility class
- Increase height: `h-16` → `h-20`
- Increase mobile padding: `px-4` → `px-6`
- Logo text sizes remain `text-2xl` (good)
- Navigation links: Add `text-base` for better readability
- User avatar: Increase from `h-10 w-10` → `h-11 w-11`
- Dropdown: Add `glass-panel` effect

**Component Structure:**
```tsx
<header className="sticky top-0 z-50 w-full border-b border-border/40 glass-panel">
  <div className="container flex h-20 items-center justify-between px-6 md:px-8">
    {/* Logo - unchanged */}
    <Link href="/courses" className="flex items-center space-x-2">
      <div className="flex items-center">
        <span className="text-2xl font-bold text-primary">Quokka</span>
        <span className="text-2xl font-bold text-accent">Q</span>
      </div>
    </Link>

    {/* Navigation - enhanced */}
    <nav className="hidden md:flex items-center space-x-8 text-base font-medium">
      <Link /* unchanged logic */ />
    </nav>

    {/* User Menu - enhanced */}
    <Button variant="ghost" className="relative h-11 w-11 rounded-full">
      <Avatar className="h-11 w-11 bg-primary/20">
        {/* ... */}
      </Avatar>
    </Button>
  </div>
</header>
```

---

### 2. Home/Loading Page (`app/page.tsx`)

**Current Issues:**
- Minimal styling
- Small text
- No visual appeal

**Design Changes:**

**Before:**
```tsx
<div className="min-h-screen flex items-center justify-center">
  <div className="text-center space-y-4">
    <h1 className="text-4xl font-bold text-primary glass-text">QuokkaQ</h1>
    <p className="text-muted-foreground">Loading...</p>
  </div>
</div>
```

**After:**
```tsx
<div className="min-h-screen flex items-center justify-center p-8">
  <Card variant="glass-strong" className="p-12 md:p-16 text-center space-y-6 max-w-md">
    <div className="space-y-4">
      <h1 className="text-5xl md:text-6xl font-bold text-primary glass-text">
        QuokkaQ
      </h1>
      <p className="text-lg text-muted-foreground">Loading your courses...</p>
    </div>
    <div className="flex justify-center">
      <div className="animate-pulse h-2 w-32 bg-primary/30 rounded-full" />
    </div>
  </Card>
</div>
```

**Specific Changes:**
- Add outer padding: `p-8`
- Wrap in `Card variant="glass-strong"` with `p-12 md:p-16`
- Max width constraint: `max-w-md`
- Increase title: `text-4xl` → `text-5xl md:text-6xl`
- Enhance loading text: Add `text-lg`
- Add loading indicator: Animated pulse bar

---

### 3. Courses Page (`app/courses/page.tsx`)

**Current Issues:**
- Cramped spacing
- Small header text
- Generic grid layout
- Plain empty state

**Design Changes:**

**Hero Section Enhancement:**

**Before:**
```tsx
<div className="max-w-6xl mx-auto space-y-8">
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-4xl font-bold text-primary glass-text">My Courses</h1>
      <p className="text-muted-foreground mt-2">Welcome back, {user?.name}!</p>
    </div>
  </div>
```

**After:**
```tsx
<div className="max-w-6xl mx-auto space-y-12">
  {/* Hero Section */}
  <div className="text-center md:text-left py-8 md:py-12 space-y-4">
    <div className="space-y-2">
      <h1 className="text-5xl md:text-6xl font-bold text-primary glass-text">
        My Courses
      </h1>
      <p className="text-lg md:text-xl text-muted-foreground">
        Welcome back, {user?.name}!
      </p>
    </div>
  </div>
```

**Grid Enhancement:**

**Before:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
```

**After:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
```

**Card Enhancement:**

**Before:**
```tsx
<Card variant="glass-hover" className="h-full transition-all duration-200">
  <CardHeader>
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <CardTitle className="text-xl">{course.code}</CardTitle>
        <CardDescription className="mt-1">{course.name}</CardDescription>
      </div>
    </div>
  </CardHeader>
  <CardContent>
    <p className="text-sm text-muted-foreground line-clamp-2">
      {course.description}
    </p>
```

**After:**
```tsx
<Card variant="glass-hover" className="h-full">
  <CardHeader className="space-y-3">
    <div className="flex items-start justify-between">
      <div className="flex-1 space-y-2">
        <CardTitle className="text-2xl font-bold">{course.code}</CardTitle>
        <CardDescription className="text-base">{course.name}</CardDescription>
      </div>
    </div>
  </CardHeader>
  <CardContent className="space-y-4">
    <p className="text-sm text-muted-foreground line-clamp-3">
      {course.description}
    </p>
```

**Empty State Enhancement:**

**Before:**
```tsx
<Card variant="glass" className="p-12 text-center">
  <p className="text-muted-foreground">
    No courses found. You're not enrolled in any courses yet.
  </p>
</Card>
```

**After:**
```tsx
<Card variant="glass" className="p-16 text-center space-y-6">
  <div className="flex justify-center">
    <BookOpen className="size-16 text-muted-foreground/50" />
  </div>
  <div className="space-y-2">
    <h3 className="text-xl font-semibold">No Courses Yet</h3>
    <p className="text-muted-foreground max-w-md mx-auto">
      You're not enrolled in any courses. Check back soon or contact your administrator.
    </p>
  </div>
</Card>
```

**Loading State Enhancement:**

**Before:**
```tsx
<Skeleton className="h-48" />
```

**After:**
```tsx
<Card variant="glass" className="p-8 space-y-4">
  <Skeleton className="h-8 w-3/4 bg-glass-medium" />
  <Skeleton className="h-4 w-full bg-glass-medium" />
  <Skeleton className="h-4 w-5/6 bg-glass-medium" />
  <div className="pt-4">
    <Skeleton className="h-4 w-32 bg-glass-medium" />
  </div>
</Card>
```

**Specific Changes:**
- Outer spacing: `space-y-8` → `space-y-12`
- Hero section: Add centered layout with `py-8 md:py-12`
- Title size: `text-4xl` → `text-5xl md:text-6xl`
- Subtitle size: Add `text-lg md:text-xl`
- Grid gap: `gap-6` → `gap-8`
- Card titles: `text-xl` → `text-2xl font-bold`
- Card descriptions: Add `text-base`
- Card internal spacing: Add `space-y-3` to header, `space-y-4` to content
- Empty state: Increase padding `p-12` → `p-16`, add icon, heading, better message
- Loading skeleton: Use glass backgrounds, match content structure

---

### 4. Course Detail Page (`app/courses/[courseId]/page.tsx`)

**Current Issues:**
- Cramped breadcrumb
- Small header
- Tight thread list spacing

**Design Changes:**

**Breadcrumb Enhancement:**

**Before:**
```tsx
<div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
```

**After:**
```tsx
<div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
```

**Hero Section Enhancement:**

**Before:**
```tsx
<div>
  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">...</div>
  <div className="flex items-start justify-between">
    <div>
      <h1 className="text-4xl font-bold text-primary glass-text">{course.name}</h1>
      <p className="text-muted-foreground mt-2">{course.description}</p>
      <div className="flex gap-4 mt-4 text-sm text-muted-foreground">...</div>
    </div>
    <Link href={`/ask?courseId=${courseId}`}>
      <Button variant="glass-primary">Ask Question</Button>
    </Link>
  </div>
</div>
```

**After:**
```tsx
<div className="space-y-6">
  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">...</div>
  <Card variant="glass-strong" className="p-8 md:p-10">
    <div className="flex items-start justify-between gap-6">
      <div className="flex-1 space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold text-primary glass-text">
          {course.name}
        </h1>
        <p className="text-base md:text-lg text-muted-foreground">
          {course.description}
        </p>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <span>{course.term}</span>
          <span>•</span>
          <span>{course.enrollmentCount} students</span>
        </div>
      </div>
      <Link href={`/ask?courseId=${courseId}`}>
        <Button variant="glass-primary" size="lg">Ask Question</Button>
      </Link>
    </div>
  </Card>
</div>
```

**Thread List Section:**

**Before:**
```tsx
<div>
  <h2 className="text-2xl font-semibold mb-4">Discussion Threads</h2>
  {threads && threads.length > 0 ? (
    <div className="space-y-4">
```

**After:**
```tsx
<div className="space-y-6">
  <h2 className="text-3xl font-bold">Discussion Threads</h2>
  {threads && threads.length > 0 ? (
    <div className="space-y-6">
```

**Thread Card Enhancement:**

**Before:**
```tsx
<Card variant="glass-hover" className="transition-all duration-200">
  <CardHeader>
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <CardTitle className="text-lg">{thread.title}</CardTitle>
        <CardDescription className="mt-2 line-clamp-2">
```

**After:**
```tsx
<Card variant="glass-hover">
  <CardHeader className="space-y-3">
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 space-y-2">
        <CardTitle className="text-xl md:text-2xl">{thread.title}</CardTitle>
        <CardDescription className="text-base line-clamp-2">
```

**Empty State Enhancement:**

**Before:**
```tsx
<Card variant="glass" className="p-12 text-center">
  <p className="text-muted-foreground">
    No threads yet. Be the first to ask a question!
  </p>
  <Link href={`/ask?courseId=${courseId}`}>
    <Button variant="glass-primary" className="mt-4">Ask Question</Button>
  </Link>
</Card>
```

**After:**
```tsx
<Card variant="glass" className="p-16 text-center space-y-6">
  <div className="flex justify-center">
    <MessageSquare className="size-16 text-muted-foreground/50" />
  </div>
  <div className="space-y-2">
    <h3 className="text-xl font-semibold">No Threads Yet</h3>
    <p className="text-muted-foreground max-w-md mx-auto">
      Be the first to start a discussion in this course!
    </p>
  </div>
  <Link href={`/ask?courseId=${courseId}`}>
    <Button variant="glass-primary" size="lg">Ask Question</Button>
  </Link>
</Card>
```

**Specific Changes:**
- Outer spacing: `space-y-8` → `space-y-12`
- Breadcrumb margin: `mb-4` → `mb-8`
- Hero: Wrap in `Card variant="glass-strong"` with `p-8 md:p-10`
- Title: `text-4xl` → `text-4xl md:text-5xl`
- Description: Add `text-base md:text-lg`
- Metadata gap: `gap-4` → `gap-6`
- Button: Add `size="lg"`
- Section heading: `text-2xl` → `text-3xl font-bold`
- Thread list spacing: `space-y-4` → `space-y-6`
- Thread card titles: `text-lg` → `text-xl md:text-2xl`
- Thread card descriptions: Add `text-base`
- Empty state: Add icon, heading, better spacing

---

### 5. Thread Detail Page (`app/threads/[threadId]/page.tsx`)

**Current Issues:**
- Small question card
- Cramped reply list
- Basic form styling

**Design Changes:**

**Question Card Enhancement:**

**Before:**
```tsx
<Card variant="glass-strong">
  <CardHeader>
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <CardTitle className="text-2xl">{thread.title}</CardTitle>
        <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
```

**After:**
```tsx
<Card variant="glass-strong" className="p-8 md:p-10">
  <CardHeader className="space-y-4">
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 space-y-3">
        <CardTitle className="text-3xl md:text-4xl font-bold">
          {thread.title}
        </CardTitle>
        <div className="flex gap-6 text-sm text-muted-foreground">
```

**Reply List Enhancement:**

**Before:**
```tsx
<div>
  <h2 className="text-2xl font-semibold mb-4">
    {posts.length} {posts.length === 1 ? "Reply" : "Replies"}
  </h2>
  <div className="space-y-4">
```

**After:**
```tsx
<div className="space-y-6">
  <h2 className="text-3xl font-bold">
    {posts.length} {posts.length === 1 ? "Reply" : "Replies"}
  </h2>
  <div className="space-y-6">
```

**Reply Card Enhancement:**

**Before:**
```tsx
<Card key={post.id} variant={post.endorsed ? "glass-liquid" : "glass"}>
  <CardHeader>
    <div className="flex items-start gap-3">
      <Avatar className="h-10 w-10 bg-primary/20">
```

**After:**
```tsx
<Card
  key={post.id}
  variant={post.endorsed ? "glass-liquid" : "glass"}
  className="p-6 md:p-8"
>
  <CardHeader className="space-y-3">
    <div className="flex items-start gap-4">
      <Avatar className="h-12 w-12 bg-primary/20">
```

**Reply Form Enhancement:**

**Before:**
```tsx
<Card variant="glass-strong">
  <CardHeader>
    <CardTitle>Post a Reply</CardTitle>
    <CardDescription>Share your thoughts or answer this question</CardDescription>
  </CardHeader>
  <CardContent>
    <form onSubmit={handleSubmitReply} className="space-y-4">
      <Textarea ... rows={5} ... />
      <Button type="submit" variant="glass-primary" ...>
```

**After:**
```tsx
<Card variant="glass-strong" className="p-8 md:p-10">
  <CardHeader className="space-y-2">
    <CardTitle className="text-2xl">Post a Reply</CardTitle>
    <CardDescription className="text-base">
      Share your thoughts or answer this question
    </CardDescription>
  </CardHeader>
  <CardContent>
    <form onSubmit={handleSubmitReply} className="space-y-6">
      <Textarea ... rows={8} className="text-base" ... />
      <div className="flex gap-4 pt-4 border-t border-border/40">
        <Button type="submit" variant="glass-primary" size="lg" ...>
```

**Specific Changes:**
- Outer spacing: `space-y-8` → `space-y-12`
- Question card: Add `p-8 md:p-10`
- Question title: `text-2xl` → `text-3xl md:text-4xl font-bold`
- Metadata gap: `gap-4` → `gap-6`
- Reply section heading: `text-2xl` → `text-3xl font-bold`
- Reply list spacing: `space-y-4` → `space-y-6`
- Reply cards: Add `p-6 md:p-8`
- Reply avatars: `h-10 w-10` → `h-12 w-12`
- Reply form: Add `p-8 md:p-10`
- Form title: Add `text-2xl`
- Form description: Add `text-base`
- Textarea rows: `5` → `8`
- Form spacing: `space-y-4` → `space-y-6`
- Submit button: Add `size="lg"`, wrap in bordered section

---

### 6. Ask Question Page (`app/ask/page.tsx`)

**Current Issues:**
- Basic form layout
- Small inputs
- Cramped field spacing
- Generic tips card

**Design Changes:**

**Hero Enhancement:**

**Before:**
```tsx
<div>
  <h1 className="text-4xl font-bold text-primary glass-text">Ask a Question</h1>
  <p className="text-muted-foreground mt-2">
    Get help from your classmates and instructors
  </p>
</div>
```

**After:**
```tsx
<div className="text-center md:text-left py-8 md:py-12 space-y-4">
  <div className="space-y-2">
    <h1 className="text-5xl md:text-6xl font-bold text-primary glass-text">
      Ask a Question
    </h1>
    <p className="text-lg md:text-xl text-muted-foreground">
      Get help from your classmates and instructors
    </p>
  </div>
</div>
```

**Form Card Enhancement:**

**Before:**
```tsx
<Card variant="glass-strong">
  <CardHeader>
    <CardTitle>New Discussion Thread</CardTitle>
    <CardDescription>
      Provide a clear title and detailed description of your question
    </CardDescription>
  </CardHeader>
  <CardContent>
    <form onSubmit={handleSubmit} className="space-y-6">
```

**After:**
```tsx
<Card variant="glass-strong" className="p-8 md:p-10">
  <CardHeader className="space-y-2">
    <CardTitle className="text-2xl md:text-3xl">New Discussion Thread</CardTitle>
    <CardDescription className="text-base">
      Provide a clear title and detailed description of your question
    </CardDescription>
  </CardHeader>
  <CardContent>
    <form onSubmit={handleSubmit} className="space-y-8">
```

**Form Field Enhancement:**

**Before:**
```tsx
<div className="space-y-2">
  <label htmlFor="title" className="text-sm font-medium">
    Question Title *
  </label>
  <Input
    id="title"
    value={title}
    onChange={(e) => setTitle(e.target.value)}
    placeholder="e.g., How does binary search work?"
    required
    maxLength={200}
  />
  <p className="text-xs text-muted-foreground">
    {title.length}/200 characters
  </p>
</div>
```

**After:**
```tsx
<div className="space-y-3">
  <label htmlFor="title" className="text-sm font-semibold">
    Question Title *
  </label>
  <Input
    id="title"
    value={title}
    onChange={(e) => setTitle(e.target.value)}
    placeholder="e.g., How does binary search work?"
    className="h-12 text-base"
    required
    maxLength={200}
  />
  <p className="text-xs text-muted-foreground">
    {title.length}/200 characters
  </p>
</div>
```

**Textarea Enhancement:**

**Before:**
```tsx
<Textarea
  id="content"
  value={content}
  onChange={(e) => setContent(e.target.value)}
  placeholder="Provide a detailed description..."
  rows={10}
  required
/>
```

**After:**
```tsx
<Textarea
  id="content"
  value={content}
  onChange={(e) => setContent(e.target.value)}
  placeholder="Provide a detailed description of your question. Include any relevant code, error messages, or context that will help others understand and answer your question."
  className="text-base min-h-[200px]"
  rows={12}
  required
/>
```

**Button Group Enhancement:**

**Before:**
```tsx
<div className="flex gap-4">
  <Button
    type="submit"
    variant="glass-primary"
    disabled={...}
  >
    {isSubmitting ? "Posting..." : "Post Question"}
  </Button>
  <Button type="button" variant="outline" onClick={() => router.back()} ...>
    Cancel
  </Button>
</div>
```

**After:**
```tsx
<div className="flex gap-4 pt-6 border-t border-border/40">
  <Button
    type="submit"
    variant="glass-primary"
    size="lg"
    disabled={...}
  >
    {isSubmitting ? "Posting..." : "Post Question"}
  </Button>
  <Button
    type="button"
    variant="outline"
    size="lg"
    onClick={() => router.back()}
    ...
  >
    Cancel
  </Button>
</div>
```

**Tips Card Enhancement:**

**Before:**
```tsx
<Card variant="glass">
  <CardHeader>
    <CardTitle className="text-lg">Tips for Asking Good Questions</CardTitle>
  </CardHeader>
  <CardContent className="space-y-2 text-sm text-muted-foreground">
    <p>✓ Search existing threads first to avoid duplicates</p>
    <p>✓ Use a clear, specific title that summarizes your question</p>
    <p>✓ Provide enough context and details for others to understand</p>
    <p>✓ Include relevant code snippets or error messages</p>
    <p>✓ Use appropriate tags to help others find your question</p>
  </CardContent>
</Card>
```

**After:**
```tsx
<Card variant="glass" className="p-8">
  <CardHeader className="space-y-2">
    <CardTitle className="text-xl">Tips for Asking Good Questions</CardTitle>
  </CardHeader>
  <CardContent className="space-y-3 text-base text-muted-foreground">
    <div className="flex gap-3">
      <span className="text-success shrink-0">✓</span>
      <p>Search existing threads first to avoid duplicates</p>
    </div>
    <div className="flex gap-3">
      <span className="text-success shrink-0">✓</span>
      <p>Use a clear, specific title that summarizes your question</p>
    </div>
    <div className="flex gap-3">
      <span className="text-success shrink-0">✓</span>
      <p>Provide enough context and details for others to understand</p>
    </div>
    <div className="flex gap-3">
      <span className="text-success shrink-0">✓</span>
      <p>Include relevant code snippets or error messages</p>
    </div>
    <div className="flex gap-3">
      <span className="text-success shrink-0">✓</span>
      <p>Use appropriate tags to help others find your question</p>
    </div>
  </CardContent>
</Card>
```

**Specific Changes:**
- Outer spacing: `space-y-8` → `space-y-12`
- Hero: Center on mobile, add `py-8 md:py-12`
- Title: `text-4xl` → `text-5xl md:text-6xl`
- Subtitle: Add `text-lg md:text-xl`
- Form card: Add `p-8 md:p-10`
- Form title: Add `text-2xl md:text-3xl`
- Form description: Add `text-base`
- Form spacing: `space-y-6` → `space-y-8`
- Field spacing: `space-y-2` → `space-y-3`
- Labels: Add `font-semibold`
- Inputs: Add `h-12 text-base`
- Textarea: Increase rows `10` → `12`, add `min-h-[200px]`, `text-base`
- Buttons: Add `size="lg"`, wrap in bordered section
- Tips card: Add `p-8`, increase text `text-sm` → `text-base`, structure with icons

---

### 7. Quokka Chat Page (`app/quokka/page.tsx`)

**Current Issues:**
- Cramped chat container
- Small messages
- Basic input styling

**Design Changes:**

**Hero Enhancement:**

**Before:**
```tsx
<div className="text-center space-y-2">
  <h1 className="text-4xl font-bold text-primary glass-text">Quokka AI</h1>
  <p className="text-muted-foreground">Your friendly AI study assistant</p>
</div>
```

**After:**
```tsx
<div className="text-center space-y-4 py-8">
  <div className="space-y-2">
    <h1 className="text-5xl md:text-6xl font-bold text-primary glass-text">
      Quokka AI
    </h1>
    <p className="text-lg md:text-xl text-muted-foreground">
      Your friendly AI study assistant
    </p>
  </div>
</div>
```

**Chat Container Enhancement:**

**Before:**
```tsx
<Card variant="glass-strong" className="h-[600px] flex flex-col">
  <CardHeader className="border-b border-border/40">
    <div className="flex items-center justify-between">
      <div>
        <CardTitle>Chat with Quokka</CardTitle>
        <CardDescription>Ask me anything about your courses</CardDescription>
      </div>
```

**After:**
```tsx
<Card variant="glass-strong" className="h-[700px] flex flex-col">
  <CardHeader className="border-b border-border/40 p-6">
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <CardTitle className="text-2xl">Chat with Quokka</CardTitle>
        <CardDescription className="text-base">
          Ask me anything about your courses
        </CardDescription>
      </div>
```

**Message Enhancement:**

**Before:**
```tsx
<div className={`max-w-[80%] rounded-lg p-4 ${
  message.role === "user"
    ? "bg-accent text-accent-foreground"
    : "bg-primary/10 text-foreground"
}`}>
  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
  <p className="text-xs opacity-60 mt-2">
    {message.timestamp.toLocaleTimeString()}
  </p>
</div>
```

**After:**
```tsx
<div className={`max-w-[85%] rounded-2xl p-5 ${
  message.role === "user"
    ? "bg-accent text-accent-foreground"
    : "glass-panel-strong text-foreground"
}`}>
  <p className="text-base whitespace-pre-wrap leading-relaxed">
    {message.content}
  </p>
  <p className="text-xs opacity-60 mt-3">
    {message.timestamp.toLocaleTimeString()}
  </p>
</div>
```

**Input Section Enhancement:**

**Before:**
```tsx
<div className="border-t border-border/40 p-4">
  {messages.length === 1 && (
    <div className="mb-4">
      <p className="text-xs text-muted-foreground mb-2">Quick prompts:</p>
      <div className="flex flex-wrap gap-2">
```

**After:**
```tsx
<div className="border-t border-border/40 p-6 space-y-4">
  {messages.length === 1 && (
    <div className="space-y-3">
      <p className="text-sm font-medium text-muted-foreground">Quick prompts:</p>
      <div className="flex flex-wrap gap-3">
```

**Input Enhancement:**

**Before:**
```tsx
<form onSubmit={handleSubmit} className="flex gap-2">
  <Input
    value={input}
    onChange={(e) => setInput(e.target.value)}
    placeholder="Ask me anything..."
    disabled={isThinking}
    className="flex-1"
  />
  <Button type="submit" variant="glass-primary" disabled={...}>
    Send
  </Button>
</form>
```

**After:**
```tsx
<form onSubmit={handleSubmit} className="flex gap-3">
  <Input
    value={input}
    onChange={(e) => setInput(e.target.value)}
    placeholder="Ask me anything..."
    disabled={isThinking}
    className="flex-1 h-12 text-base"
  />
  <Button
    type="submit"
    variant="glass-primary"
    size="lg"
    disabled={...}
  >
    Send
  </Button>
</form>
```

**Tips Card Enhancement:**

**Before:**
```tsx
<Card variant="glass">
  <CardContent className="p-4 text-sm text-muted-foreground">
    <p className="font-semibold mb-2">💡 Tips:</p>
    <ul className="space-y-1 list-disc list-inside">
```

**After:**
```tsx
<Card variant="glass" className="p-6">
  <CardContent className="space-y-3">
    <p className="text-base font-semibold">💡 Tips:</p>
    <ul className="space-y-2 text-sm text-muted-foreground">
      <li className="flex gap-2">
        <span className="shrink-0">•</span>
        <span>I'm best at CS and Math topics</span>
      </li>
```

**Specific Changes:**
- Outer spacing: `space-y-6` → `space-y-8`
- Hero: Add `py-8`
- Title: `text-4xl` → `text-5xl md:text-6xl`
- Subtitle: Add `text-lg md:text-xl`
- Chat height: `h-[600px]` → `h-[700px]`
- Header padding: Default → `p-6`
- Chat title: Add `text-2xl`
- Chat description: Add `text-base`
- Message max-width: `80%` → `85%`
- Message border radius: `rounded-lg` → `rounded-2xl`
- Message padding: `p-4` → `p-5`
- Message text: `text-sm` → `text-base leading-relaxed`
- AI messages: Use `glass-panel-strong` for consistency
- Input section padding: `p-4` → `p-6`
- Input height: Add `h-12 text-base`
- Send button: Add `size="lg"`
- Quick prompts gap: `gap-2` → `gap-3`
- Tips card: Better structure with flex layout

---

## Component Patterns Summary

### Glass Effect Usage

**Navigation:**
- Header: `glass-panel`
- Dropdown menus: `glass-panel`

**Content Cards:**
- Primary content (questions, course headers): `glass-strong` + `p-8 md:p-10`
- Interactive cards (course cards, thread cards): `glass-hover`
- Reply cards: `glass` (standard), `glass-liquid` (endorsed)
- Secondary cards (tips, info): `glass` + `p-6` to `p-8`
- Chat messages (AI): `glass-panel-strong`

**Overlays:**
- Modals/dialogs: `glass-overlay`

### Typography Scales

**Heroes/Page Titles:**
- Desktop: `text-5xl` to `text-6xl font-bold`
- Mobile: `text-4xl` to `text-5xl font-bold`

**Section Headings:**
- Desktop: `text-3xl font-bold`
- Mobile: `text-2xl font-bold`

**Card Titles:**
- Important cards: `text-2xl` to `text-3xl font-bold`
- Standard cards: `text-xl` to `text-2xl font-semibold`
- Small cards: `text-lg font-semibold`

**Body Text:**
- Emphasis: `text-lg` to `text-xl`
- Standard: `text-base`
- Small: `text-sm`
- Captions: `text-xs`

### Spacing Scales

**Page-Level:**
- Container: `max-w-4xl` to `max-w-6xl mx-auto`
- Padding: `p-4 md:p-8` (mobile → desktop)
- Section spacing: `space-y-12` (generous)

**Hero Sections:**
- Vertical padding: `py-8 md:py-12`
- Internal spacing: `space-y-4` to `space-y-6`

**Cards:**
- Important cards: `p-8 md:p-10`
- Standard cards: `p-6 md:p-8`
- Small cards: `p-4` to `p-6`

**Grids:**
- Gap: `gap-8` (generous)
- List spacing: `space-y-6`

**Forms:**
- Form spacing: `space-y-8`
- Field groups: `space-y-6`
- Field internal: `space-y-3`

### Interactive States

**Hover:**
- Cards: `hover:-translate-y-1 hover:shadow-[var(--shadow-glass-lg)]`
- Buttons: `hover:bg-primary/85 hover:shadow-[var(--glow-primary)]`
- Links: `hover:text-accent`

**Focus:**
- Inputs: `focus:ring-2 focus:ring-accent focus:ring-offset-2`
- Buttons: `focus-visible:ring-ring/50 focus-visible:ring-[3px]`

**Active:**
- Buttons: `active:scale-[0.98]`

**Disabled:**
- All: `opacity-50 cursor-not-allowed`

### Button Sizing

- Large (primary actions): `size="lg"` (h-11)
- Default: `size="default"` (h-10)
- Small: `size="sm"` (h-9)

### Input Sizing

- Forms: `h-12 text-base`
- Textareas: `min-h-[200px] text-base` with appropriate `rows`

---

## Implementation Order

1. **Navigation Header** - Foundation for all pages
2. **Home/Loading Page** - Quick win, sets visual tone
3. **Courses Page** - High visibility, showcases grid improvements
4. **Course Detail Page** - Important user flow
5. **Thread Detail Page** - Core interaction point
6. **Ask Question Page** - Form design showcase
7. **Quokka Chat Page** - Unique interaction pattern

---

## Accessibility Checklist

- [ ] All text maintains 4.5:1 contrast ratio minimum
- [ ] Focus indicators visible on all interactive elements
- [ ] Touch targets minimum 44×44px on mobile
- [ ] Semantic HTML preserved (h1, h2, nav, form, etc.)
- [ ] ARIA labels maintained where present
- [ ] Keyboard navigation works for all interactions
- [ ] Glass text shadows don't reduce readability
- [ ] Color not sole indicator of meaning (badges include text)
- [ ] Form labels properly associated with inputs

---

## Performance Considerations

- [ ] Maximum 3 blur layers per view maintained
- [ ] Glass utilities use optimized CSS (`will-change`, `contain`)
- [ ] No heavy blur values (>32px) used
- [ ] Reduced motion support maintained
- [ ] No layout shifts from spacing changes
- [ ] Bundle size impact minimal (CSS only)

---

## Testing Requirements

**Visual Testing:**
- [ ] All pages at 360px (mobile small)
- [ ] All pages at 768px (tablet)
- [ ] All pages at 1024px (desktop)
- [ ] All pages at 1280px (desktop large)
- [ ] Light mode rendering
- [ ] Dark mode rendering
- [ ] Glass effects visible and appealing
- [ ] Typography hierarchy clear

**Interactive Testing:**
- [ ] Hover states work on cards, buttons, links
- [ ] Focus states visible on keyboard navigation
- [ ] Active states provide feedback
- [ ] Disabled states prevent interaction

**Content Testing:**
- [ ] Empty states render correctly
- [ ] Loading states match content structure
- [ ] Long text content wraps properly
- [ ] Grid layouts handle varying content lengths

---

## Rollback Strategy

All changes are purely visual (className modifications). Rollback via:
1. Git revert to previous commit
2. No functional changes means no data risk
3. QDS tokens ensure consistency across changes

---

## Files to Modify

1. `/Users/dgz/projects-professional/quokka/quokka-demo/components/layout/nav-header.tsx`
2. `/Users/dgz/projects-professional/quokka/quokka-demo/app/page.tsx`
3. `/Users/dgz/projects-professional/quokka/quokka-demo/app/courses/page.tsx`
4. `/Users/dgz/projects-professional/quokka/quokka-demo/app/courses/[courseId]/page.tsx`
5. `/Users/dgz/projects-professional/quokka/quokka-demo/app/threads/[threadId]/page.tsx`
6. `/Users/dgz/projects-professional/quokka/quokka-demo/app/ask/page.tsx`
7. `/Users/dgz/projects-professional/quokka/quokka-demo/app/quokka/page.tsx`

**Note:** All modifications are className changes only. No props interfaces, TypeScript types, or functional logic changes required.
