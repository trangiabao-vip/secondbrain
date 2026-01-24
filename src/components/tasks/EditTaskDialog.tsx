

'use client';
import { useState, type ReactNode, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useAppContext } from '@/contexts/AppContext';
import { Icons } from '../icons';
import { format, setHours, setMinutes } from "date-fns";
import { vi } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { TaskStatus } from '@/lib/data';
import { AddOrEditTaskDialog } from './AddOrEditTaskDialog';

export function EditTaskDialog({ taskId, children }: { taskId: string, children: ReactNode }) {
  return (
    <AddOrEditTaskDialog mode="edit" taskId={taskId}>
      {children}
    </AddOrEditTaskDialog>
  )
}
