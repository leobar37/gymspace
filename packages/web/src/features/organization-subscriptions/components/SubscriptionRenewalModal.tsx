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
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  CalendarIcon,
  RefreshCwIcon,
  Loader2Icon,
  InfoIcon,
  CreditCardIcon,
} from 'lucide-react';
import { useOrganizationDetails } from '../hooks/useOrganizationDetails';
import { useSubscriptionPlans } from '../../subscription-plans/hooks/useSubscriptionPlans';
import { useSubscriptionRenewal } from '../hooks/useSubscriptionRenewal';
import { format, addMonths } from 'date-fns';
import { formatCurrency } from '@/lib/utils';

const renewalSchema = z.object({
  renewalType: z.enum(['same', 'change']),
  subscriptionPlanId: z.string().optional(),
  durationMonths: z.number().min(1).max(12),
  notes: z.string().optional(),
});

type RenewalFormData = z.infer<typeof renewalSchema>;

interface SubscriptionRenewalModalProps {
  organizationId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubscriptionRenewalModal({
  organizationId,
  isOpen,
  onOpenChange,
}: SubscriptionRenewalModalProps) {
  const [changePlan, setChangePlan] = useState(false);

  const { data: organization, isLoading: organizationLoading } = useOrganizationDetails(organizationId);
  const { data: plans, isLoading: plansLoading } = useSubscriptionPlans();
  const renewalMutation = useSubscriptionRenewal(organizationId);

  const form = useForm<RenewalFormData>({
    resolver: zodResolver(renewalSchema),
    defaultValues: {
      renewalType: 'same',
      durationMonths: 1,
      notes: '',
    },
  });

  const isLoading = organizationLoading || plansLoading;

  // Get current plan details
  const currentPlan = plans?.find(p => p.id === organization?.subscription?.subscriptionPlanId);

  // Get active plans for selection
  const activePlans = plans?.filter(p => p.isActive) || [];

  const selectedPlanId = form.watch('subscriptionPlanId');
  const durationMonths = form.watch('durationMonths');
  const renewalType = form.watch('renewalType');

  // Calculate renewal details
  const selectedPlan = renewalType === 'change' && selectedPlanId
    ? activePlans.find(p => p.id === selectedPlanId)
    : currentPlan;

  const renewalEndDate = organization?.subscription?.endDate
    ? addMonths(new Date(organization.subscription.endDate), durationMonths)
    : addMonths(new Date(), durationMonths);

  const totalCost = selectedPlan?.price.PEN
    ? selectedPlan.price.PEN.value * durationMonths
    : 0;

  const handleSubmit = async (data: RenewalFormData) => {
    try {
      await renewalMutation.mutateAsync({
        subscriptionPlanId: data.renewalType === 'change' ? data.subscriptionPlanId : undefined,
        durationMonths: data.durationMonths,
        notes: data.notes,
      });
      onOpenChange(false);
      form.reset();
      setChangePlan(false);
    } catch (error) {
      // Error is handled by the mutation hook
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    form.reset();
    setChangePlan(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Renew Subscription</DialogTitle>
          <DialogDescription>
            Renew the subscription for {organization?.name}. Choose to continue with the current plan or switch to a different one.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Current Subscription Info */}
              {currentPlan && organization?.subscription && (
                <Card className="bg-muted/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Current Subscription</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{currentPlan.name}</span>
                      <Badge variant={organization.subscription.isExpired ? 'destructive' : 'secondary'}>
                        {organization.subscription.isExpired ? 'Expired' : 'Active'}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-3 w-3" />
                        Expires: {format(new Date(organization.subscription.endDate), 'PPP')}
                      </div>
                      {currentPlan.price.PEN && (
                        <div className="flex items-center gap-2">
                          <CreditCardIcon className="h-3 w-3" />
                          {formatCurrency(currentPlan.price.PEN.value, 'PEN')}/month
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Renewal Type */}
              <FormField
                control={form.control}
                name="renewalType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Renewal Option</FormLabel>
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          setChangePlan(value === 'change');
                          if (value === 'same') {
                            form.setValue('subscriptionPlanId', undefined);
                          }
                        }}
                      >
                        <div className="space-y-3">
                          <Card className={field.value === 'same' ? 'border-primary' : ''}>
                            <CardContent className="p-4">
                              <div className="flex items-start space-x-3">
                                <RadioGroupItem value="same" id="same" className="mt-1" />
                                <div className="flex-1">
                                  <Label htmlFor="same" className="cursor-pointer">
                                    <div className="font-medium">Continue with current plan</div>
                                    <div className="text-sm text-muted-foreground mt-1">
                                      Renew with the same plan: {currentPlan?.name}
                                    </div>
                                  </Label>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          <Card className={field.value === 'change' ? 'border-primary' : ''}>
                            <CardContent className="p-4">
                              <div className="flex items-start space-x-3">
                                <RadioGroupItem value="change" id="change" className="mt-1" />
                                <div className="flex-1">
                                  <Label htmlFor="change" className="cursor-pointer">
                                    <div className="font-medium">Switch to a different plan</div>
                                    <div className="text-sm text-muted-foreground mt-1">
                                      Choose a new plan for the renewal period
                                    </div>
                                  </Label>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Plan Selection (if changing) */}
              {changePlan && (
                <FormField
                  control={form.control}
                  name="subscriptionPlanId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select New Plan</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a plan" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {activePlans.map((plan) => (
                            <SelectItem key={plan.id} value={plan.id}>
                              <div className="flex items-center justify-between w-full">
                                <span>{plan.name}</span>
                                {plan.price.PEN && (
                                  <span className="text-sm text-muted-foreground ml-2">
                                    {formatCurrency(plan.price.PEN.value, 'PEN')}/month
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select the plan to apply for the renewal period
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Duration */}
              <FormField
                control={form.control}
                name="durationMonths"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Renewal Duration</FormLabel>
                    <Select
                      value={field.value.toString()}
                      onValueChange={(value) => field.onChange(parseInt(value))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">1 month</SelectItem>
                        <SelectItem value="3">3 months</SelectItem>
                        <SelectItem value="6">6 months</SelectItem>
                        <SelectItem value="12">12 months</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the duration for the subscription renewal
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any notes about this renewal..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Internal notes about this renewal
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Renewal Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Renewal Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Plan:</span>
                      <p className="font-medium">{selectedPlan?.name || 'Select a plan'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Duration:</span>
                      <p className="font-medium">{durationMonths} month(s)</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">New End Date:</span>
                      <p className="font-medium">{format(renewalEndDate, 'PPP')}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Cost:</span>
                      <p className="font-medium text-primary">
                        {formatCurrency(totalCost, 'PEN')}
                      </p>
                    </div>
                  </div>

                  {selectedPlan && changePlan && currentPlan && selectedPlan.id !== currentPlan.id && (
                    <Alert>
                      <InfoIcon className="h-4 w-4" />
                      <AlertTitle>Plan Change</AlertTitle>
                      <AlertDescription>
                        The organization will switch from "{currentPlan.name}" to "{selectedPlan.name}" upon renewal.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={renewalMutation.isPending || (!selectedPlanId && changePlan)}>
                  {renewalMutation.isPending && <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />}
                  {renewalMutation.isPending ? 'Processing...' : 'Confirm Renewal'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}