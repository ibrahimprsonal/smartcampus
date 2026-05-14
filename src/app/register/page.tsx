'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'student',
    studentId: '',
    department: '',
    semester: '',
    section: '',
    whatsappNumber: '',
    address: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleRoleChange = (value: string | null) => {
    setFormData({ ...formData, role: value ?? 'student' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 1. Validation Logic
      if (formData.password.length < 8) {
        toast.error('Password must be at least 8 characters.')
        setLoading(false)
        return
      }

      if (['student', 'cr', 'acr'].includes(formData.role) && !formData.studentId) {
        toast.error('Student ID is mandatory for students and CRs.')
        setLoading(false)
        return
      }

      // 2. Check for duplicate Student ID (if applicable)
      if (formData.studentId) {
        const { data: existingStudent } = await supabase
          .from('profiles')
          .select('id')
          .eq('student_id', formData.studentId)
          .single()

        if (existingStudent) {
          toast.error('Student ID already exists.')
          setLoading(false)
          return
        }
      }

      // 3. Supabase Auth Signup
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: formData.role,
          },
        },
      })

      if (error) {
        toast.error(error.message)
        setLoading(false)
        return
      }

      if (data.user) {
        // 4. Update the profile with extra fields (since the trigger only does basic metadata)
        // Note: The trigger handle_new_user runs AFTER insert into auth.users.
        // We might need to wait a tiny bit or just update it here.
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            student_id: formData.studentId || null,
            department: formData.department,
            semester: formData.semester,
            section: formData.section,
            whatsapp_number: formData.whatsappNumber,
            address: formData.address,
          })
          .eq('id', data.user.id)

        if (profileError) {
          console.error('Error updating profile:', profileError)
        }

        toast.success('Registration successful! Waiting for approval.')
        router.push('/login')
      }
    } catch (err) {
      toast.error('An unexpected error occurred.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const isStudentRole = ['student', 'cr', 'acr'].includes(formData.role)

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Register for Smart Campus</CardTitle>
          <CardDescription>Create your account to join your campus community.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" name="fullName" required value={formData.fullName} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required value={formData.email} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password (Min 8 chars)</Label>
              <Input id="password" name="password" type="password" required value={formData.password} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select onValueChange={handleRoleChange} defaultValue="student">
                <SelectTrigger>
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="cr">CR</SelectItem>
                  <SelectItem value="acr">ACR</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {isStudentRole && (
              <div className="space-y-2">
                <Label htmlFor="studentId">Student ID</Label>
                <Input id="studentId" name="studentId" required value={formData.studentId} onChange={handleChange} />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input id="department" name="department" required value={formData.department} onChange={handleChange} />
            </div>
            {isStudentRole && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="semester">Semester</Label>
                  <Input id="semester" name="semester" required value={formData.semester} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="section">Section</Label>
                  <Input id="section" name="section" required value={formData.section} onChange={handleChange} />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
              <Input id="whatsappNumber" name="whatsappNumber" type="tel" required value={formData.whatsappNumber} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address (Optional)</Label>
              <Input id="address" name="address" value={formData.address} onChange={handleChange} />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Registering...' : 'Register'}
            </Button>
            <Button variant="link" onClick={() => router.push('/login')}>
              Already have an account? Login
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
