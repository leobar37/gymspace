'use client';
import React, { useEffect, useState } from 'react';
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
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertCircleIcon,
  ArrowRightIcon,
  CalculatorIcon,
  CheckCircleIcon,
  InfoIcon,
  TrendingUpIcon,
  AlertTriangleIcon,
  DollarSignIcon,
} from 'lucide-react';
import { usePlanChange, useCalculateProration } from '../hooks/useSubscriptionOperations';
import {
  OrganizationSubscriptionDetailsDto,
  SubscriptionPlan,
  ProrationResponseDto,
} from '@gymspace/sdk';
import { formatCurrency } from '@/lib/utils';

const formSchema = z.object({
  newPlanId: z.string().min(1, 'Please select a plan'),
  effectiveDate: z.enum(['immediate', 'end_of_period']),
  prorationEnabled: z.boolean().default(true),
});

type FormData = z.infer<typeof formSchema>;

interface UpgradeSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  organization: OrganizationSubscriptionDetailsDto;
  availablePlans: SubscriptionPlan[];
}

export function UpgradeSubscriptionModal({
  isOpen,
  onClose,
  organization,
  availablePlans,
}: UpgradeSubscriptionModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [proration, setProration] = useState<ProrationResponseDto | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  
  const { executePlanChange, calculateProration, isLoading } = usePlanChange();
  const calculateProrationMutation = useCalculateProration();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newPlanId: '',
      effectiveDate: 'immediate',
      prorationEnabled: true,
    },
  });

  const currentPlan = organization.plan;
  const currentSubscription = organization.currentSubscription;
  const usage = organization.usage;

  // Filter plans that are upgrades (higher tier)
  const upgradePlans = availablePlans.filter(plan => {
    if (!currentPlan) return true;
    const currentPrice = currentPlan.price[organization.organization.currency] || 0;
    const planPrice = plan.price[organization.organization.currency] || 0;
    return planPrice > currentPrice && plan.id !== currentPlan.id;
  });

  // Calculate proration when plan or effective date changes
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (value.newPlanId && value.effectiveDate) {
        handleProrationCalculation(value.newPlanId, value.effectiveDate);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleProrationCalculation = async (planId: string, effectiveDate: string) => {
    setIsCalculating(true);
    try {
      const result = await calculateProrationMutation.mutateAsync({
        organizationId: organization.organization.id,
        data: {
          newPlanId: planId,
          effectiveDate: effectiveDate === 'immediate' ? new Date().toISOString() : undefined,
        },
      });
      setProration(result);
      
      const plan = upgradePlans.find(p => p.id === planId);
      setSelectedPlan(plan || null);
    } catch (error) {
      console.error('Failed to calculate proration:', error);
      setProration(null);
    } finally {
      setIsCalculating(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!currentPlan || !selectedPlan) return;

    try {
      await executePlanChange(
        organization.organization.id,
        currentPlan.price[organization.organization.currency] || 0,
        selectedPlan.price[organization.organization.currency] || 0,
        {
          newPlanId: data.newPlanId,
          immediate: data.effectiveDate === 'immediate',
          prorationEnabled: data.prorationEnabled,
          effectiveDate: data.effectiveDate === 'immediate' 
            ? new Date().toISOString() 
            : currentSubscription?.endDate,
        }
      );
      onClose();
    } catch (error) {
      console.error('Failed to upgrade subscription:', error);
    }
  };

  // Check usage warnings
  const getUsageWarnings = (plan: SubscriptionPlan) => {
    const warnings = [];
    if (usage) {
      if (usage.gyms.current > plan.maxGyms) {
        warnings.push(`Current gyms (${usage.gyms.current}) exceeds plan limit (${plan.maxGyms})`);
      }
      if (usage.clients.current > plan.maxClientsPerGym * usage.gyms.current) {
        warnings.push(`Client usage may exceed new plan limits`);
      }
      if (usage.collaborators.current > plan.maxUsersPerGym * usage.gyms.current) {
        warnings.push(`Collaborator usage may exceed new plan limits`);
      }
    }
    return warnings;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUpIcon className="h-5 w-5" />
            Upgrade Subscription
          </DialogTitle>
          <DialogDescription>
            Upgrade your subscription to unlock more features and higher limits
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Current Plan Summary */}
            {currentPlan && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">{currentPlan.name}</span>
                    <Badge variant="secondary">Active</Badge>
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
                      <span className="block font-medium">Gyms</span>
                      {usage?.gyms.current || 0} / {currentPlan.maxGyms}
                    </div>
                    <div>
                      <span className="block font-medium">Clients/Gym</span>
                      {currentPlan.maxClientsPerGym}
                    </div>
                  </div>
                  {currentSubscription && (
                    <div className="pt-2 text-xs text-muted-foreground">
                      Expires: {new Date(currentSubscription.endDate).toLocaleDateString()}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Plan Selection */}
            <FormField
              control={form.control}
              name="newPlanId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select New Plan</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an upgrade plan" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {upgradePlans.map((plan) => (
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

            {/* Selected Plan Details */}
            {selectedPlan && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    New Plan Details
                    <ArrowRightIcon className="h-4 w-4" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">{selectedPlan.name}</span>
                    <Badge variant="default">Upgrade</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="block font-medium text-muted-foreground">Price</span>
                      <span className="text-lg font-semibold text-primary">
                        {formatCurrency(
                          selectedPlan.price[organization.organization.currency] || 0,
                          organization.organization.currency
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground">/{selectedPlan.billingFrequency}</span>
                    </div>
                    <div>
                      <span className="block font-medium text-muted-foreground">Gyms</span>
                      <span className="text-lg font-semibold">{selectedPlan.maxGyms}</span>
                    </div>
                    <div>
                      <span className="block font-medium text-muted-foreground">Clients/Gym</span>
                      <span className="text-lg font-semibold">{selectedPlan.maxClientsPerGym}</span>
                    </div>
                  </div>

                  {/* Usage Warnings */}
                  {getUsageWarnings(selectedPlan).length > 0 && (
                    <Alert className="border-orange-200 bg-orange-50">
                      <AlertTriangleIcon className="h-4 w-4 text-orange-600" />
                      <AlertTitle className="text-orange-800">Usage Warning</AlertTitle>
                      <AlertDescription className="text-orange-700">
                        <ul className="list-disc list-inside space-y-1 mt-2">
                          {getUsageWarnings(selectedPlan).map((warning, idx) => (
                            <li key={idx} className="text-sm">{warning}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Effective Date Selection */}
            <FormField
              control={form.control}
              name="effectiveDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>When should the upgrade take effect?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="space-y-3"
                    >
                      <div className="flex items-start space-x-3">
                        <RadioGroupItem value="immediate" id="immediate" />
                        <div className="grid gap-1">
                          <label htmlFor="immediate" className="font-medium cursor-pointer">
                            Immediately
                          </label>
                          <p className="text-sm text-muted-foreground">
                            Upgrade takes effect now with proration for unused time
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <RadioGroupItem value="end_of_period" id="end_of_period" />
                        <div className="grid gap-1">
                          <label htmlFor="end_of_period" className="font-medium cursor-pointer">
                            At end of current period
                          </label>
                          <p className="text-sm text-muted-foreground">
                            Upgrade takes effect on {currentSubscription ? new Date(currentSubscription.endDate).toLocaleDateString() : 'renewal date'}
                          </p>
                        </div>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Proration Calculation */}
            {proration && form.watch('effectiveDate') === 'immediate' && (
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <CalculatorIcon className="h-4 w-4" />
                    Proration Calculation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Remaining days in current period:</span>
                      <span className="font-medium">{proration.remainingDays} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Unused credit from current plan:</span>
                      <span className="font-medium text-green-600">
                        +{formatCurrency(proration.creditAmount, proration.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>New plan charge (prorated):</span>
                      <span className="font-medium text-red-600">
                        -{formatCurrency(proration.chargeAmount, proration.currency)}
                      </span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-semibold">
                      <span>Amount due today:</span>
                      <span className="text-lg">
                        {proration.netAmount >= 0 
                          ? formatCurrency(proration.netAmount, proration.currency)
                          : `Credit: ${formatCurrency(Math.abs(proration.netAmount), proration.currency)}`
                        }
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {proration.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Loading State for Calculation */}
            {isCalculating && (
              <Card>
                <CardContent className="py-6">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || !form.watch('newPlanId')}>
                {isLoading ? 'Processing...' : 'Confirm Upgrade'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}