'use client';

import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircleIcon,
  XCircleIcon,
  Loader2Icon,
  TrendingUpIcon,
  AlertTriangleIcon,
  CheckIcon,
} from 'lucide-react';
import { useOrganizationDetails } from '../hooks/useOrganizationDetails';
import { useSubscriptionPlans } from '../../subscription-plans/hooks/useSubscriptionPlans';
import { useSubscriptionUpgrade } from '../hooks/useSubscriptionUpgrade';
import { SubscriptionPlanDto } from '@gymspace/sdk';
import { formatCurrency } from '@/lib/utils';

interface SubscriptionUpgradeModalProps {
  organizationId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 'selection' | 'confirmation';

export function SubscriptionUpgradeModal({
  organizationId,
  isOpen,
  onOpenChange,
}: SubscriptionUpgradeModalProps) {
  const [step, setStep] = useState<Step>('selection');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');

  const { data: organization, isLoading: organizationLoading } = useOrganizationDetails(organizationId);
  const { data: plans, isLoading: plansLoading } = useSubscriptionPlans();
  const upgradeMutation = useSubscriptionUpgrade(organizationId);

  // Get current plan details
  const currentPlan = useMemo(() => {
    if (!organization?.subscription || !plans) return null;
    return plans.find(p => p.id === organization.subscription?.subscriptionPlanId);
  }, [organization, plans]);

  // Filter available upgrade plans (higher tier than current)
  const availablePlans = useMemo(() => {
    if (!plans || !currentPlan) return [];

    // Filter plans that are active and have higher limits than current
    return plans.filter(plan =>
      plan.isActive &&
      plan.id !== currentPlan.id &&
      (plan.maxGyms > currentPlan.maxGyms ||
       plan.maxClientsPerGym > currentPlan.maxClientsPerGym ||
       plan.maxUsersPerGym > currentPlan.maxUsersPerGym)
    );
  }, [plans, currentPlan]);

  const selectedPlan = availablePlans.find(p => p.id === selectedPlanId);

  const isLoading = organizationLoading || plansLoading;

  const handleUpgrade = async () => {
    if (!selectedPlanId) return;

    try {
      await upgradeMutation.mutateAsync({
        newSubscriptionPlanId: selectedPlanId,
        immediateUpgrade: true,
        notes: `Upgraded from ${currentPlan?.name} to ${selectedPlan?.name}`,
      });
      onOpenChange(false);
      // Reset state
      setStep('selection');
      setSelectedPlanId('');
    } catch (error) {
      // Error is handled by the mutation hook
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state
    setStep('selection');
    setSelectedPlanId('');
  };

  const renderPlanComparison = (plan: SubscriptionPlanDto) => {
    if (!currentPlan) return null;

    const improvements = [];
    if (plan.maxGyms > currentPlan.maxGyms) {
      improvements.push(`${plan.maxGyms - currentPlan.maxGyms} more gyms`);
    }
    if (plan.maxClientsPerGym > currentPlan.maxClientsPerGym) {
      improvements.push(`${plan.maxClientsPerGym - currentPlan.maxClientsPerGym} more clients per gym`);
    }
    if (plan.maxUsersPerGym > currentPlan.maxUsersPerGym) {
      improvements.push(`${plan.maxUsersPerGym - currentPlan.maxUsersPerGym} more users per gym`);
    }

    return improvements;
  };

  const renderSelectionStep = () => (
    <>
      <DialogHeader>
        <DialogTitle>Upgrade Subscription Plan</DialogTitle>
        <DialogDescription>
          Select a new plan for {organization?.name}. The upgrade will take effect immediately.
        </DialogDescription>
      </DialogHeader>

      <div className="py-4">
        {/* Current Plan Summary */}
        {currentPlan && (
          <Card className="mb-4 bg-muted/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">{currentPlan.name}</span>
                <Badge variant="secondary">Active</Badge>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>• {currentPlan.maxGyms} Gyms</div>
                <div>• {currentPlan.maxClientsPerGym} Clients per gym</div>
                <div>• {currentPlan.maxUsersPerGym} Users per gym</div>
                {currentPlan.price.PEN && (
                  <div className="font-medium mt-2">
                    {formatCurrency(currentPlan.price.PEN.value, 'PEN')}/month
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Available Plans */}
        <div className="space-y-4">
          <Label>Available Upgrade Options</Label>
          {availablePlans.length === 0 ? (
            <Alert>
              <AlertTriangleIcon className="h-4 w-4" />
              <AlertTitle>No upgrades available</AlertTitle>
              <AlertDescription>
                This organization is already on the highest available plan.
              </AlertDescription>
            </Alert>
          ) : (
            <RadioGroup value={selectedPlanId} onValueChange={setSelectedPlanId}>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {availablePlans.map((plan) => {
                    const improvements = renderPlanComparison(plan);
                    return (
                      <Card
                        key={plan.id}
                        className={`cursor-pointer transition-colors ${
                          selectedPlanId === plan.id ? 'border-primary' : ''
                        }`}
                        onClick={() => setSelectedPlanId(plan.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-3">
                            <RadioGroupItem value={plan.id} id={plan.id} className="mt-1" />
                            <div className="flex-1 space-y-2">
                              <Label htmlFor={plan.id} className="cursor-pointer">
                                <div className="flex items-center justify-between">
                                  <span className="text-base font-semibold">{plan.name}</span>
                                  {plan.price.PEN && (
                                    <span className="text-sm font-medium">
                                      {formatCurrency(plan.price.PEN.value, 'PEN')}/month
                                    </span>
                                  )}
                                </div>
                              </Label>
                              {plan.description && (
                                <p className="text-sm text-muted-foreground">{plan.description}</p>
                              )}
                              <div className="grid grid-cols-3 gap-2 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Gyms: </span>
                                  <span className="font-medium">{plan.maxGyms}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Clients/gym: </span>
                                  <span className="font-medium">{plan.maxClientsPerGym}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Users/gym: </span>
                                  <span className="font-medium">{plan.maxUsersPerGym}</span>
                                </div>
                              </div>
                              {improvements && improvements.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {improvements.map((improvement, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      <TrendingUpIcon className="h-3 w-3 mr-1" />
                                      {improvement}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              {/* Feature highlights */}
                              {plan.features && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {plan.features.prioritySupport && (
                                    <Badge variant="secondary" className="text-xs">
                                      Priority Support
                                    </Badge>
                                  )}
                                  {plan.features.advancedReporting && (
                                    <Badge variant="secondary" className="text-xs">
                                      Advanced Reporting
                                    </Badge>
                                  )}
                                  {plan.features.apiAccess && (
                                    <Badge variant="secondary" className="text-xs">
                                      API Access
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            </RadioGroup>
          )}
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          onClick={() => setStep('confirmation')}
          disabled={!selectedPlanId}
        >
          Continue
        </Button>
      </DialogFooter>
    </>
  );

  const renderConfirmationStep = () => (
    <>
      <DialogHeader>
        <DialogTitle>Confirm Subscription Upgrade</DialogTitle>
        <DialogDescription>
          Please review the upgrade details before confirming.
        </DialogDescription>
      </DialogHeader>

      <div className="py-4 space-y-4">
        <Alert>
          <AlertTriangleIcon className="h-4 w-4" />
          <AlertTitle>Important</AlertTitle>
          <AlertDescription>
            This upgrade will take effect immediately. The organization will be charged the new
            subscription rate starting from the next billing cycle.
          </AlertDescription>
        </Alert>

        {/* Upgrade Summary */}
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Organization</h4>
            <p className="text-sm text-muted-foreground">{organization?.name}</p>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Current Plan</h4>
              <Card className="border-muted">
                <CardContent className="p-3">
                  <p className="font-medium">{currentPlan?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {currentPlan?.price.PEN && formatCurrency(currentPlan.price.PEN.value, 'PEN')}/month
                  </p>
                </CardContent>
              </Card>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">New Plan</h4>
              <Card className="border-primary">
                <CardContent className="p-3">
                  <p className="font-medium">{selectedPlan?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedPlan?.price.PEN && formatCurrency(selectedPlan?.price.PEN.value, 'PEN')}/month
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator />

          {/* Changes Summary */}
          <div>
            <h4 className="text-sm font-medium mb-2">What changes with this upgrade:</h4>
            <ul className="space-y-2">
              {currentPlan && selectedPlan && (
                <>
                  {selectedPlan.maxGyms > currentPlan.maxGyms && (
                    <li className="flex items-center text-sm">
                      <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                      Gym limit increases from {currentPlan.maxGyms} to {selectedPlan.maxGyms}
                    </li>
                  )}
                  {selectedPlan.maxClientsPerGym > currentPlan.maxClientsPerGym && (
                    <li className="flex items-center text-sm">
                      <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                      Clients per gym increases from {currentPlan.maxClientsPerGym} to {selectedPlan.maxClientsPerGym}
                    </li>
                  )}
                  {selectedPlan.maxUsersPerGym > currentPlan.maxUsersPerGym && (
                    <li className="flex items-center text-sm">
                      <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                      Users per gym increases from {currentPlan.maxUsersPerGym} to {selectedPlan.maxUsersPerGym}
                    </li>
                  )}
                  {selectedPlan.features?.prioritySupport && !currentPlan.features?.prioritySupport && (
                    <li className="flex items-center text-sm">
                      <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                      Gain access to Priority Support
                    </li>
                  )}
                </>
              )}
            </ul>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={() => setStep('selection')} disabled={upgradeMutation.isPending}>
          Back
        </Button>
        <Button onClick={handleUpgrade} disabled={upgradeMutation.isPending}>
          {upgradeMutation.isPending && <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />}
          {upgradeMutation.isPending ? 'Upgrading...' : 'Confirm Upgrade'}
        </Button>
      </DialogFooter>
    </>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {step === 'selection' && renderSelectionStep()}
            {step === 'confirmation' && renderConfirmationStep()}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}