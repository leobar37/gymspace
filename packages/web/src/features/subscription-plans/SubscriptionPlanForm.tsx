'use client';
import React, { useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Loader2Icon } from 'lucide-react';
import { SubscriptionPlanDto, CreateSubscriptionPlanDto, UpdateSubscriptionPlanDto } from '@gymspace/sdk';
import { useCreateSubscriptionPlan } from './hooks/useCreateSubscriptionPlan';
import { useUpdateSubscriptionPlan } from './hooks/useUpdateSubscriptionPlan';

const subscriptionPlanSchema = z.object({
  name: z.string().min(1, 'Plan name is required').max(100, 'Plan name is too long'),
  description: z.string().optional(),
  pricing: z.object({
    PEN: z.object({
      currency: z.literal('PEN'),
      value: z.number().min(0, 'Price must be positive'),
    }),
  }),
  billingFrequency: z.enum(['monthly', 'quarterly', 'yearly']),
  maxGyms: z.number().min(1, 'Must allow at least 1 gym'),
  maxClientsPerGym: z.number().min(1, 'Must allow at least 1 client'),
  maxUsersPerGym: z.number().min(1, 'Must allow at least 1 user'),
  features: z.object({
    prioritySupport: z.boolean(),
    advancedReporting: z.boolean().optional(),
    customBranding: z.boolean().optional(),
    apiAccess: z.boolean().optional(),
    multiLocation: z.boolean().optional(),
    dataExport: z.boolean().optional(),
  }),
  isActive: z.boolean(),
});

type FormData = z.infer<typeof subscriptionPlanSchema>;

interface SubscriptionPlanFormProps {
  plan?: SubscriptionPlanDto | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function SubscriptionPlanForm({
  plan,
  isOpen,
  onOpenChange,
  onSuccess,
}: SubscriptionPlanFormProps) {
  const createMutation = useCreateSubscriptionPlan();
  const updateMutation = useUpdateSubscriptionPlan();

  const isEditing = !!plan;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const form = useForm<FormData>({
    resolver: zodResolver(subscriptionPlanSchema),
    defaultValues: {
      name: '',
      description: '',
      pricing: {
        PEN: {
          currency: 'PEN' as const,
          value: 0,
        },
      },
      billingFrequency: 'monthly',
      maxGyms: 1,
      maxClientsPerGym: 100,
      maxUsersPerGym: 5,
      features: {
        prioritySupport: false,
        advancedReporting: false,
        customBranding: false,
        apiAccess: false,
        multiLocation: false,
        dataExport: false,
      },
      isActive: true,
    },
  });

  useEffect(() => {
    if (plan) {
      form.reset({
        name: plan.name,
        description: plan.description || '',
        pricing: {
          PEN: plan.price.PEN || { currency: 'PEN' as const, value: 0 },
        },
        billingFrequency: plan.billingFrequency as 'monthly' | 'quarterly' | 'yearly',
        maxGyms: plan.maxGyms,
        maxClientsPerGym: plan.maxClientsPerGym,
        maxUsersPerGym: plan.maxUsersPerGym,
        features: {
          prioritySupport: plan.features?.prioritySupport || false,
          advancedReporting: plan.features?.advancedReporting || false,
          customBranding: plan.features?.customBranding || false,
          apiAccess: plan.features?.apiAccess || false,
          multiLocation: plan.features?.multiLocation || false,
          dataExport: plan.features?.dataExport || false,
        },
        isActive: plan.isActive,
      });
    } else {
      form.reset();
    }
  }, [plan, form]);

  const onSubmit = async (data: FormData) => {
    try {
      const formattedData = {
        name: data.name,
        description: data.description,
        price: {
          PEN: data.pricing.PEN,
        },
        billingFrequency: data.billingFrequency,
        maxGyms: data.maxGyms,
        maxClientsPerGym: data.maxClientsPerGym,
        maxUsersPerGym: data.maxUsersPerGym,
        features: data.features,
        isActive: data.isActive,
      };

      if (isEditing) {
        await updateMutation.mutateAsync({
          id: plan.id,
          data: formattedData as UpdateSubscriptionPlanDto,
        });
      } else {
        await createMutation.mutateAsync(formattedData as CreateSubscriptionPlanDto);
      }

      onOpenChange(false);
      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Subscription Plan' : 'Create Subscription Plan'}
          </DialogTitle>
          <DialogDescription>
            Configure subscription plan settings, pricing, and limits
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plan Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Professional Plan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Active Status</FormLabel>
                      <FormDescription>
                        Enable this plan for new subscriptions
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
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the features and benefits of this plan..."
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Tabs defaultValue="pricing" className="w-full">
              <TabsList>
                <TabsTrigger value="pricing">Pricing</TabsTrigger>
                <TabsTrigger value="limits">Limits</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
              </TabsList>

              <TabsContent value="pricing" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="pricing.PEN.value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price (PEN)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Price in Peruvian Soles (S/)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="billingFrequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Billing Frequency</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="rounded-lg border p-4 bg-muted/50">
                  <Label>Additional Currencies</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Support for USD, COP, and MXN will be available in a future update.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="limits" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="maxGyms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Gyms</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormDescription>
                          Max number of gym locations
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxClientsPerGym"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Clients per Gym</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormDescription>
                          Client limit per location
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxUsersPerGym"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Users per Gym</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormDescription>
                          Staff user limit per location
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="features" className="space-y-4">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="features.prioritySupport"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Priority Support</FormLabel>
                          <FormDescription>
                            24/7 priority customer support
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

                  <FormField
                    control={form.control}
                    name="features.advancedReporting"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Advanced Reporting</FormLabel>
                          <FormDescription>
                            Access to advanced analytics and reports
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

                  <FormField
                    control={form.control}
                    name="features.customBranding"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Custom Branding</FormLabel>
                          <FormDescription>
                            Customize app with your brand colors and logo
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

                  <FormField
                    control={form.control}
                    name="features.apiAccess"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>API Access</FormLabel>
                          <FormDescription>
                            Access to REST API for custom integrations
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

                  <FormField
                    control={form.control}
                    name="features.multiLocation"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Multi-Location Support</FormLabel>
                          <FormDescription>
                            Manage multiple gym locations from one account
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

                  <FormField
                    control={form.control}
                    name="features.dataExport"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Data Export</FormLabel>
                          <FormDescription>
                            Export data in various formats (CSV, Excel, PDF)
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
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2Icon className="size-4 mr-2 animate-spin" />}
                {isSubmitting
                  ? isEditing
                    ? 'Updating...'
                    : 'Creating...'
                  : isEditing
                  ? 'Update Plan'
                  : 'Create Plan'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}