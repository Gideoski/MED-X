import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert } from "lucide-react";
import { formatNumber } from "@/lib/utils";

const users = [
  { id: 1, name: "John Doe", email: "john@example.com", plan: "Premium", status: "Active" },
  { id: 2, name: "Jane Smith", email: "jane@example.com", plan: "Free", status: "Active" },
  { id: 3, name: "Sam Wilson", email: "sam@example.com", plan: "Free", status: "Inactive" },
];

const content = [
  { id: '101', title: "Intro to Human Anatomy", level: "100", downloads: 1205 },
  { id: '102', title: "Medical Biochemistry Basics", level: "100", downloads: 850 },
  { id: '201', title: "Advanced Pharmacology", level: "200", downloads: 2103 },
];

export default function AdminPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <ShieldAlert className="h-10 w-10 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage users, content, and site settings.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(users.length)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Premium Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(users.filter(u => u.plan === 'Premium').length)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(content.length)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(content.reduce((acc, c) => acc + c.downloads, 0))}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>View and manage all registered users.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(user => (
                <TableRow key={user.id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.plan === 'Premium' ? 'default' : 'secondary'}>{user.plan}</Badge>
                  </TableCell>
                  <TableCell>
                     <Badge variant={user.status === 'Active' ? 'outline' : 'destructive'}>{user.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
