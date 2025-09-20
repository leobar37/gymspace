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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  RefreshCwIcon,
  CalendarIcon,
  CheckCircleIcon,
  DollarSignIcon,
  InfoIcon,
  ClockIcon,
  AlertCircleIcon,
  TrendingUpIcon,
  CreditCardIcon,
} from 'lucide-react';
import { useRenewSubscription } from '../hooks/useSubscriptionOperations';
import {
  OrganizationSubscriptionDetailsDto,
  SubscriptionPlan,
} from '@gymspace/sdk';
import { formatCurrency, formatDate } from '@/lib/utils';

const formSchema = z.object({
  renewalType: z.enum(['same_plan', 'change_plan']),
  planId: z.string().optional(),
  duration: z.number().min(1).max(12).default(1),
  durationPeriod: z.enum(['MONTH', 'DAY']).default('MONTH'),
  effectiveDate: z.enum(['auto', 'custom']),
  customDate: z.string().optional(),
  extendCurrent: z.boolean().default(true),
});

type FormData = z.infer<typeof formSchema>;

interface RenewSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  organization: OrganizationSubscriptionDetailsDto;
  availablePlans: SubscriptionPlan[];
}

export function RenewSubscriptionModal({
  isOpen,
  onClose,
  organization,
  availablePlans,
}: RenewSubscriptionModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const renewSubscription = useRenewSubscription();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      renewalType: 'same_plan',
      duration: 1,
      durationPeriod: 'MONTH',
      effectiveDate: 'auto',
      extendCurrent: true,
    },
  });

  const currentPlan = organization.plan;
  const currentSubscription = organization.currentSubscription;
  const billing = organization.billing;

  // Check if renewal is allowed
  const canRenew = billing?.canRenew ?? false;
  const isInRenewalWindow = billing?.renewalWindow?.isActive ?? false;
  const daysUntilExpiration = currentSubscription?.daysUntilExpiration ?? 0;

  const watchRenewalType = form.watch('renewalType');
  const watchDuration = form.watch('duration');
  const watchDurationPeriod = form.watch('durationPeriod');
  const watchEffectiveDate = form.watch('effectiveDate');
  const watchPlanId = form.watch('planId');

  // Calculate renewal cost
  const calculateRenewalCost = () => {
    const plan = watchRenewalType === 'change_plan' && watchPlanId
      ? availablePlans.find(p => p.id === watchPlanId)
      : currentPlan;

    if (!plan) return 0;

    const basePrice = plan.price[organization.organization.currency] || 0;
    const multiplier = watchDurationPeriod === 'MONTH' ? watchDuration : watchDuration / 30;
    
    return basePrice * multiplier;
  };

  // Calculate new end date
  const calculateNewEndDate = () => {
    if (!currentSubscription) return null;
    
    const startDate = watchEffectiveDate === 'auto' 
      ? new Date(currentSubscription.endDate)
      : new Date(form.watch('customDate') || new Date());
    
    if (watchDurationPeriod === 'MONTH') {
      startDate.setMonth(startDate.getMonth() + watchDuration);
    } else {
      startDate.setDate(startDate.getDate() + watchDuration);
    }
    
    return startDate;
  };

  const onSubmit = async (data: FormData) => {
    try {
      const renewalData = {
        planId: data.renewalType === 'change_plan' ? data.planId : undefined,
        duration: data.duration,
        durationPeriod: data.durationPeriod,
        effectiveDate: data.effectiveDate === 'custom' ? data.customDate : undefined,
        extendCurrent: data.extendCurrent,
      };

      await renewSubscription.mutateAsync({
        organizationId: organization.organization.id,
        data: renewalData,
      });
      onClose();
    } catch (error) {
      console.error('Failed to renew subscription:', error);
    }
  };

  // Update selected plan when plan changes
  React.useEffect(() => {
    if (watchPlanId) {
      const plan = availablePlans.find(p => p.id === watchPlanId);
      setSelectedPlan(plan || null);
    } else {
      setSelectedPlan(null);
    }
  }, [watchPlanId, availablePlans]);

  const renewalCost = calculateRenewalCost();
  const newEndDate = calculateNewEndDate();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCwIcon className="h-5 w-5" />
            Renew Subscription
          </DialogTitle>
          <DialogDescription>
            Extend your subscription to continue enjoying all features
          </DialogDescription>
        </DialogHeader>

        {/* Renewal Status */}
        {currentSubscription && (
          <div className="space-y-3">
            {isInRenewalWindow ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircleIcon className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Renewal Window Open</AlertTitle>
                <AlertDescription className="text-green-700">
                  You can renew your subscription now. It expires in {daysUntilExpiration} days
                  on {formatDate(currentSubscription.endDate)}.
                </AlertDescription>
              </Alert>
            ) : daysUntilExpiration > 30 ? (
              <Alert>
                <ClockIcon className="h-4 w-4" />
                <AlertTitle>Early Renewal</AlertTitle>
                <AlertDescription>
                  Your subscription expires in {daysUntilExpiration} days. 
                  Early renewal will extend from your current end date.
                </AlertDescription>
              </Alert>
            ) : currentSubscription.isExpired ? (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircleIcon className="h-4 w-4 text-red-600" />
                <AlertTitle className="text-red-800">Subscription Expired</AlertTitle>
                <AlertDescription className="text-red-700">
                  Your subscription expired on {formatDate(currentSubscription.endDate)}.
                  Renewing will reactivate your account immediately.
                </AlertDescription>
              </Alert>
            ) : null}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Current Plan Info */}
            {currentPlan && currentSubscription && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Current Subscription</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{currentPlan.name}</span>
                    <Badge variant={currentSubscription.isExpired ? 'destructive' : 'secondary'}>
                      {currentSubscription.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                    <div>
                      <span className="block font-medium">Price</span>
                      {formatCurrency(
                        currentPlan.price[organization.organization.currency] || 0,
                        organization.organization.currency
                      )}
                      /{currentPlan.billingFrequency}
                    </div>
                    <div>
                      <span className="block font-medium">Started</span>
                      {formatDate(currentSubscription.startDate)}
                    </div>
                    <div>
                      <span className="block font-medium">Expires</span>
                      {formatDate(currentSubscription.endDate)}
                    </div>
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
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="space-y-3"
                    >
                      <div className="flex items-start space-x-3">
                        <RadioGroupItem value="same_plan" id="same_plan" />
                        <div className="grid gap-1 flex-1">
                          <label htmlFor="same_plan" className="font-medium cursor-pointer">
                            Renew with current plan
                          </label>
                          <p className="text-sm text-muted-foreground">
                            Continue with {currentPlan?.name} at the same price
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <RadioGroupItem value="change_plan" id="change_plan" />
                        <div className="grid gap-1 flex-1">
                          <label htmlFor="change_plan" className="font-medium cursor-pointer">
                            Change plan during renewal
                          </label>
                          <p className="text-sm text-muted-foreground">
                            Switch to a different plan with your renewal
                          </p>
                        </div>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Plan Selection (if changing plan) */}
            {watchRenewalType === 'change_plan' && (
              <FormField
                control={form.control}
                name="planId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select New Plan</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a plan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availablePlans
                          .filter(plan => plan.id !== currentPlan?.id)
                          .map((plan) => (
                            <SelectItem key={plan.id} value={plan.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{plan.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {formatCurrency(
                                    plan.price[organization.organization.currency] || 0,
                                    organization.organization.currency
                                  )}
                                  /{plan.billingFrequency} • {plan.maxGyms} gyms • {plan.maxClientsPerGym} clients/gym
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
            )}

            {/* Selected New Plan Details */}
            {selectedPlan && (
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUpIcon className="h-4 w-4" />
                    New Plan Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{selectedPlan.name}</span>
                    <Badge>New</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="block text-muted-foreground">Price</span>
                      <span className="font-medium">
                        {formatCurrency(
                          selectedPlan.price[organization.organization.currency] || 0,
                          organization.organization.currency
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="block text-muted-foreground">Gyms</span>
                      <span className="font-medium">{selectedPlan.maxGyms}</span>
                    </div>
                    <div>
                      <span className="block text-muted-foreground">Clients/Gym</span>
                      <span className="font-medium">{selectedPlan.maxClientsPerGym}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Renewal Duration */}
            <div className="space-y-4">
              <FormLabel>Renewal Duration</FormLabel>
              <div className="flex gap-4">
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={12}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="durationPeriod"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="MONTH">
                            {watchDuration === 1 ? 'Month' : 'Months'}
                          </SelectItem>
                          <SelectItem value="DAY">
                            {watchDuration === 1 ? 'Day' : 'Days'}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormDescription>
                Choose how long to extend your subscription
              </FormDescription>
            </div>

            {/* Effective Date */}
            <FormField
              control={form.control}
              name="effectiveDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="space-y-3"
                    >
                      <div className="flex items-start space-x-3">
                        <RadioGroupItem value="auto" id="auto" />
                        <div className="grid gap-1 flex-1">
                          <label htmlFor="auto" className="font-medium cursor-pointer">
                            Automatic
                          </label>
                          <p className="text-sm text-muted-foreground">
                            {currentSubscription?.isExpired 
                              ? 'Start immediately (subscription expired)'
                              : `Start after current period ends (${currentSubscription ? formatDate(currentSubscription.endDate) : 'N/A'})`
                            }
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <RadioGroupItem value="custom" id="custom" />
                        <div className="grid gap-1 flex-1">
                          <label htmlFor="custom" className="font-medium cursor-pointer">
                            Custom date
                          </label>
                          <p className="text-sm text-muted-foreground">
                            Choose a specific start date for the renewal
                          </p>
                        </div>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Custom Date Input */}
            {watchEffectiveDate === 'custom' && (
              <FormField
                control={form.control}
                name="customDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Start Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Select when the renewal should start
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Renewal Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CreditCardIcon className="h-4 w-4" />
                  Renewal Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="block text-muted-foreground">Plan</span>
                      <span className="font-medium">
                        {watchRenewalType === 'change_plan' && selectedPlan
                          ? selectedPlan.name
                          : currentPlan?.name || 'Current Plan'
                        }
                      </span>
                    </div>
                    <div>
                      <span className="block text-muted-foreground">Duration</span>
                      <span className="font-medium">
                        {watchDuration} {watchDurationPeriod.toLowerCase()}
                        {watchDuration > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">New expiry date:</span>
                      <span className="font-medium">
                        {newEndDate ? formatDate(newEndDate) : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Total cost:</span>
                      <span className="text-lg font-semibold text-primary">
                        {formatCurrency(renewalCost, organization.organization.currency)}
                      </span>
                    </div>
                  </div>

                  <Alert>
                    <InfoIcon className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      Payment will be processed using your saved payment method.
                      You can update it in billing settings if needed.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>

            <DialogFooter>
              <Button variant="outline" onClick={onClose} disabled={renewSubscription.isPending}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={
                  renewSubscription.isPending || 
                  (watchRenewalType === 'change_plan' && !watchPlanId) ||
                  !canRenew
                }
              >
                {renewSubscription.isPending ? 'Processing...' : 'Confirm Renewal'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}