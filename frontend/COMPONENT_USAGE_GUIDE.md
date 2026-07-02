# Component Usage Guide

## Quick Reference: ConfirmDialog & Toast

---

## ConfirmDialog Component

### Purpose
Display important confirmations before performing destructive or significant actions.

### Import
```jsx
import ConfirmDialog from '../../components/ConfirmDialog'
```

### Basic Setup
```jsx
const [confirm, setConfirm] = useState(null)

// In component return:
<ConfirmDialog
  open={!!confirm}
  title={confirm?.title}
  message={confirm?.message}
  variant={confirm?.variant || 'default'}
  confirmLabel={confirm?.confirmLabel || 'Confirm'}
  onConfirm={confirm?.onConfirm}
  onCancel={() => setConfirm(null)}
/>
```

### Usage Pattern 1: Simple Confirmation
```jsx
function handleDelete() {
  setConfirm({
    title: 'Delete Item',
    message: 'This action cannot be undone.',
    confirmLabel: 'Delete',
    onConfirm: () => {
      setConfirm(null)
      deleteItem()
    },
  })
}
```

### Usage Pattern 2: Danger Variant
```jsx
function handleDeactivate() {
  setConfirm({
    title: 'Deactivate Account',
    message: 'Deactivate John Doe? They will lose access to all systems.',
    variant: 'danger',
    confirmLabel: 'Deactivate',
    onConfirm: () => {
      setConfirm(null)
      deactivateAccount()
    },
  })
}
```

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | boolean | - | Controls visibility |
| `title` | string | - | Dialog heading |
| `message` | string \| ReactNode | - | Dialog body content |
| `variant` | 'default' \| 'danger' | 'default' | Visual style variant |
| `confirmLabel` | string | 'Confirm' | Primary button text |
| `cancelLabel` | string | 'Cancel' | Secondary button text |
| `onConfirm` | () => void | - | Callback when user confirms |
| `onCancel` | () => void | - | Callback when user cancels |

---

## Toast Component

### Purpose
Display temporary notifications (success, error, warning, info) without blocking user interaction.

### Import
```jsx
import Toast from '../../components/Toast'
```

### Basic Setup
```jsx
const [toast, setToast] = useState(null)

// In component return:
<Toast
  toast={toast}
  onClose={() => setToast(null)}
  autoDismiss={3500}
  position="top-right"
/>
```

### Usage Patterns

#### Success Notification
```jsx
function handleSave() {
  saveData()
  setToast({ type: 'success', message: 'Data saved successfully!' })
}
```

#### Error Notification
```jsx
function handleSave() {
  const result = saveData()
  if (!result.ok) {
    setToast({ type: 'error', message: result.error || 'Failed to save.' })
  }
}
```

#### Warning Notification
```jsx
setToast({
  type: 'warning',
  message: 'This action will affect 5 related records.'
})
```

#### Info Notification
```jsx
setToast({
  type: 'info',
  message: 'Schedule updated. Notify faculty of changes.'
})
```

### Helper Function (LoadAssignmentPage pattern)
```jsx
function notify(type, message) {
  setToast({ type, message })
  window.setTimeout(() => setToast(null), 3500)
}

// Usage:
notify('success', 'Item created.')
notify('error', 'Failed to create item.')
notify('warning', 'Please review this.')
notify('info', 'FYI message.')
```

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `toast` | null \| { type, message } | null | Toast data object |
| `onClose` | () => void | - | Callback when toast closes |
| `autoDismiss` | number | 3500 | Auto-close delay in ms (0 to disable) |
| `position` | string | 'top-right' | Position: 'top-right', 'top-left', 'bottom-right', 'bottom-left' |

### Toast Types
| Type | Icon | Color | Use Case |
|------|------|-------|----------|
| `success` | ✓ Checkmark | Green (#10b981) | Successful action completion |
| `error` | ⚠ Alert Circle | Red (#ef4444) | Error or failure |
| `warning` | △ Triangle | Amber (#f59e0b) | Warning or caution |
| `info` | ⓘ Info | Blue (#3b82f6) | Information or FYI |

---

## Real-World Examples

### Example 1: User Role Change (ConfirmDialog + Toast)
```jsx
function handleRoleChange(user, newRole) {
  setConfirm({
    title: 'Change User Role',
    message: `Change ${user.name}'s role to ${newRole}? They will have access to new features immediately.`,
    confirmLabel: 'Change Role',
    onConfirm: () => {
      setConfirm(null)
      const result = updateUserRole(user.id, newRole)
      if (result.ok) {
        notify('success', `${user.name}'s role updated to ${newRole}.`)
      } else {
        notify('error', result.error || 'Failed to update role.')
      }
    },
  })
}
```

### Example 2: Bulk Assignment (ConfirmDialog + Toast)
```jsx
function handleBulkAssign() {
  const count = items.length
  setConfirm({
    title: 'Confirm Bulk Assignment',
    message: `Assign ${count} items? This will overwrite existing assignments.`,
    variant: 'danger',
    confirmLabel: 'Assign All',
    onConfirm: () => {
      setConfirm(null)
      const result = bulkAssign(items)
      if (result.ok) {
        notify('success', `${count} items assigned successfully.`)
      } else {
        notify('error', 'Bulk assignment failed.')
      }
    },
  })
}
```

### Example 3: Form Submission
```jsx
function handleFormSubmit(e) {
  e.preventDefault()
  
  if (hasUnsavedChanges) {
    setConfirm({
      title: 'Discard Changes?',
      message: 'You have unsaved changes. Discard them?',
      variant: 'danger',
      confirmLabel: 'Discard',
      onConfirm: () => {
        setConfirm(null)
        reset()
        navigate('/back')
      },
    })
  } else {
    const result = submitForm(formData)
    if (result.ok) {
      notify('success', 'Form submitted!')
    } else {
      notify('error', result.message)
    }
  }
}
```

---

## Styling & Customization

### Dark Mode
Both components automatically adapt to dark mode via `useTheme()` context.

**Light Mode (Default):**
- Background: White
- Text: Dark emerald

**Dark Mode:**
- Background: #101F18 (dark emerald)
- Text: Emerald-50 (light)

### Custom Positioning (Toast)
```jsx
// Top-left
<Toast position="top-left" />

// Bottom-right
<Toast position="bottom-right" />

// Bottom-left
<Toast position="bottom-left" />
```

### Custom Auto-Dismiss Duration
```jsx
// Dismiss after 5 seconds
<Toast autoDismiss={5000} />

// Disable auto-dismiss (user must click X)
<Toast autoDismiss={0} />
```

---

## Accessibility

✅ **ConfirmDialog:**
- ARIA labels on all interactive elements
- Escape key closes dialog
- Focus trap within dialog
- High contrast colors meet WCAG AA

✅ **Toast:**
- Role="status" for screen readers
- Visible close button (X)
- Auto-dismiss doesn't trap focus
- Color not the only indicator (icons used)

---

## Common Mistakes to Avoid

❌ **Don't:** Use window.confirm() anymore
```jsx
// OLD - Don't do this!
const ok = window.confirm('Continue?')
if (!ok) return
```

✅ **Do:** Use ConfirmDialog component
```jsx
// NEW - Use this instead
setConfirm({
  title: 'Continue?',
  message: 'Are you sure?',
  onConfirm: () => { /* ... */ }
})
```

---

❌ **Don't:** Show multiple toasts at once
```jsx
// Avoid this pattern
setToast({ type: 'success', message: 'Saved!' })
// User immediately does another action
setToast({ type: 'error', message: 'Failed!' }) // Replaces previous
```

✅ **Do:** Queue or wait for toast to auto-dismiss
```jsx
// Toast auto-dismisses after 3.5s
// User can manually close it
setToast({ type: 'success', message: 'Saved!' })
```

---

## Files Reference

| File | Purpose | Import Path |
|------|---------|-------------|
| `ConfirmDialog.jsx` | Confirmation modal | `'../../components/ConfirmDialog'` |
| `Toast.jsx` | Notification toast | `'../../components/Toast'` |
| `ThemeContext.jsx` | Dark/light mode | `'../../context/ThemeContext'` |

---

## Questions?

Refer to actual implementations in:
- `src/pages/admin/LoadAssignmentPage.jsx` (Toast + ConfirmDialog)
- `src/pages/admin/UsersPage.jsx` (ConfirmDialog with role changes)
- `src/pages/admin/SchedulerPage.jsx` (ConfirmDialog for schedule actions)
