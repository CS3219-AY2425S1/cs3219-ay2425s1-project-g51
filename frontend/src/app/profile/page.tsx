'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { verifyToken, updateUser } from '@/lib/api-user'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Loader2, User } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [userData, setUserData] = useState({
    id: "",
    username: "",
    email: "",
  });
  const [originalUserData, setOriginalUserData] = useState(userData);
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Unauthorized access, please login!')
        router.push('/login')
        return
      }
      try {
        const res: any = await verifyToken(token)
        const fetchedData = { id: res.data.id, username: res.data.username, email: res.data.email };
        setUserData(fetchedData);
        setOriginalUserData(fetchedData);
        setLoading(false)
      } catch (error: any) {
        toast.error(error.message || 'User verification failed, please login again!')
        router.push('/login')
      }
    }

    fetchUserData()
  }, [router])

  if (loading) {
    return <div className="w-screen h-screen flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin" />
    </div>
  }

  const handleEdit = () => {
    setIsEditing(!isEditing)
    if (!isEditing) {
      setOriginalUserData(userData);
    }
  }

  const validateInput = () => {
    if (!userData.username.trim()) {
      toast.error('Username cannot be empty.')
      return false
    }
    if (!userData.email.trim()) {
      toast.error('Email cannot be empty.')
      return false
    }

    return true
  }

  const handleSave = async () => {
    if (!validateInput()) {
      return
    }

    setIsEditing(false)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('You need to be logged in.')
        return
      }
      const res = await updateUser(userData.id, token, userData)
      if (res.status === 200) {
        toast.success('Profile updated successfully, please login again!')
        localStorage.removeItem('token')
        router.push('/login')
      } else {
        toast.error('Failed to update profile')
        setUserData(originalUserData);
      }
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error('An error occurred while updating your profile.')
      setUserData(originalUserData);
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserData({
      ...userData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto mt-8 p-4">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <Avatar className="w-24 h-24 mx-auto">
              <AvatarFallback><User className="w-1/2 h-1/2" strokeWidth={1} /></AvatarFallback>
            </Avatar>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    name="username"
                    value={userData.username}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={userData.email}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  {isEditing ? (
                    <>
                      <Button variant="outline" onClick={handleEdit}>Cancel</Button>
                      <Button className="bg-primary text-primary-foreground" onClick={handleSave}>Save</Button>
                    </>
                  ) : (
                    <Button className="bg-primary text-primary-foreground" onClick={handleEdit}>Edit</Button>
                  )}
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
