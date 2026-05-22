import { useState } from 'react'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { supabase } from '../../lib/supabase'
import PostColumn from './PostColumn'
import PostCard from './PostCard'

const STATUSES = ['idea', 'draft', 'review', 'scheduled', 'live']

export default function PostBoard({ posts, setPosts, onPostClick }) {
  const [activePost, setActivePost] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  function handleDragStart(event) {
    const post = posts.find(p => p.id === event.active.id)
    setActivePost(post ?? null)
  }

  async function handleDragEnd(event) {
    const { active, over } = event
    setActivePost(null)
    if (!over || !STATUSES.includes(over.id)) return

    const postId    = active.id
    const newStatus = over.id
    const post      = posts.find(p => p.id === postId)
    if (!post || post.status === newStatus) return

    const patch = { status: newStatus }
    if (newStatus === 'live') patch.published_at = new Date().toISOString()

    setPosts(prev => prev.map(p => p.id === postId ? { ...p, ...patch } : p))
    await supabase.from('posts').update(patch).eq('id', postId).catch(() => null)
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActivePost(null)}
    >
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {STATUSES.map(status => (
          <PostColumn
            key={status}
            status={status}
            posts={posts.filter(p => p.status === status)}
            onPostClick={onPostClick}
          />
        ))}
      </div>

      <DragOverlay>
        {activePost ? <PostCard post={activePost} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
