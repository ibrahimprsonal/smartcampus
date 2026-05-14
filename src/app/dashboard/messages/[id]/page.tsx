'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Send, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const otherUserId = params.id as string
  
  const [profile, setProfile] = useState<any>(null)
  const [otherUser, setOtherUser] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    async function initChat() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const { data: myProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(myProfile)
      
      const { data: otherProfile } = await supabase.from('profiles').select('*').eq('id', otherUserId).single()
      setOtherUser(otherProfile)

      // Fetch existing messages
      const { data: initialMessages } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true })

      setMessages(initialMessages || [])
      setLoading(false)
      setTimeout(scrollToBottom, 100)
    }

    initChat()

    // Realtime subscription
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const msg = payload.new
          if (
            (msg.sender_id === otherUserId) || 
            (msg.receiver_id === otherUserId)
          ) {
            setMessages((prev) => [...prev, msg])
            setTimeout(scrollToBottom, 100)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, otherUserId])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !profile) return

    const content = newMessage
    setNewMessage('')

    const { error } = await supabase.from('messages').insert({
      sender_id: profile.id,
      receiver_id: otherUserId,
      content: content
    })

    if (error) {
      toast.error('Failed to send message.')
      setNewMessage(content)
    }
  }

  if (loading) return <div>Loading chat...</div>
  if (!otherUser) return <div>User not found.</div>

  return (
    <div className="max-w-2xl mx-auto h-[calc(100vh-120px)] flex flex-col">
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="border-b py-3 px-4 flex flex-row items-center gap-3 space-y-0">
          <Link href="/dashboard/messages" className="md:hidden">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
            {otherUser.full_name.charAt(0)}
          </div>
          <div>
            <CardTitle className="text-lg">{otherUser.full_name}</CardTitle>
            <p className="text-xs text-gray-500 capitalize">{otherUser.role} • {otherUser.department}</p>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => {
            const isMe = msg.sender_id === profile.id
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[75%] rounded-lg px-4 py-2 ${
                    isMe 
                      ? 'bg-blue-600 text-white rounded-br-none' 
                      : 'bg-gray-100 text-gray-800 rounded-bl-none'
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </CardContent>

        <CardFooter className="border-t p-3">
          <form onSubmit={handleSendMessage} className="flex w-full gap-2">
            <Input 
              placeholder="Type a message..." 
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={!newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  )
}
