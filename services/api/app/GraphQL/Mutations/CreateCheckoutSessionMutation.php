<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\User;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Stripe\Checkout\Session;
use Stripe\Customer;
use Stripe\Stripe;

final readonly class CreateCheckoutSessionMutation
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args)
    {
        Log::debug('CreateCheckoutSessionMutation', ['args' => $args]);
        Stripe::setApiKey(config('services.stripe.secret'));
        Log::debug('Stripe secret ok');
        try {
            $user = Auth::user();
            $user = User::where('id', $user->id)->first();
            Log::debug('User', ['user' => $user]);
            // Check if the user already has a Stripe customer ID
            if (empty($user->stripe_customer_id)) {
                Log::debug('Add NEW stripe customer id');
                // Create a new Stripe customer
                $customer = Customer::create([
                    'email' => $user->email,
                    'name'  => $user->name,
                ]);
                Log::debug('Customer ID: ' . $customer->id);
                // Save the Stripe customer ID in your database
                $user->update([
                    'stripe_customer_id' => $customer->id,
                ]);
            } else {
                Log::debug('Use EXISTING stripe customer id');

                // Use the existing customer ID
                $customer = Customer::retrieve($user->stripe_customer_id);
            }

            Log::debug('Customer', ['customer' => $customer]);

            // Get the organization ID, fallback to the first organization if last_organization_id is not set
            $organizationId = $user->last_organization_id;
            if (! $organizationId) {
                $organization = $user->organizations()->first();
                if ($organization) {
                    $organizationId = $organization->id;
                } else {
                    throw new Error(
                        'User does not belong to any organizations.',
                    );
                }
            }
            $request      = app('request');
            $dashboardUrl = $request->headers->get('Origin') ?:
                $request->headers->get('Referer');

            // Special case for localhost during development
            if ($dashboardUrl === 'http://localhost:5173') {
                $dashboardUrl = 'http://localhost:5173';
            } elseif (! $dashboardUrl) {
                // Fallback if neither Origin nor Referer is present
                $dashboardUrl = env('DEFAULT_DASHBOARD_URL');
            }

            Log::debug('Dashboard URL', ['url' => $dashboardUrl]);
            // Create the checkout session
            $checkout_session = Session::create([
                'customer'   => $customer->id,
                'line_items' => [
                    [
                        'price'               => $args['price_id'],
                        'quantity'            => $args['quantity'] ?? 1,
                        'adjustable_quantity' => [
                            'enabled' => true,
                            'minimum' => 1,
                            'maximum' => 100,
                        ],
                    ],
                ],
                'mode'        => 'subscription',
                'success_url' => $dashboardUrl .
                    '/organizations/' .
                    $organizationId .
                    '/billing-success',
                'cancel_url' => $dashboardUrl .
                    '/organizations/' .
                    $organizationId .
                    '/billing-cancel',
                'automatic_tax' => [
                    'enabled' => false,
                ],
            ]);

            return [
                'url' => $checkout_session->url,
            ];
        } catch (\Exception $e) {
            throw new Error(
                'Failed to create Stripe Checkout session: ' . $e->getMessage(),
            );
        }
    }
}
