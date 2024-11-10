import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updatePassword, loginUser } from '@/lib/api-user';
import { toast } from 'react-hot-toast';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { verifyToken } from '@/lib/api-user';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({ isOpen, onClose }) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirmation do not match!");
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('You must be logged in to change your password!');
      router.push('/login');
      return;
    }
    try {
      setLoading(true);
      const res: any = await verifyToken(token);
      const userId = res.data.id;
      const userEmail = res.data.email;
      try {
        const loginRes = await loginUser(userEmail, currentPassword);
      } catch (error) {
        throw new Error("Current password is incorrect!");
      }
      await updatePassword(userId, token, newPassword);
      toast.success("Password updated successfully! Please login again.");
      localStorage.removeItem('token');
      router.push('/login');
    } catch (error: any) {
      toast.error(error.message || "Failed to update password!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
        </DialogHeader>
        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="space-y-2">
              <Label htmlFor="current">Current Password</Label>
              <Input
                id="current"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new">New Password</Label>
              <Input
                id="new"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm New Password</Label>
              <Input
                id="confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handlePasswordChange} disabled={loading}>
                {loading ? "Updating..." : "Change Password"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
