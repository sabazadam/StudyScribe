# Micro-Interactions & Delight Moments Guide

Complete implementation guide for all micro-interactions and delightful UI enhancements added to StudyScribe.

---

## 📦 **New Components**

### 1. **LoadingSkeleton** (`components/ui/LoadingSkeleton.tsx`)
Animated skeleton placeholders for loading states with shimmer effect.

**Usage:**
```tsx
import LoadingSkeleton, { MaterialCardSkeleton, ListItemSkeleton, PageHeaderSkeleton } from '@/components/ui/LoadingSkeleton';

// Basic skeleton
<LoadingSkeleton variant="text" width="80%" />
<LoadingSkeleton variant="title" width="60%" />
<LoadingSkeleton variant="circle" width="48px" height="48px" />
<LoadingSkeleton variant="rectangular" width="100%" height="200px" />

// Pre-built layouts
<MaterialCardSkeleton />
<ListItemSkeleton count={5} />
<PageHeaderSkeleton />
```

**Variants:**
- `text` - Single line text placeholder
- `title` - Larger heading placeholder
- `circle` - Circular avatar/icon placeholder
- `rectangular` - Custom sized rectangle

---

### 2. **SuccessAnimation** (`components/ui/SuccessAnimation.tsx`)
Animated success feedback with checkmark SVG animation.

**Usage:**
```tsx
import SuccessAnimation, { SuccessToast, ProgressSuccess } from '@/components/ui/SuccessAnimation';

// Full-screen success modal
<SuccessAnimation
  show={isSuccess}
  message="Material Saved!"
  onComplete={() => setIsSuccess(false)}
  duration={3000}
  size="md"
/>

// Mini toast notification
<SuccessToast
  show={showToast}
  message="Changes saved"
  position="bottom"
/>

// Progress with success indicators
<ProgressSuccess
  steps={['Upload', 'Process', 'Generate']}
  currentStep={1}
  completed={false}
/>
```

**Features:**
- Smooth checkmark SVG stroke animation
- Backdrop blur effect
- Auto-dismiss with callback
- Multiple sizes (sm, md, lg)
- Toast variant for inline feedback
- Progress tracker variant

---

### 3. **Enhanced Button** (`components/ui/Button.tsx`)
Buttons with magnetic hover, ripple effects, and loading states.

**Usage:**
```tsx
import { Button } from '@/components/ui/Button';

// Primary button with icon and loading state
<Button
  variant="primary"
  size="md"
  loading={isLoading}
  icon={<UploadIcon />}
  iconPosition="left"
  magnetic={true}
  ripple={true}
  fullWidth={false}
  onClick={handleClick}
>
  Upload Files
</Button>

// Variants
<Button variant="primary">Primary Action</Button>
<Button variant="secondary">Secondary Action</Button>
<Button variant="outline">Outlined</Button>
<Button variant="ghost">Ghost Button</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>
```

**New Features:**
- `loading` - Shows spinner, disables button
- `icon` - Add icon before/after text
- `iconPosition` - 'left' or 'right'
- `magnetic` - Magnetic hover lift effect
- `ripple` - Click ripple animation
- `fullWidth` - Stretch to container width

---

## 🎨 **CSS Classes Reference**

### Button Effects

**Ripple Effect:**
```html
<button class="btn-ripple">Click me</button>
```
- Expands white circle on click
- Activates on active state

**Magnetic Hover:**
```html
<button class="btn-magnetic">Hover me</button>
```
- Lifts up and scales on hover
- Presses down on click
- Elastic cubic-bezier timing

---

### Loading Skeletons

**Skeleton Variants:**
```html
<div class="skeleton">Basic skeleton</div>
<div class="skeleton-text">Text line</div>
<div class="skeleton-title">Title/heading</div>
<div class="skeleton-circle" style="width: 48px; height: 48px;"></div>
```

**Animation:**
- Continuous shimmer from left to right
- 1.5s duration
- Uses Academic Heritage colors (Prussian Blue)

---

### Interactive Cards

**Standard Interactive Card:**
```html
<div class="card-interactive">
  <!-- Content -->
</div>
```

**Effects:**
- Lifts 8px on hover
- Scales to 102%
- Gold border glow
- Shadow enhancement
- Smooth elastic easing

---

### Success Animations

**Checkmark Circle:**
```html
<svg viewBox="0 0 52 52">
  <circle class="checkmark-circle" cx="26" cy="26" r="25" />
  <path class="checkmark-check" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
</svg>
```

**Stroke Animation:**
- Circle draws in 0.6s
- Checkmark appears after circle completes
- Uses stroke-dasharray technique

---

### Progress Indicators

**Animated Progress Bar:**
```html
<div class="progress-bar">
  <div class="progress-bar-fill" style="width: 60%;"></div>
</div>
```

**Features:**
- Shimmer gradient background
- Smooth width transitions
- Elastic easing
- Primary → Cerulean gradient

---

### Icon Effects

**Bounce on Hover:**
```html
<span class="icon-bounce">
  <svg><!-- Icon --></svg>
</span>
```

**Animation:**
- Bounces up 8px
- Multi-step bounce (25%, 50%, 75%)
- 0.5s duration

---

### Floating Elements

**Float Animation:**
```html
<div class="float">
  <!-- Badge or floating element -->
</div>
```

**Effect:**
- Gentle up-down motion
- 10px travel distance
- 3s smooth loop

---

### Error Feedback

**Shake Animation:**
```html
<div class="shake">
  <!-- Error message or invalid input -->
</div>
```

**Effect:**
- Horizontal shake
- 4px amplitude
- Multiple oscillations
- 0.5s duration

---

### Tooltips

**Smooth Fade Tooltip:**
```html
<div class="tooltip-trigger">
  Hover me
  <div class="tooltip">
    Tooltip content here
  </div>
</div>
```

**Behavior:**
- Fades in from below
- 4px slide up
- 0.3s transition

---

### Gradient Border Animation

**Rotating Gradient Border:**
```html
<div class="gradient-border">
  <!-- Content -->
</div>
```

**Effect:**
- Primary → Cerulean → Gold gradient
- 4s rotation loop
- Uses mask-composite trick
- 2px border width

---

### List Animations

**Staggered Slide-Up:**
```html
<div class="stagger-item">Item 1</div>
<div class="stagger-item">Item 2</div>
<div class="stagger-item">Item 3</div>
```

**Timing:**
- Each item delays by 0.1s
- Up to 6 items have delays defined
- Slide up from 30px below

---

### Glow Effects

**Primary Glow:**
```html
<div class="glow-primary">
  <!-- Content with blue glow -->
</div>
```

**Accent Glow:**
```html
<div class="glow-accent">
  <!-- Content with gold glow -->
</div>
```

**CTA Pulse Glow:**
```html
<button class="pulse-glow-cta">
  Call to Action
</button>
```

**Effects:**
- Multi-layer box-shadow
- Pulsing intensity
- 2s infinite loop for CTA

---

## 🎯 **Keyframe Animations**

All new keyframe animations available:

| Animation | Use Case | Duration |
|-----------|----------|----------|
| `skeleton-loading` | Shimmer effect for skeletons | 1.5s |
| `pulseGlowCTA` | Pulsing glow for important CTAs | 2s (infinite) |
| `stroke-circle` | Checkmark circle animation | 0.6s |
| `stroke-check` | Checkmark check animation | 0.3s |
| `float` | Gentle floating motion | 3s (infinite) |
| `shake` | Error shake feedback | 0.5s |
| `pageTransitionOut` | Page transition overlay | 0.5s |
| `shimmer-progress` | Progress bar shimmer | 2s (infinite) |
| `icon-bounce` | Icon bounce on hover | 0.5s |
| `gradient-rotate` | Rotating gradient border | 4s (infinite) |

---

## 🚀 **Implementation Examples**

### Example 1: File Upload with Loading State

```tsx
import { Button } from '@/components/ui/Button';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import SuccessAnimation from '@/components/ui/SuccessAnimation';

function FileUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  return (
    <>
      <Button
        loading={isUploading}
        icon={<UploadIcon />}
        onClick={handleUpload}
      >
        Upload PDF
      </Button>

      {isUploading && <LoadingSkeleton variant="rectangular" height="200px" />}

      <SuccessAnimation
        show={showSuccess}
        message="Files uploaded successfully!"
        onComplete={() => setShowSuccess(false)}
      />
    </>
  );
}
```

---

### Example 2: Material Card with Interactions

```tsx
function MaterialCard({ material }) {
  return (
    <div className="card-interactive p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center float">
          <BookIcon className="text-white" />
        </div>
        <h3 className="font-heading text-xl text-gradient-primary">
          {material.title}
        </h3>
      </div>

      <p className="text-text-light/80 mb-4">
        {material.description}
      </p>

      <Button
        variant="outline"
        size="sm"
        icon={<DownloadIcon />}
        ripple={true}
      >
        Download
      </Button>
    </div>
  );
}
```

---

### Example 3: Multi-Step Process with Progress

```tsx
import { ProgressSuccess } from '@/components/ui/SuccessAnimation';

function ProcessLecture() {
  const steps = ['Upload Files', 'Extract Content', 'Generate Materials', 'Save to Hub'];
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(false);

  return (
    <div className="max-w-md mx-auto">
      <ProgressSuccess
        steps={steps}
        currentStep={currentStep}
        completed={completed}
      />

      <div className="mt-8">
        <div className="progress-bar h-2">
          <div
            className="progress-bar-fill"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
```

---

### Example 4: Form with Error Shake

```tsx
function LoginForm() {
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (invalid) {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        className={shake ? 'shake border-red-500' : ''}
      />
      {error && (
        <p className="text-red-500 text-sm mt-1">
          Invalid credentials
        </p>
      )}

      <Button
        type="submit"
        fullWidth
        className="mt-4 pulse-glow-cta"
      >
        Sign In
      </Button>
    </form>
  );
}
```

---

## ♿ **Accessibility**

All micro-interactions respect accessibility preferences:

### Reduced Motion Support

Users with `prefers-reduced-motion` will see:
- No animations (0.01ms duration)
- Instant state changes
- All functionality preserved

### ARIA Attributes

- Loading states: `aria-busy="true"`
- Success animations: `role="alert" aria-live="polite"`
- Skeletons: `aria-hidden="true" aria-busy="true"`
- Tooltips: Proper `aria-label` on triggers

### Keyboard Navigation

- All interactive elements are keyboard accessible
- Focus states use gold outline (Academic Heritage)
- Skip links available for screen readers
- Proper tab order maintained

---

## 🎨 **Design Tokens**

Micro-interactions use the Academic Heritage color system:

- **Primary Actions**: Prussian Blue (#034078)
- **Success States**: Green (#10b981)
- **Accent Highlights**: Gold (#D4AF37)
- **Hover Effects**: Cerulean (#1282A2)
- **Loading States**: Primary with 5-10% opacity

---

## 📊 **Performance Considerations**

### Optimizations Applied:

1. **CSS-based animations** (GPU-accelerated)
   - transform, opacity, box-shadow only
   - No layout-triggering properties

2. **Reduced motion fallback**
   - Respects user preferences
   - Instant transitions when needed

3. **Conditional rendering**
   - Components unmount when not visible
   - No hidden DOM overhead

4. **Lazy animations**
   - Triggered by user interaction
   - Not running in background

---

## 🔧 **Customization**

### Adjusting Animation Speeds

Edit `app/globals.css`:

```css
:root {
  --duration-fast: 150ms;
  --duration-base: 250ms;
  --duration-slow: 500ms;
}
```

### Changing Easing Functions

Replace cubic-bezier values in component files or CSS:

- **Elastic**: `cubic-bezier(0.68, -0.55, 0.265, 1.55)`
- **Smooth**: `cubic-bezier(0.34, 1.56, 0.64, 1)`
- **Standard**: `cubic-bezier(0.4, 0, 0.2, 1)`

### Disabling Effects Per Component

```tsx
<Button magnetic={false} ripple={false}>
  No effects
</Button>
```

---

## ✅ **Summary**

### What's Been Added:

- ✅ **3 new components** (LoadingSkeleton, SuccessAnimation, Enhanced Button)
- ✅ **15+ CSS utility classes** for micro-interactions
- ✅ **10 new keyframe animations**
- ✅ **Ripple effect** for buttons
- ✅ **Magnetic hover** effects
- ✅ **Loading skeletons** with shimmer
- ✅ **Success animations** with checkmark
- ✅ **Progress indicators** with animations
- ✅ **Shake animations** for errors
- ✅ **Float animations** for badges
- ✅ **Tooltip** fade effects
- ✅ **Gradient border** animations
- ✅ **Staggered list** animations
- ✅ **Full accessibility** support

### Where to Use:

| Interaction | Best For |
|-------------|----------|
| Ripple | Primary actions, important buttons |
| Magnetic | Navigation, CTAs, cards |
| Skeleton | Initial page load, data fetching |
| Success Animation | Form submissions, saves, uploads |
| Progress | Multi-step flows, file processing |
| Shake | Form validation, errors |
| Float | Badges, new features, highlights |
| Glow | Important CTAs, active states |

---

**Build Status**: ✅ All components compiled successfully
**Accessibility**: ✅ WCAG AA compliant
**Performance**: ✅ GPU-accelerated CSS animations
**Browser Support**: ✅ All modern browsers
