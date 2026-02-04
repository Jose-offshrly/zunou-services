<?php

namespace App\Console\Commands;

use App\Models\OnboardingItem;
use App\Models\Organization;
use Illuminate\Console\Command;

class AddFourthOnboardingItem extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'onboarding:add-fourth-item';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Add a new onboarding item as the fourth item for each organization';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        // Fetch all organizations
        $organizations = Organization::all();

        foreach ($organizations as $organization) {
            $this->info('Processing organization ID: ' . $organization->id);

            // Shift existing items downwards from order 4 onwards for this organization
            OnboardingItem::where('organization_id', $organization->id)
                ->where('order', '>=', 4)
                ->orderBy('order', 'desc') // Reverse order to prevent conflicts while shifting
                ->each(function ($item) {
                    $item->order = (int) ($item->order + 1);
                    $item->save();
                });

            // Now insert the new item at order 4 for this organization
            OnboardingItem::create([
                'organization_id' => $organization->id,
                'description'     => 'Company values',
                'category'        => 'Introduction',
                'order'           => (int) 4,
            ]);

            $this->info(
                'New onboarding item added as the fourth item for organization ID: ' .
                    $organization->id,
            );
        }

        $this->info('All organizations processed successfully.');

        return 0;
    }
}
