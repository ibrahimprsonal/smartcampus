'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock } from 'lucide-react'

export default function WaitingApprovalPage() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="bg-yellow-100 p-3 rounded-full">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          <CardTitle>Waiting for Approval</CardTitle>
          <CardDescription>Your account has been created successfully.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Please wait while a CR or Admin reviews your registration. You will be able to access the dashboard once your account is approved.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
