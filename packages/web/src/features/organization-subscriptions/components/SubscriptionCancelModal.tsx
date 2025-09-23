'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  AlertTriangleIcon,
  XCircleIcon,
  Loader2Icon,
  InfoIcon,
  CalendarIcon,
  UsersIcon,
  DatabaseIcon,
  ShieldIcon,
} from 'lucide-react';
import { useOrganizationDetails } from '../hooks/useOrganizationDetails';
import { useSubscriptionCancel } from '../hooks/useSubscriptionCancel';
import { format } from 'date-fns';

const cancellationReasons = [
  { value: 'too_expensive', label: 'Too expensive' },
  { value: 'not_using', label: 'Not using the service' },
  { value: 'switching_competitor', label: 'Switching to a competitor' },
  { value: 'missing_features', label: 'Missing required features' },
  { value: 'poor_support', label: 'Poor customer support' },
  { value: 'closing_business', label: 'Closing business' },
  { value: 'temporary_pause', label: 'Temporary pause needed' },
  { value: 'other', label: 'Other' },
];

const cancelSchema = z.object({
  reason: z.string().min(1, 'Please select a cancellation reason'),
  additionalNotes: z.string().optional(),
  immediateTermination: z.boolean().default(false),
  confirmUnderstanding: z.boolean().refine((val) => val === true, {
    message: 'You must confirm understanding of the cancellation impact',
  }),
});

type CancelFormData = z.infer<typeof cancelSchema>;

interface SubscriptionCancelModalProps {
  organizationId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubscriptionCancelModal({
  organizationId,
  isOpen,
  onOpenChange,
}: SubscriptionCancelModalProps) {
  const [step, setStep] = useState<'warning' | 'form'>('warning');

  const { data: organization, isLoading } = useOrganizationDetails(organizationId);
  const cancelMutation = useSubscriptionCancel(organizationId);

  const form = useForm<CancelFormData>({
    resolver: zodResolver(cancelSchema),
    defaultValues: {
      reason: '',
      additionalNotes: '',
      immediateTermination: false,
      confirmUnderstanding: false,
    },
  });

  const handleSubmit = async (data: CancelFormData) => {
    const notes = data.reason === 'other' && data.additionalNotes
      ? data.additionalNotes
      : `Reason: ${cancellationReasons.find(r => r.value === data.reason)?.label}. ${data.additionalNotes || ''}`;

    try {
      await cancelMutation.mutateAsync({
        reason: data.reason,
        immediateTermination: data.immediateTermination,
        notes: notes.trim(),
      });
      onOpenChange(false);
      form.reset();
      setStep('warning');
    } catch (error) {
      // Error is handled by the mutation hook
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    form.reset();
    setStep('warning');
  };

  const renderWarningStep = () => (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <AlertTriangleIcon className="h-5 w-5 text-destructive" />
          Cancel Subscription - Important Warning
        </DialogTitle>
        <DialogDescription>
          Please review the following information before proceeding with the cancellation.
        </DialogDescription>
      </DialogHeader>

      <div className="py-4 space-y-4">
        <Alert variant="destructive">
          <XCircleIcon className="h-4 w-4" />
          <AlertTitle>Cancellation Impact</AlertTitle>
          <AlertDescription>
            Cancelling this subscription will have immediate effects on the organization's access to the platform.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">What happens when you cancel:</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <UsersIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-sm">Access Restrictions</p>
                <p className="text-sm text-muted-foreground">
                  All users in the organization will lose access to premium features immediately or at the end of the billing period.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <DatabaseIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-sm">Data Retention</p>
                <p className="text-sm text-muted-foreground">
                  Organization data will be retained for 30 days after cancellation. After this period, data may be permanently deleted.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CalendarIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-sm">Billing</p>
                <p className="text-sm text-muted-foreground">
                  No refunds will be issued for the current billing period. The organization can continue to use the service until the end of the current period if not immediately terminated.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <ShieldIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-sm">Reactivation</p>
                <p className="text-sm text-muted-foreground">
                  The subscription can be reactivated within 30 days with all data intact. After 30 days, a new subscription must be created.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {organization && (
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Organization Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Organization:</span>
                <span className="font-medium">{organization.name}</span>
              </div>
              {organization.subscription && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current Plan:</span>
                    <span className="font-medium">
                      {organization.subscription.subscriptionPlanId}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={organization.subscription.isExpired ? 'destructive' : 'secondary'}>
                      {organization.subscription.isExpired ? 'Expired' : 'Active'}
                    </Badge>
                  </div>
                  {!organization.subscription.isExpired && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Expires:</span>
                      <span className="font-medium">
                        {format(new Date(organization.subscription.endDate), 'PPP')}
                      </span>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          variant="destructive"
          onClick={() => setStep('form')}
        >
          Continue with Cancellation
        </Button>
      </DialogFooter>
    </>
  );

  const renderFormStep = () => (
    <>
      <DialogHeader>
        <DialogTitle>Cancel Subscription</DialogTitle>
        <DialogDescription>
          Please provide the reason for cancellation and confirm your decision.
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Cancellation Reason */}
          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reason for Cancellation *</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a reason" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {cancellationReasons.map((reason) => (
                      <SelectItem key={reason.value} value={reason.value}>
                        {reason.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  This helps us understand and improve our service
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Additional Notes */}
          <FormField
            control={form.control}
            name="additionalNotes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Additional Comments {form.watch('reason') === 'other' && '*'}
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Please provide more details..."
                    className="resize-none"
                    rows={4}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  {form.watch('reason') === 'other'
                    ? 'Please explain the reason for cancellation'
                    : 'Optional: Provide any additional feedback or context'}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Immediate Termination */}
          <FormField
            control={form.control}
            name="immediateTermination"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Termination Timing</FormLabel>
                <FormControl>
                  <RadioGroup
                    value={field.value ? 'immediate' : 'end_of_period'}
                    onValueChange={(value) => field.onChange(value === 'immediate')}
                  >
                    <Card className={!field.value ? 'border-primary' : ''}>
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <RadioGroupItem value="end_of_period" id="end_of_period" className="mt-1" />
                          <div className="flex-1">
                            <Label htmlFor="end_of_period" className="cursor-pointer">
                              <div className="font-medium">Cancel at end of billing period</div>
                              <div className="text-sm text-muted-foreground mt-1">
                                Organization retains access until {organization?.subscription?.endDate && format(new Date(organization.subscription.endDate), 'PPP')}
                              </div>
                            </Label>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className={field.value ? 'border-primary' : ''}>
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <RadioGroupItem value="immediate" id="immediate" className="mt-1" />
                          <div className="flex-1">
                            <Label htmlFor="immediate" className="cursor-pointer">
                              <div className="font-medium">Cancel immediately</div>
                              <div className="text-sm text-muted-foreground mt-1">
                                Organization loses access right away (no refund for remaining time)
                              </div>
                            </Label>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Confirmation */}
          <FormField
            control={form.control}
            name="confirmUnderstanding"
            render={({ field }) => (
              <FormItem>
                <Alert>
                  <InfoIcon className="h-4 w-4" />
                  <AlertTitle>Final Confirmation Required</AlertTitle>
                  <AlertDescription className="space-y-3">
                    <p>By proceeding with this cancellation, you acknowledge that:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>The organization will lose access to premium features</li>
                      <li>No refund will be issued for the current billing period</li>
                      <li>Data will be retained for 30 days only</li>
                      <li>This action cannot be undone immediately</li>
                    </ul>
                    <div className="flex items-start space-x-2 mt-3">
                      <Checkbox
                        id="confirm"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                      <Label htmlFor="confirm" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        I understand and accept the cancellation terms
                      </Label>
                    </div>
                  </AlertDescription>
                </Alert>
                <FormMessage />
              </FormItem>
            )}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep('warning')}
              disabled={cancelMutation.isPending}
            >
              Back
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={cancelMutation.isPending || !form.watch('confirmUnderstanding')}
            >
              {cancelMutation.isPending && <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />}
              {cancelMutation.isPending ? 'Cancelling...' : 'Confirm Cancellation'}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {step === 'warning' && renderWarningStep()}
            {step === 'form' && renderFormStep()}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}