import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bell, ClipboardList, MessageSquare, Users } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single()

  // Summary stats (placeholder logic)
  const stats = [
    { name: 'Active Notices', value: '12', icon: Bell, color: 'text-blue-600' },
    { name: 'Upcoming Deadlines', value: '4', icon: ClipboardList, color: 'text-orange-600' },
    { name: 'Discussion Posts', value: '28', icon: MessageSquare, color: 'text-green-600' },
  ]

  if (profile?.role === 'cr' || profile?.role === 'acr' || profile?.role === 'super_admin') {
    stats.push({ name: 'Pending Approvals', value: '3', icon: Users, color: 'text-purple-600' })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <p className="text-gray-500">Welcome to your Smart Campus dashboard.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <Card key={item.name}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-500">{item.name}</CardTitle>
              <item.icon className={`h-4 w-4 ${item.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Notices</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 italic">No recent notices found for your section.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Deadlines</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 italic">No upcoming deadlines.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
