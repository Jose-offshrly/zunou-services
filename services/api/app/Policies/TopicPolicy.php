<?php

namespace App\Policies;

use App\Models\Pulse;
use App\Models\Topic;
use App\Models\TeamThread;
use App\Models\Thread;
use App\Models\User;
use GraphQL\Error\Error;

class TopicPolicy extends AbstractPolicy
{
    /**
     * Determine whether the user can view any topics.
     */
    public function viewAny(User $user, array $args): bool
    {
        return $user->hasPermission('read:topics') &&
            $user->hasOrganization($args['organizationId']);
    }

    /**
     * Determine whether the user can view a specific topic.
     */
    public function view(User $user, array $args, ?Topic $topic = null): bool
    {
        $topic = $this->loadModel($user, $args, Topic::class, $topic);
        if (!$topic) {
            return throw new Error('Topic not found!');
        }

        $entity = $this->getTopicEntity($topic);
        $pulseId = $this->getEntityPulseId($entity);
        $organizationId = $this->getEntityOrganizationId($entity);

        if ($pulseId) {
            $this->checkPulseMembership(
                user: $user,
                args: [
                    'pulse_id' => $pulseId,
                ],
                model: Pulse::class
            );
        }

        return $user->hasPermission('read:topics') &&
            $user->hasOrganization($organizationId);
    }

    /**
     * Determine whether the user can create topics.
     */
    public function create(User $user, array $args): bool
    {
        $input = $args['input'];
        $teamThreadId = $input['teamThreadId'] ?? null;

        if ($teamThreadId) {
            // Link to existing TeamThread
            $teamThread = TeamThread::find($teamThreadId);
            if (!$teamThread) {
                return throw new Error('Team thread not found!');
            }

            $this->checkPulseMembership(
                user: $user,
                args: [
                    'pulse_id' => $teamThread->pulse_id,
                ],
                model: Pulse::class
            );

            return $user->hasPermission('create:topics') &&
                $user->hasOrganization($teamThread->organization_id);
        } else {
            // Creating a Thread-based topic
            if (empty($input['organizationId']) || empty($input['pulseId'])) {
                return throw new Error(
                    'organizationId and pulseId are required when teamThreadId is not provided!'
                );
            }

            $this->checkPulseMembership(
                user: $user,
                args: [
                    'pulse_id' => $input['pulseId'],
                ],
                model: Pulse::class
            );

            return $user->hasPermission('create:topics') &&
                $user->hasOrganization($input['organizationId']);
        }
    }

    /**
     * Determine whether the user can update a specific topic.
     */
    public function update(User $user, array $args, ?Topic $topic = null): bool
    {
        $topic = $this->loadModel($user, $args['input'], Topic::class, $topic);
        if (!$topic) {
            return throw new Error('Topic not found!');
        }

        // Check if user created the topic
        if ($topic->created_by !== $user->id) {
            return throw new Error('You can only update topics you created!');
        }

        $entity = $this->getTopicEntity($topic);
        $pulseId = $this->getEntityPulseId($entity);
        $organizationId = $this->getEntityOrganizationId($entity);

        if ($pulseId) {
            $this->checkPulseMembership(
                user: $user,
                args: [
                    'pulse_id' => $pulseId,
                ],
                model: Pulse::class
            );
        }

        return $user->hasPermission('update:topics') &&
            $user->hasOrganization($organizationId);
    }

    /**
     * Determine whether the user can delete a specific topic.
     */
    public function delete(User $user, array $args, ?Topic $topic = null): bool
    {
        $topic = $this->loadModel($user, $args['input'], Topic::class, $topic);
        if (!$topic) {
            return throw new Error('Topic not found!');
        }

        // Check if user created the topic
        if ($topic->created_by !== $user->id) {
            return throw new Error('You can only delete topics you created!');
        }

        $entity = $this->getTopicEntity($topic);
        $pulseId = $this->getEntityPulseId($entity);
        $organizationId = $this->getEntityOrganizationId($entity);

        if ($pulseId) {
            $this->checkPulseMembership(
                user: $user,
                args: [
                    'pulse_id' => $pulseId,
                ],
                model: Pulse::class
            );
        }

        return $user->hasPermission('delete:topics') &&
            $user->hasOrganization($organizationId);
    }

    /**
     * Get the entity (TeamThread or Thread) associated with the topic.
     */
    private function getTopicEntity(Topic $topic)
    {
        if ($topic->entity_type === TeamThread::class && $topic->entity_id) {
            return TeamThread::find($topic->entity_id);
        }

        if ($topic->entity_type === Thread::class && $topic->entity_id) {
            return Thread::find($topic->entity_id);
        }

        return null;
    }

    /**
     * Get the pulse_id from the entity (TeamThread or Thread).
     */
    private function getEntityPulseId($entity): ?string
    {
        if (!$entity) {
            return null;
        }

        if ($entity instanceof TeamThread) {
            return $entity->pulse_id;
        }

        if ($entity instanceof Thread) {
            return $entity->pulse_id;
        }

        return null;
    }

    /**
     * Get the organization_id from the entity (TeamThread or Thread).
     */
    private function getEntityOrganizationId($entity): ?string
    {
        if (!$entity) {
            return null;
        }

        if ($entity instanceof TeamThread) {
            return $entity->organization_id;
        }

        if ($entity instanceof Thread) {
            return $entity->organization_id;
        }

        return null;
    }
}
