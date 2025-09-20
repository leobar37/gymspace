'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { useCreatePlan } from '../hooks/useSubscriptionPlans';
import { CreatePlanDto } from '../types';

const planSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().optional(),
  type: z.enum(['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE', 'CUSTOM']),
  pricing: z.array(
    z.object({
      amount: z.number().min(0, 'Amount must be positive'),
      currency: z.string().min(3).max(3, 'Currency must be 3 characters'),
      interval: z.enum(['MONTHLY', 'YEARLY', 'ONE_TIME']).optional(),
    })
  ).min(1, 'At least one pricing option is required'),
  limits: z.object({
    gyms: z.number().min(-1, 'Use -1 for unlimited'),
    clients: z.number().min(-1, 'Use -1 for unlimited'),
    users: z.number().min(-1, 'Use -1 for unlimited'),
    storage: z.number().min(-1, 'Use -1 for unlimited').optional(),
  }),
  features: z.array(z.string()).min(1, 'At least one feature is required'),
  isPublic: z.boolean(),
});

type PlanFormValues = z.infer<typeof planSchema>;

interface CreatePlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreatePlanModal({ open, onOpenChange, onSuccess }: CreatePlanModalProps) {
  const createPlan = useCreatePlan();
  const [newFeature, setNewFeature] = React.useState('');
  const [pricingOptions, setPricingOptions] = React.useState([
    { amount: 0, currency: 'USD', interval: 'MONTHLY' as const }
  ]);

  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'STARTER',
      pricing: pricingOptions,
      limits: {
        gyms: 1,
        clients: 100,
        users: 5,
        storage: 5,
      },
      features: [],
      isPublic: true,
    },
  });

  const handleSubmit = async (values: PlanFormValues) => {
    try {
      await createPlan.mutateAsync(values as CreatePlanDto);
      form.reset();
      onSuccess?.();
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      const currentFeatures = form.getValues('features');
      form.setValue('features', [...currentFeatures, newFeature.trim()]);
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    const currentFeatures = form.getValues('features');
    form.setValue('features', currentFeatures.filter((_, i) => i !== index));
  };

  const updatePricing = (index: number, field: string, value: any) => {
    const newPricing = [...pricingOptions];
    newPricing[index] = { ...newPricing[index], [field]: value };
    setPricingOptions(newPricing);
    form.setValue('pricing', newPricing);
  };

  const addPricingOption = () => {
    const newPricing = [...pricingOptions, { amount: 0, currency: 'USD', interval: 'MONTHLY' as const }];
    setPricingOptions(newPricing);
    form.setValue('pricing', newPricing);
  };

  const removePricingOption = (index: number) => {
    const newPricing = pricingOptions.filter((_, i) => i !== index);
    setPricingOptions(newPricing);
    form.setValue('pricing', newPricing);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Subscription Plan</DialogTitle>
          <DialogDescription>
            Define a new subscription plan with pricing and limits
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plan Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Professional Plan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plan Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="FREE">Free</SelectItem>
                        <SelectItem value="STARTER">Starter</SelectItem>
                        <SelectItem value="PROFESSIONAL">Professional</SelectItem>
                        <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                        <SelectItem value="CUSTOM">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Perfect for established gyms..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Pricing Options */}
            <div>
              <FormLabel>Pricing Options</FormLabel>
              <div className="space-y-2 mt-2">
                {pricingOptions.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Amount"
                      value={option.amount}
                      onChange={(e) => updatePricing(index, 'amount', parseFloat(e.target.value) || 0)}
                      className="w-32"
                    />
                    <Input
                      placeholder="USD"
                      value={option.currency}
                      onChange={(e) => updatePricing(index, 'currency', e.target.value.toUpperCase())}
                      className="w-24"
                      maxLength={3}
                    />
                    <Select
                      value={option.interval}
                      onValueChange={(value) => updatePricing(index, 'interval', value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MONTHLY">Monthly</SelectItem>
                        <SelectItem value="YEARLY">Yearly</SelectItem>
                        <SelectItem value="ONE_TIME">One Time</SelectItem>
                      </SelectContent>
                    </Select>
                    {pricingOptions.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removePricingOption(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addPricingOption}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Pricing Option
                </Button>
              </div>
            </div>

            {/* Limits */}
            <div>
              <FormLabel>Plan Limits</FormLabel>
              <FormDescription>Use -1 for unlimited</FormDescription>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <FormField
                  control={form.control}
                  name="limits.gyms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gyms</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="limits.clients"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Clients</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="limits.users"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Users</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="limits.storage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Storage (GB)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Features */}
            <div>
              <FormLabel>Features</FormLabel>
              <div className="space-y-2 mt-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a feature..."
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                  />
                  <Button type="button" onClick={addFeature}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.watch('features').map((feature, index) => (
                    <Badge key={index} variant="secondary" className="py-1">
                      {feature}
                      <button
                        type="button"
                        onClick={() => removeFeature(index)}
                        className="ml-2"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="isPublic"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel>Public Plan</FormLabel>
                    <FormDescription>
                      Make this plan visible to all organizations
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createPlan.isPending}>
                {createPlan.isPending ? 'Creating...' : 'Create Plan'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}