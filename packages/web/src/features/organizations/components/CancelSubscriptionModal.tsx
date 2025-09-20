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
import { Button } from '@/components/ui/button';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertTriangleIcon,
  BanIcon,
  CalendarOffIcon,
  DollarSignIcon,
  InfoIcon,
  AlertCircleIcon,
  ShieldOffIcon,
  DatabaseIcon,
} from 'lucide-react';
import { useCancelSubscription, useCancellationReasons } from '../hooks/useSubscriptionOperations';
import {
  OrganizationSubscriptionDetailsDto,
  CancellationReason,
} from '@gymspace/sdk';
import { formatCurrency, formatDate } from '@/lib/utils';

const formSchema = z.object({
  reason: z.string().min(1, 'Please select a reason for cancellation'),
  reasonDescription: z.string().optional(),
  cancellationType: z.enum(['immediate', 'end_of_period']),
  confirmDataLoss: z.boolean(),
  confirmCancellation: z.boolean(),
  retentionOffered: z.boolean().default(false),
  retentionDetails: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CancelSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  organization: OrganizationSubscriptionDetailsDto;
}

export function CancelSubscriptionModal({
  isOpen,
  onClose,
  organization,
}: CancelSubscriptionModalProps) {
  const [showRetentionDetails, setShowRetentionDetails] = useState(false);
  const cancelSubscription = useCancelSubscription();
  const cancellationReasons = useCancellationReasons();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reason: '',
      reasonDescription: '',
      cancellationType: 'end_of_period',
      confirmDataLoss: false,
      confirmCancellation: false,
      retentionOffered: false,
      retentionDetails: '',
    },
  });

  const currentPlan = organization.plan;
  const currentSubscription = organization.currentSubscription;
  const usage = organization.usage;

  // Calculate refund amount for immediate cancellation
  const calculateRefundAmount = () => {
    if (!currentPlan || !currentSubscription) return 0;
    
    const endDate = new Date(currentSubscription.endDate);
    const today = new Date();
    const remainingDays = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    
    // Calculate based on 30-day month
    const totalDays = 30;
    const dailyRate = (currentPlan.price[organization.organization.currency] || 0) / totalDays;
    const refundAmount = dailyRate * remainingDays;
    
    return refundAmount;
  };

  const onSubmit = async (data: FormData) => {
    if (!data.confirmDataLoss || !data.confirmCancellation) {
      form.setError('confirmCancellation', {
        message: 'Please confirm both checkboxes to proceed with cancellation',
      });
      return;
    }

    try {
      await cancelSubscription.mutateAsync({
        organizationId: organization.organization.id,
        data: {
          reason: data.reason as CancellationReason,
          reasonDescription: data.reasonDescription,
          immediate: data.cancellationType === 'immediate',
          refundEnabled: data.cancellationType === 'immediate',
          retentionOffered: data.retentionOffered,
          retentionDetails: data.retentionDetails,
          effectiveDate: data.cancellationType === 'immediate' 
            ? new Date().toISOString()
            : currentSubscription?.endDate,
        },
      });
      onClose();
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
    }
  };

  const watchCancellationType = form.watch('cancellationType');
  const watchReason = form.watch('reason');
  const refundAmount = watchCancellationType === 'immediate' ? calculateRefundAmount() : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <BanIcon className="h-5 w-5" />
            Cancel Subscription
          </DialogTitle>
          <DialogDescription>
            We're sorry to see you go. Please help us understand why you're canceling.
          </DialogDescription>
        </DialogHeader>

        {/* Warning Alert */}
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangleIcon className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Important Notice</AlertTitle>
          <AlertDescription className="text-red-700">
            Canceling your subscription will:
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
              <li>Remove access to all premium features</li>
              <li>Limit your organization to free plan restrictions</li>
              <li>Potentially affect {usage?.gyms.current || 0} gym(s) and {usage?.clients.current || 0} client(s)</li>
              <li>Disable advanced reporting and analytics</li>
            </ul>
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Current Subscription Info */}
            {currentSubscription && currentPlan && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Current Subscription</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{currentPlan.name}</span>
                    <Badge variant="secondary">
                      {currentSubscription.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <div>
                      <span className="block font-medium">Price</span>
                      {formatCurrency(
                        currentPlan.price[organization.organization.currency] || 0,
                        organization.organization.currency
                      )}
                      /{currentPlan.billingFrequency}
                    </div>
                    <div>
                      <span className="block font-medium">Expires</span>
                      {formatDate(currentSubscription.endDate)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Cancellation Reason */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Why are you canceling? *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a reason" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {cancellationReasons.map((reason) => (
                        <SelectItem key={reason.value} value={reason.value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{reason.label}</span>
                            <span className="text-xs text-muted-foreground">
                              {reason.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Additional Details */}
            {watchReason && (
              <FormField
                control={form.control}
                name="reasonDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional details (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Please share any specific feedback that could help us improve..."
                        className="resize-none"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Your feedback helps us improve our service for other users
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Cancellation Type */}
            <FormField
              control={form.control}
              name="cancellationType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>When should the cancellation take effect?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="space-y-3"
                    >
                      <div className="flex items-start space-x-3">
                        <RadioGroupItem value="end_of_period" id="end_of_period" />
                        <div className="grid gap-1 flex-1">
                          <label htmlFor="end_of_period" className="font-medium cursor-pointer">
                            At end of billing period (Recommended)
                          </label>
                          <p className="text-sm text-muted-foreground">
                            Continue using the service until {currentSubscription ? formatDate(currentSubscription.endDate) : 'the end of your billing period'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <RadioGroupItem value="immediate" id="immediate" />
                        <div className="grid gap-1 flex-1">
                          <label htmlFor="immediate" className="font-medium cursor-pointer">
                            Immediately
                          </label>
                          <p className="text-sm text-muted-foreground">
                            Cancel now and receive a prorated refund for unused time
                          </p>
                        </div>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Refund Calculation for Immediate Cancellation */}
            {watchCancellationType === 'immediate' && refundAmount > 0 && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <DollarSignIcon className="h-4 w-4" />
                    Refund Calculation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Days remaining in period:</span>
                      <span className="font-medium">
                        {currentSubscription ? Math.max(0, Math.ceil((new Date(currentSubscription.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 0} days
                      </span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-semibold">
                      <span>Estimated refund:</span>
                      <span className="text-lg text-green-600">
                        {formatCurrency(refundAmount, organization.organization.currency)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Refunds are typically processed within 5-10 business days
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Retention Offer */}
            <FormField
              control={form.control}
              name="retentionOffered"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        setShowRetentionDetails(!!checked);
                      }}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="cursor-pointer">
                      I was offered a retention deal
                    </FormLabel>
                    <FormDescription>
                      Check this if support offered you a special deal to stay
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {/* Retention Details */}
            {showRetentionDetails && (
              <FormField
                control={form.control}
                name="retentionDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Retention offer details</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What was offered? (e.g., 20% discount, free month, etc.)"
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Data Loss Warning */}
            <Alert className="border-orange-200 bg-orange-50">
              <ShieldOffIcon className="h-4 w-4 text-orange-600" />
              <AlertTitle className="text-orange-800">Access & Data Notice</AlertTitle>
              <AlertDescription className="text-orange-700 text-sm">
                After cancellation:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Your data will be retained for 90 days</li>
                  <li>You can reactivate your subscription within this period</li>
                  <li>After 90 days, some data may be permanently deleted</li>
                  <li>Export your data before canceling if needed</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Confirmation Checkboxes */}
            <div className="space-y-3">
              <FormField
                control={form.control}
                name="confirmDataLoss"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="cursor-pointer">
                        I understand that I will lose access to premium features
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmCancellation"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="cursor-pointer">
                        I want to proceed with the cancellation
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <FormMessage />

            <DialogFooter>
              <Button variant="outline" onClick={onClose} disabled={cancelSubscription.isPending}>
                Keep Subscription
              </Button>
              <Button 
                type="submit" 
                variant="destructive"
                disabled={
                  cancelSubscription.isPending || 
                  !form.watch('confirmDataLoss') || 
                  !form.watch('confirmCancellation') ||
                  !form.watch('reason')
                }
              >
                {cancelSubscription.isPending ? 'Processing...' : 'Cancel Subscription'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}