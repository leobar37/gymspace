'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { CheckCircle2, Calendar, AlertCircle, Building2 } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useProcessRequest, type SubscriptionRequest } from '@/features/admin/subscriptions/hooks/useRequestManagement';
import { useSubscriptionPlans } from '@/features/admin/subscriptions/hooks/useSubscriptionPlans';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ApproveRequestModalProps {
  request: SubscriptionRequest;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ApproveRequestModal({ 
  request, 
  open, 
  onClose, 
  onSuccess 
}: ApproveRequestModalProps) {
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    request.requestedPlanId || ''
  );

  const processRequest = useProcessRequest();
  const { data: plans } = useSubscriptionPlans();

  const handleApprove = async () => {
    await processRequest.mutateAsync({
      requestId: request.id,
      data: {
        action: 'approve',
        startDate,
        notes: notes || undefined,
      },
    });

    onSuccess();
  };

  const getImpactDescription = () => {
    if (request.action === 'upgrade') {
      return 'This will immediately upgrade the organization to the new plan with enhanced features and limits.';
    } else if (request.action === 'downgrade') {
      return 'This will downgrade the organization at the end of the current billing cycle. Some features may become unavailable.';
    } else if (request.action === 'cancel') {
      return 'This will cancel the organization\'s subscription. They will lose access at the end of the current billing period.';
    }
    return '';
  };

  const getPlanDetails = () => {
    if (!selectedPlanId || !plans) return null;
    return plans.find(p => p.id === selectedPlanId);
  };

  const selectedPlan = getPlanDetails();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Approve Subscription Request
          </DialogTitle>
          <DialogDescription>
            Review and approve the subscription change request
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Organization Details */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <Label>Organization Details</Label>
            </div>
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Organization</p>
                    <p className="font-medium">{request.organizationName}</p>
                  </div>
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
                    <p className="text-sm text-muted-foreground">Current Plan</p>
                    <p className="font-medium">{request.currentPlanName || 'None'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Requested Plan</p>
                    <p className="font-medium">{request.requestedPlanName || 'Cancellation'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Requested By</p>
                    <p className="font-medium">{request.requestedBy}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Requested On</p>
                    <p className="font-medium">
                      {format(new Date(request.requestedAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Plan Selection (if needed) */}
          {request.action !== 'cancel' && plans && (
            <div className="space-y-2">
              <Label htmlFor="plan">Target Plan</Label>
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - ${plan.price}/{plan.billingCycle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedPlan && (
                <div className="mt-2 p-3 border rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{selectedPlan.name}</span>
                    <Badge>${selectedPlan.price}/{selectedPlan.billingCycle}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>• Max Gyms: {selectedPlan.maxGyms}</p>
                    <p>• Max Users: {selectedPlan.maxUsers}</p>
                    <p>• Max Clients: {selectedPlan.maxClients}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <Separator />

          {/* Approval Settings */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Effective Date
              </Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
              <p className="text-xs text-muted-foreground">
                When should this change take effect?
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Admin Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this approval..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Impact Alert */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Impact of Approval</AlertTitle>
            <AlertDescription>
              {getImpactDescription()}
            </AlertDescription>
          </Alert>

          {/* Request Notes */}
          {request.notes && (
            <div className="space-y-2">
              <Label>Request Notes</Label>
              <div className="p-3 border rounded-lg bg-muted/50">
                <p className="text-sm">{request.notes}</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleApprove}
            disabled={processRequest.isPending || (!selectedPlanId && request.action !== 'cancel')}
          >
            {processRequest.isPending ? 'Approving...' : 'Approve Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}