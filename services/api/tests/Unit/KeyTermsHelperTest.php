<?php

namespace Tests\Unit;

use App\Helpers\KeyTermsHelper;
use Illuminate\Support\Collection;
use PHPUnit\Framework\TestCase;

class KeyTermsHelperTest extends TestCase
{
    /**
     * Test that MAX_KEYTERMS constant is set to 100.
     */
    public function test_max_keyterms_constant_is_100(): void
    {
        $this->assertEquals(100, KeyTermsHelper::MAX_KEYTERMS);
    }

    /**
     * Test extracting first name from a full name.
     */
    public function test_extract_first_name_from_full_name(): void
    {
        $this->assertEquals('John', KeyTermsHelper::extractFirstName('John Doe'));
        $this->assertEquals('Jane', KeyTermsHelper::extractFirstName('Jane Smith'));
        $this->assertEquals('Alice', KeyTermsHelper::extractFirstName('Alice'));
    }

    /**
     * Test extracting first name handles empty strings.
     */
    public function test_extract_first_name_handles_empty_string(): void
    {
        $this->assertEquals('', KeyTermsHelper::extractFirstName(''));
    }

    /**
     * Test extracting first name trims whitespace.
     */
    public function test_extract_first_name_trims_whitespace(): void
    {
        $this->assertEquals('John', KeyTermsHelper::extractFirstName('  John Doe  '));
        $this->assertEquals('Jane', KeyTermsHelper::extractFirstName("\tJane Smith\n"));
    }

    /**
     * Test extracting names returns both full name and first name.
     */
    public function test_extract_names_returns_full_and_first_name(): void
    {
        $names = KeyTermsHelper::extractNames('John Doe');

        $this->assertCount(2, $names);
        $this->assertEquals('John Doe', $names[0]);
        $this->assertEquals('John', $names[1]);
    }

    /**
     * Test extracting names from single word name.
     */
    public function test_extract_names_with_single_word_name(): void
    {
        $names = KeyTermsHelper::extractNames('Madonna');

        // Should only contain one unique value since full name equals first name
        $this->assertCount(2, $names);
        $this->assertEquals('Madonna', $names[0]);
        $this->assertEquals('Madonna', $names[1]);
    }

    /**
     * Test extracting names from empty string.
     */
    public function test_extract_names_handles_empty_string(): void
    {
        $names = KeyTermsHelper::extractNames('');

        $this->assertEmpty($names);
    }

    /**
     * Test fromAttendees with mock attendees.
     */
    public function test_from_attendees_extracts_names(): void
    {
        $attendees = $this->createMockAttendees([
            'John Doe',
            'Jane Smith',
            'Bob Wilson',
        ]);

        $keyterms = KeyTermsHelper::fromAttendees($attendees);

        $this->assertContains('John Doe', $keyterms);
        $this->assertContains('John', $keyterms);
        $this->assertContains('Jane Smith', $keyterms);
        $this->assertContains('Jane', $keyterms);
        $this->assertContains('Bob Wilson', $keyterms);
        $this->assertContains('Bob', $keyterms);
    }

    /**
     * Test fromAttendees removes duplicates.
     */
    public function test_from_attendees_removes_duplicates(): void
    {
        $attendees = $this->createMockAttendees([
            'John Doe',
            'John Smith', // Same first name as first attendee
            'Jane Doe',
        ]);

        $keyterms = KeyTermsHelper::fromAttendees($attendees);

        // Count occurrences of 'John' - should only appear once
        $johnCount = array_count_values($keyterms)['John'] ?? 0;
        $this->assertEquals(1, $johnCount);
    }

    /**
     * Test fromAttendees with empty collection.
     */
    public function test_from_attendees_handles_empty_collection(): void
    {
        $attendees = new Collection([]);
        $keyterms  = KeyTermsHelper::fromAttendees($attendees);

        $this->assertEmpty($keyterms);
    }

    /**
     * Test fromAttendees limits results to MAX_KEYTERMS.
     */
    public function test_from_attendees_limits_to_max_keyterms(): void
    {
        // Create 60 attendees (would generate 120 items without limit)
        $names     = array_map(fn ($i) => "User{$i} LastName{$i}", range(1, 60));
        $attendees = $this->createMockAttendees($names);

        $keyterms = KeyTermsHelper::fromAttendees($attendees);

        $this->assertLessThanOrEqual(KeyTermsHelper::MAX_KEYTERMS, count($keyterms));
    }

    /**
     * Test fromAttendees handles attendees with null names.
     */
    public function test_from_attendees_handles_null_names(): void
    {
        $attendees = $this->createMockAttendees([
            'John Doe',
            null,
            'Jane Smith',
        ]);

        $keyterms = KeyTermsHelper::fromAttendees($attendees);

        $this->assertContains('John Doe', $keyterms);
        $this->assertContains('Jane Smith', $keyterms);
        $this->assertNotContains('', $keyterms);
    }

    /**
     * Test fromAttendees returns re-indexed array.
     */
    public function test_from_attendees_returns_indexed_array(): void
    {
        $attendees = $this->createMockAttendees(['John Doe', 'Jane Smith']);
        $keyterms  = KeyTermsHelper::fromAttendees($attendees);

        // Check that keys are sequential starting from 0
        $this->assertEquals(array_keys($keyterms), range(0, count($keyterms) - 1));
    }

    /**
     * Create mock attendees collection for testing.
     *
     * @param  array<string|null>  $names
     * @return Collection
     */
    private function createMockAttendees(array $names): Collection
    {
        return collect($names)->map(function ($name) {
            $user     = new \stdClass();
            $user->name = $name;

            $attendee       = new \stdClass();
            $attendee->user = $user;

            return $attendee;
        });
    }
}

