<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class PulseMemberSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $pulseId = '2fd01c1f-c723-48f4-934e-5da345a5ebc1';
        $members = [
            // "Jose" => [
            //     "name" => "Jose Sarmiento",
            //     "role" => "AI Developer",
            //     "description" => "Builds and integrates AI-driven solutions using large language models and automation tools.",
            //     "responsibilities" => [
            //         "Build AI-powered features",
            //         "Integrate third-party APIs",
            //         "Design prompt workflows",
            //         "Maintain AI agents",
            //     ],
            // ],
            'Jason' => [
                'name'             => 'Jason Chua',
                'role'             => 'Frontend Developer',
                'description'      => 'Develops and maintains the user interface across web applications.',
                'responsibilities' => [
                    'Build responsive UI',
                    'Optimize frontend performance',
                    'Implement design systems',
                    'Maintain code quality',
                ],
            ],
            'Michael' => [
                'name'             => 'Michael Makiling',
                'role'             => 'Frontend Developer',
                'description'      => 'Implements frontend components and user-facing features.',
                'responsibilities' => [
                    'Develop user interfaces',
                    'Collaborate with designers',
                    'Ensure mobile responsiveness',
                    'Refactor legacy components',
                ],
            ],
            'Clarence' => [
                'name'             => 'Clarence Coronel',
                'role'             => 'Frontend Developer',
                'description'      => 'Works on frontend features and supports cross-browser compatibility.',
                'responsibilities' => [
                    'Code interactive UI',
                    'Debug layout issues',
                    'Implement UI updates',
                    'Support accessibility features',
                ],
            ],
            'Jerome' => [
                'name'             => 'Jerome Gutierrez',
                'role'             => 'Fullstack Developer',
                'description'      => 'Handles both backend and frontend tasks to support end-to-end development.',
                'responsibilities' => [
                    'Develop fullstack features',
                    'Integrate APIs and services',
                    'Write database queries',
                    'Maintain system architecture',
                ],
            ],
            'Kyle' => [
                'name'             => 'Kyle Castillon',
                'role'             => 'Backend Developer',
                'description'      => 'Develops and maintains server-side logic and infrastructure.',
                'responsibilities' => [
                    'Build backend APIs',
                    'Manage database models',
                    'Handle authentication flows',
                    'Optimize backend performance',
                ],
            ],
            'Tyrone' => [
                'name'             => 'Tyrone Nagaño',
                'role'             => 'Backend Developer',
                'description'      => 'Focuses on scalable backend systems and API design.',
                'responsibilities' => [
                    'Write backend logic',
                    'Integrate external APIs',
                    'Improve system performance',
                    'Maintain backend tests',
                ],
            ],
            'Jerico' => [
                'name'             => 'Jerico Pira',
                'role'             => 'QA Tester',
                'description'      => 'Ensures product quality through structured testing and validation.',
                'responsibilities' => [
                    'Write test cases',
                    'Perform manual testing',
                    'Log and track bugs',
                    'Verify feature releases',
                ],
            ],
            'Esson' => [
                'name'             => 'John Ericksson Manuzon',
                'role'             => 'Project Manager',
                'description'      => 'Oversees project planning, timelines, and team coordination.',
                'responsibilities' => [
                    'Manage project timelines',
                    'Coordinate with teams',
                    'Track deliverables',
                    'Communicate with stakeholders',
                ],
            ],
        ];

        foreach ($members as $member) {
            $user = User::factory()->create([
                'name'  => $member['name'],
                'email' => strtolower(str_replace(' ', '.', $member['name'])) .
                    '@zunou.com',
                'password' => bcrypt('password'),
            ]);

            \App\Models\PulseMember::create([
                'pulse_id'         => $pulseId,
                'user_id'          => $user->id,
                'role'             => 'OWNER',
                'job_description'  => $member['description']      ?? null,
                'responsibilities' => $member['responsibilities'] ?? null,
            ]);
        }
    }
}
