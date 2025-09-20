'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { XCircle, AlertTriangle, Building2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useProcessRequest, type SubscriptionRequest } from '@/features/admin/subscriptions/hooks/useRequestManagement';

interface RejectRequestModalProps {
  request: SubscriptionRequest;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const REJECTION_REASONS = [
  {
    value: 'insufficient_justification',
    label: 'Insufficient Justification',
    description: 'The request lacks proper justification or business case',
  },
  {
    value: 'payment_issues',
    label: 'Payment Issues',
    description: 'Outstanding payments or credit issues',
  },
  {
    value: 'usage_limits',
    label: 'Usage Limit Concerns',
    description: 'Current usage does not justify the requested change',
  },
  {
    value: 'pending_review',
    label: 'Pending Internal Review',
    description: 'Request needs further internal review and approval',
  },
  {
    value: 'not_eligible',
    label: 'Not Eligible',
    description: 'Organization does not meet eligibility criteria',
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Other reasons (please specify in notes)',
  },
];

export function RejectRequestModal({ 
  request, 
  open, 
  onClose, 
  onSuccess 
}: RejectRequestModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [notes, setNotes] = useState('');

  const processRequest = useProcessRequest();

  const handleReject = async () => {
    if (!selectedReason) {
      return;
    }

    const reason = REJECTION_REASONS.find(r => r.value === selectedReason);
    const rejectionReason = reason?.label || selectedReason;
    const fullNotes = reason?.value === 'other' && notes 
      ? notes 
      : `${rejectionReason}${notes ? `: ${notes}` : ''}`;

    await processRequest.mutateAsync({
      requestId: request.id,
      data: {
        action: 'reject',
        rejectionReason: fullNotes,
        notes: notes || undefined,
      },
    });

    onSuccess();
  };

  const getRequestDescription = () => {
    if (request.action === 'upgrade') {
      return `${request.organizationName} is requesting an upgrade from ${request.currentPlanName || 'Free'} to ${request.requestedPlanName}.`;
    } else if (request.action === 'downgrade') {
      return `${request.organizationName} is requesting a downgrade from ${request.currentPlanName} to ${request.requestedPlanName}.`;
    } else if (request.action === 'cancel') {
      return `${request.organizationName} is requesting to cancel their ${request.currentPlanName} subscription.`;
    }
    return '';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            Reject Subscription Request
          </DialogTitle>
          <DialogDescription>
            Provide a reason for rejecting this subscription change request
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Organization Details */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <Label>Request Details</Label>
            </div>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <p className="text-sm">{getRequestDescription()}</p>
                  
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                    <div>
                      <p className="text-sm text-muted-foreground">Request Type</p>
                      <Badge variant={
                        request.action === 'upgrade' ? 'default' : 
                        request.action === 'downgrade' ? 'secondary' : 
                        'destructive'
                      }>
                        {request.action}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Requested By</p>
                      <p className="font-medium">{request.requestedBy}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Requested On</p>
                      <p className="font-medium">
                        {format(new Date(request.requestedAt), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Days Pending</p>
                      <p className="font-medium">
                        {Math.floor(
                          (Date.now() - new Date(request.requestedAt).getTime()) / 
                          (1000 * 60 * 60 * 24)
                        )} days
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Request Notes */}
          {request.notes && (
            <div className="space-y-2">
              <Label>Original Request Notes</Label>
              <div className="p-3 border rounded-lg bg-muted/50">
                <p className="text-sm">{request.notes}</p>
              </div>
            </div>
          )}

          {/* Rejection Reason */}
          <div className="space-y-3">
            <Label>Rejection Reason *</Label>
            <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
              {REJECTION_REASONS.map((reason) => (
                <div key={reason.value} className="flex items-start space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value={reason.value} id={reason.value} className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor={reason.value} className="font-medium cursor-pointer">
                      {reason.label}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      {reason.description}
                    </p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">
              Additional Notes {selectedReason === 'other' && '*'}
            </Label>
            <Textarea
              id="notes"
              placeholder={
                selectedReason === 'other' 
                  ? 'Please provide specific reason for rejection...' 
                  : 'Add any additional context or feedback (optional)...'
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              required={selectedReason === 'other'}
            />
          </div>

          {/* Warning Alert */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Impact of Rejection</AlertTitle>
            <AlertDescription>
              The organization will be notified via email about the rejection.
              They may submit a new request with additional justification or contact support.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={
              processRequest.isPending || 
              !selectedReason || 
              (selectedReason === 'other' && !notes.trim())
            }
          >
            {processRequest.isPending ? 'Rejecting...' : 'Reject Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}