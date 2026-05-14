'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        toast.error(error.message)
        setLoading(false)
        return
      }

      if (data.user) {
        // Fetch user profile to check status
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('status, role')
          .eq('id', data.user.id)
          .single()

        if (profileError) {
          toast.error('Error fetching user profile.')
          setLoading(false)
          return
        }

        if (profile.status === 'pending') {
          toast.info('Your account is pending approval.')
          router.push('/waiting-approval')
        } else if (profile.status === 'rejected' || profile.status === 'banned') {
          await supabase.auth.signOut()
          toast.error(`Your account has been ${profile.status}.`)
        } else {
          toast.success('Login successful!')
          router.push('/dashboard')
        }
      }
    } catch (err) {
      toast.error('An unexpected error occurred.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login to Smart Campus</CardTitle>
          <CardDescription>Enter your credentials to access your dashboard.</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
            <Button variant="link" onClick={() => router.push('/register')}>
              Don&apos;t have an account? Register
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
