"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface StartSessionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  matchedUsers: string[];
}

const StartSessionDialog: React.FC<StartSessionDialogProps> = ({ isOpen, onClose, matchedUsers }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Session Ready</DialogTitle>
          <DialogDescription>Match found! Ready to start your session?</DialogDescription>
        </DialogHeader>
        <div>
          {/* <p>Matched with: {matchedUsers.join(", ")}</p> */}
          <p>Matched with: {matchedUsers}</p>
        </div>
        <DialogFooter>
          <Button>Start Session</Button>
          <Button onClick={onClose} variant="outline">Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StartSessionDialog;
