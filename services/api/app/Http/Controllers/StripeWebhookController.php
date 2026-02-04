<?php

namespace App\Http\Controllers;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Stripe\Stripe;
use Stripe\Webhook;

//comment - this is the controller that handles the stripe webhook events
class StripeWebhookController extends Controller
{
    public function handleWebhook(Request $request)
    {
        Stripe::setApiKey(config('services.stripe.secret'));

        $endpoint_secret = config('services.stripe.webhook_secret');
        $payload         = @file_get_contents('php://input');
        $sig_header      = $_SERVER['HTTP_STRIPE_SIGNATURE'];

        try {
            $event = Webhook::constructEvent(
                $payload,
                $sig_header,
                $endpoint_secret,
            );
        } catch (\UnexpectedValueException $e) {
            Log::error('Invalid payload', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Invalid payload'], 400);
        } catch (\Stripe\Exception\SignatureVerificationException $e) {
            Log::error('Invalid signature', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Invalid signature'], 400);
        }

        Log::info('Webhook received', ['event' => $event->id]);
        // Handle the event
        switch ($event->type) {
            // Handles the event when a checkout session is completed successfully
            // or when an asynchronous payment for a checkout session is successful.
            case 'checkout.session.completed':
            case 'checkout.session.async_payment_succeeded':
                $this->fulfillCheckout($event->data->object->id);
                break;

                // Handles the event when an asynchronous payment for a checkout session fails.
            case 'checkout.session.async_payment_failed':
                $this->handleFailedPayment($event->data->object->id);
                break;

                // Handles the event when a subscription's invoice payment succeeds.
                // This is typically triggered during subscription renewals.
            case 'invoice.payment_succeeded':
                $this->handleInvoicePaymentSucceeded($event->data->object);
                break;

                // Handles the event when a subscription is updated.
                // This includes changes to the plan, quantity, etc.
            case 'customer.subscription.updated':
                $this->handleSubscriptionUpdated($event->data->object);
                break;

                // Handles the event when a subscription is canceled or deleted.
            case 'customer.subscription.deleted':
                $this->handleSubscriptionDeleted($event->data->object);
                break;

                // Logs unhandled events for debugging or further development.
            default:
                Log::info('Unhandled event type', ['type' => $event->type]);
                break;
        }

        return response()->json(['status' => 'success'], 200);
    }

    protected function fulfillCheckout($session_id)
    {
        // Log the fulfillment attempt
        Log::info("Fulfilling Checkout Session $session_id");

        // Make this function safe to run multiple times with the same session ID
        // Retrieve the Checkout Session from the API with line_items expanded
        $stripe           = new \Stripe\StripeClient(env('STRIPE_SECRET'));
        $checkout_session = $stripe->checkout->sessions->retrieve($session_id, [
            'expand' => ['line_items'],
        ]);

        // Check the Checkout Session's payment_status property to determine if fulfillment should be performed
        if ($checkout_session->payment_status != 'unpaid') {
            // Perform fulfillment of the line items
            $customerId = $checkout_session->customer;
            $user       = User::where('stripe_customer_id', $customerId)->first();
            if (! $user) {
                Log::warning(
                    "No user found for Stripe customer ID $customerId",
                );
                return;
            }

            $organization = Organization::find($user->last_organization_id);
            if ($organization) {
                // Calculate the total seats based on the quantity purchased
                $totalSeats = 0;
                foreach ($checkout_session->line_items->data as $item) {
                    $totalSeats += $item->quantity;
                }
                $organization->subscription_status   = 'active';
                $organization->subscription_end_date = now()->addMonth(); // Example for a 1-month subscription
                $organization->subscription_seats    = $totalSeats;
                $organization->save();
            }

            // Log fulfillment completion
            Log::info("Fulfillment completed for Checkout Session $session_id");
        } else {
            Log::warning(
                "Checkout Session $session_id has unpaid status, no fulfillment performed.",
            );
        }
    }

    protected function handleFailedPayment($session_id)
    {
        Log::warning("Payment failed for Checkout Session $session_id");
        // Implement any additional logic for failed payments (e.g., notifications)
    }

    protected function handleSubscriptionUpdated($subscription)
    {
        $customerId = $subscription->customer;
        $user       = User::where('stripe_customer_id', $customerId)->first();

        if (! $user) {
            Log::warning("No user found for Stripe customer ID $customerId");
            return;
        }

        $organization = Organization::find($user->last_organization_id);
        if ($organization) {
            // Update subscription seats and status based on the new subscription details
            $organization->subscription_seats  = $subscription->items->data[0]->quantity ?? 1;
            $organization->subscription_status = $subscription->status;
            $organization->save();

            Log::info("Subscription updated for customer $customerId");
        }
    }

    protected function handleSubscriptionDeleted($subscription)
    {
        $customerId = $subscription->customer;
        $user       = User::where('stripe_customer_id', $customerId)->first();

        if (! $user) {
            Log::warning("No user found for Stripe customer ID $customerId");
            return;
        }

        $organization = Organization::find($user->last_organization_id);
        if ($organization) {
            // Mark the subscription as canceled
            $organization->subscription_status = 'canceled';
            $organization->subscription_seats  = 0;
            $organization->save();

            Log::info("Subscription canceled for customer $customerId");
        }
    }

    // this is called everytime the invoice payment is paid (so probably every month)
    protected function handleInvoicePaymentSucceeded($invoice)
    {
        $subscription        = $invoice->subscription;
        $stripe              = new \Stripe\StripeClient(env('STRIPE_SECRET'));
        $subscriptionDetails = $stripe->subscriptions->retrieve(
            $subscription,
            [],
        );

        $customerId = $subscriptionDetails->customer;
        $user       = User::where('stripe_customer_id', $customerId)->first();
        if ($user) {
            $organization = Organization::find($user->last_organization_id);
            if ($organization) {
                $organization->subscription_end_date = now()->addMonth();
                $organization->save();
            }
        }
    }
}
