'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { MessageSquare, Send } from 'lucide-react'

export default function DiscussionPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [newPost, setNewPost] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setProfile(data)
      }
    }
    getProfile()
  }, [supabase])

  const { data: posts, mutate } = useSWR(
    profile ? 'discussion-posts' : null,
    async () => {
      const { data, error } = await supabase
        .from('discussion_posts')
        .select('*, profiles(full_name, role)')
        .eq('department', profile.department)
        .eq('semester', profile.semester)
        .eq('section', profile.section)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    }
  )

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPost.trim()) return

    setSubmitting(true)
    try {
      const { error } = await supabase.from('discussion_posts').insert({
        content: newPost,
        author_id: profile.id,
        department: profile.department,
        semester: profile.semester,
        section: profile.section
      })

      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Post shared!')
        setNewPost('')
        mutate()
      }
    } catch (err) {
      toast.error('An error occurred.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!profile) return <div>Loading...</div>

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Section Discussion</h1>
        <p className="text-gray-500">Chat with your classmates in {profile.department} - Section {profile.section}.</p>
      </div>

      <Card>
        <form onSubmit={handlePost}>
          <CardContent className="pt-6">
            <Textarea 
              placeholder="What's on your mind?" 
              value={newPost}
              onChange={e => setNewPost(e.target.value)}
              rows={3}
            />
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={submitting || !newPost.trim()}>
              <Send className="h-4 w-4 mr-2" />
              {submitting ? 'Posting...' : 'Post'}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <div className="space-y-4">
        {posts?.map((post: any) => (
          <Card key={post.id}>
            <CardHeader className="py-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                    {post.profiles.full_name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold">{post.profiles.full_name}</div>
                    <div className="text-xs text-gray-500 capitalize">{post.profiles.role}</div>
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(post.created_at).toLocaleString()}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{post.content}</p>
            </CardContent>
          </Card>
        ))}

        {posts?.length === 0 && (
          <div className="text-center py-20 bg-gray-50 rounded-lg border-2 border-dashed">
            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No posts yet. Start the conversation!</p>
          </div>
        )}
      </div>
    </div>
  )
}
