<?php

namespace App\Console\Commands;

use App\Models\OnboardingItem;
use App\Models\Organization;
use Illuminate\Console\Command;

class FixOnboardingItemsOrder extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'onboarding:fix-order';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fix the order of onboarding items for each organization that were added without an order';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        // Fetch all organizations
        $organizations = Organization::all();

        // Loop through each organization
        foreach ($organizations as $organization) {
            $this->info("Processing organization ID: {$organization->id}");

            // Fetch the onboarding items for the current organization where the order is not set
            $onboardingItems = OnboardingItem::where(
                'organization_id',
                $organization->id,
            )
                ->whereNull('order')
                ->orWhere('order', 0)
                ->orderBy('id', 'asc') // Order by ID or any other criteria
                ->get();

            // If no items are found, skip to the next organization
            if ($onboardingItems->isEmpty()) {
                $this->info(
                    "No onboarding items found for organization ID: {$organization->id}",
                );
                continue;
            }

            // Assign an incremental order value to each item
            foreach ($onboardingItems as $index => $item) {
                $item->order = $index + 1; // Start order from 1
                $item->save();
                $this->info(
                    "Updated item ID {$item->id} with order {$item->order}",
                );
            }

            $this->info(
                "Completed ordering for organization ID: {$organization->id}",
            );
        }

        $this->info(
            'Onboarding items order has been updated for all organizations.',
        );
        return 0;
    }
}
