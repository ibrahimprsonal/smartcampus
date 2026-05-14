'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { MessageSquare, UserPlus, Check, X, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

export default function MessagesPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<any>(null)

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

  // Fetch pending requests where I am the receiver
  const { data: pendingRequests, mutate: mutateRequests } = useSWR(
    profile ? 'pending-requests' : null,
    async () => {
      const { data, error } = await supabase
        .from('message_requests')
        .select('*, profiles:sender_id(id, full_name, role)')
        .eq('receiver_id', profile.id)
        .eq('status', 'pending')
      if (error) throw error
      return data
    }
  )

  // Fetch accepted conversations
  const { data: conversations } = useSWR(
    profile ? 'accepted-conversations' : null,
    async () => {
      const { data, error } = await supabase
        .from('message_requests')
        .select('*, sender:sender_id(id, full_name), receiver:receiver_id(id, full_name)')
        .eq('status', 'accepted')
        .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
      if (error) throw error
      return data
    }
  )

  const handleRequestAction = async (requestId: string, action: 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('message_requests')
        .update({ status: action })
        .eq('id', requestId)

      if (error) {
        toast.error(error.message)
      } else {
        toast.success(`Request ${action}.`)
        mutateRequests()
      }
    } catch (err) {
      toast.error('An error occurred.')
    }
  }

  // Search for users to message
  const { data: searchResults } = useSWR(
    searchQuery.length > 2 ? `search-users-${searchQuery}` : null,
    async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, department, semester, section')
        .ilike('full_name', `%${searchQuery}%`)
        .neq('id', profile.id)
        .limit(5)
      if (error) throw error
      return data
    }
  )

  const handleSendRequest = async (receiverId: string) => {
    try {
      const { error } = await supabase
        .from('message_requests')
        .insert({ sender_id: profile.id, receiver_id: receiverId })

      if (error) {
        toast.error('You already have a pending request with this user.')
      } else {
        toast.success('Conversation request sent!')
        setSearchQuery('')
      }
    } catch (err) {
      toast.error('An error occurred.')
    }
  }

  if (!profile) return <div>Loading...</div>

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Messages</h1>

      <Tabs defaultValue="chats">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chats">Chats</TabsTrigger>
          <TabsTrigger value="requests">
            Requests {pendingRequests?.length ? `(${pendingRequests.length})` : ''}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chats" className="space-y-4">
          <div className="flex flex-col gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input 
                placeholder="Search users to message..." 
                className="pl-8"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            {searchResults && searchResults.length > 0 && (
              <div className="bg-white border rounded-md shadow-sm z-10">
                {searchResults.map((user: any) => (
                  <div key={user.id} className="p-3 flex items-center justify-between border-b last:border-0">
                    <div>
                      <div className="font-medium text-sm">{user.full_name}</div>
                      <div className="text-xs text-gray-500">
                        {user.role} • {user.department} {user.section}
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => handleSendRequest(user.id)}>
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            {conversations?.map((conv: any) => {
              const otherUser = conv.sender_id === profile.id ? conv.receiver : conv.sender
              return (
                <Link key={conv.id} href={`/dashboard/messages/${otherUser.id}`}>
                  <Card className="cursor-pointer hover:bg-gray-50 mb-2">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                          {otherUser.full_name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium">{otherUser.full_name}</div>
                          <div className="text-xs text-gray-500 italic">Open conversation</div>
                        </div>
                      </div>
                      <MessageSquare className="h-5 w-5 text-gray-300" />
                    </CardContent>
                  </Card>
                </Link>
              )
            })}

            {conversations?.length === 0 && !searchQuery && (
              <div className="text-center py-20 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No active conversations. Start one by searching above!</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="requests">
          <div className="space-y-4">
            {pendingRequests?.map((req: any) => (
              <Card key={req.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">
                      {req.profiles.full_name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium">{req.profiles.full_name}</div>
                      <div className="text-xs text-gray-500 capitalize">{req.profiles.role} wants to message you</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleRequestAction(req.id, 'accepted')}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleRequestAction(req.id, 'rejected')}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {pendingRequests?.length === 0 && (
              <div className="text-center py-20 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No pending message requests.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
