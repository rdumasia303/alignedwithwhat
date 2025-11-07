import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return num.toString()
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  }
  return `${seconds}s`
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    completed: 'text-green-500',
    running: 'text-blue-500',
    pending: 'text-yellow-500',
    failed: 'text-red-500',
    error: 'text-red-500',
  }
  return colors[status.toLowerCase()] || 'text-gray-500'
}

export function getStatusBg(status: string): string {
  const colors: Record<string, string> = {
    completed: 'bg-green-500/10 border-green-500/20',
    running: 'bg-blue-500/10 border-blue-500/20',
    pending: 'bg-yellow-500/10 border-yellow-500/20',
    failed: 'bg-red-500/10 border-red-500/20',
    error: 'bg-red-500/10 border-red-500/20',
  }
  return colors[status.toLowerCase()] || 'bg-gray-500/10 border-gray-500/20'
}
