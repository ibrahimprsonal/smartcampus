'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'

export default function CreateNoticePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<any>(null)

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'notice',
    deadlineAt: '',
    isGlobal: false,
    targetDepartment: '',
    targetSemester: '',
    targetSection: '',
  })

  const [links, setLinks] = useState<{ url: string; buttonText: string }[]>([])

  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setProfile(data)
        if (data.role === 'cr' || data.role === 'acr') {
          setFormData(prev => ({
            ...prev,
            targetDepartment: data.department,
            targetSemester: data.semester,
            targetSection: data.section
          }))
        }
      }
    }
    getProfile()
  }, [supabase])

  const handleAddLink = () => {
    setLinks([...links, { url: '', buttonText: '' }])
  }

  const handleRemoveLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index))
  }

  const handleLinkChange = (index: number, field: string, value: string) => {
    const newLinks = [...links]
    newLinks[index] = { ...newLinks[index], [field]: value }
    setLinks(newLinks)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: notice, error: noticeError } = await supabase
        .from('notices')
        .insert({
          title: formData.title,
          content: formData.content,
          type: formData.type,
          deadline_at: formData.type === 'deadline' ? formData.deadlineAt : null,
          is_global: formData.isGlobal,
          target_department: formData.isGlobal ? null : formData.targetDepartment,
          target_semester: formData.isGlobal ? null : formData.targetSemester,
          target_section: formData.isGlobal ? null : formData.targetSection,
          created_by: profile.id
        })
        .select()
        .single()

      if (noticeError) throw noticeError

      if (links.length > 0) {
        const linksToInsert = links.map((link, index) => ({
          notice_id: notice.id,
          url: link.url,
          button_text: link.buttonText,
          sort_order: index
        }))
        const { error: linksError } = await supabase.from('notice_links').insert(linksToInsert)
        if (linksError) throw linksError
      }

      toast.success('Notice created successfully!')
      router.push('/dashboard/notices')
    } catch (err: any) {
      toast.error(err.message || 'An error occurred.')
    } finally {
      setLoading(false)
    }
  }

  if (!profile) return <div>Loading...</div>

  const isAdminOrTeacher = profile.role === 'super_admin' || profile.role === 'teacher'

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Create New Notice</h1>
      <Card>
        <form onSubmit={handleSubmit}>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Notice Type</Label>
                <Select 
                  defaultValue="notice" 
                  onValueChange={v => setFormData({ ...formData, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="notice">Regular Notice</SelectItem>
                    <SelectItem value="deadline">Deadline / Task</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.type === 'deadline' && (
                <div className="space-y-2">
                  <Label htmlFor="deadline">Due Date</Label>
                  <Input 
                    id="deadline" 
                    type="datetime-local" 
                    required 
                    value={formData.deadlineAt}
                    onChange={e => setFormData({ ...formData, deadlineAt: e.target.value })}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input 
                id="title" 
                required 
                value={formData.title} 
                onChange={e => setFormData({ ...formData, title: e.target.value })} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea 
                id="content" 
                required 
                rows={5}
                value={formData.content} 
                onChange={e => setFormData({ ...formData, content: e.target.value })} 
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="isGlobal" 
                disabled={!isAdminOrTeacher}
                checked={formData.isGlobal}
                onCheckedChange={(checked) => setFormData({ ...formData, isGlobal: !!checked })}
              />
              <Label htmlFor="isGlobal">Global Notice (Visible to everyone)</Label>
            </div>

            {!formData.isGlobal && (
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Input 
                    disabled={profile.role !== 'super_admin' && profile.role !== 'teacher'}
                    value={formData.targetDepartment}
                    onChange={e => setFormData({ ...formData, targetDepartment: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Semester</Label>
                  <Input 
                    disabled={profile.role !== 'super_admin' && profile.role !== 'teacher'}
                    value={formData.targetSemester}
                    onChange={e => setFormData({ ...formData, targetSemester: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Section</Label>
                  <Input 
                    disabled={profile.role !== 'super_admin' && profile.role !== 'teacher'}
                    value={formData.targetSection}
                    onChange={e => setFormData({ ...formData, targetSection: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="space-y-4 border-t pt-4">
              <div className="flex justify-between items-center">
                <Label>Action Links (Optional)</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddLink}>
                  <Plus className="h-4 w-4 mr-1" /> Add Link
                </Button>
              </div>
              {links.map((link, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Button Text</Label>
                    <Input 
                      placeholder="e.g. View Result" 
                      value={link.buttonText}
                      onChange={e => handleLinkChange(index, 'buttonText', e.target.value)}
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">URL</Label>
                    <Input 
                      placeholder="https://..." 
                      value={link.url}
                      onChange={e => handleLinkChange(index, 'url', e.target.value)}
                    />
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveLink(index)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating...' : 'Post Notice'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
