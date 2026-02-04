<?php

namespace Tests\Unit;

use App\Services\Agents\Helpers\AgentConfig;
use PHPUnit\Framework\TestCase;

class AgentConfigTest extends TestCase
{
    public function test_it_returns_agent_model_or_default()
    {
        // Set environment values
        putenv('DATASOURCE_AGENT_MODEL=gpt-4o');
        putenv('OPENAI_REASONING_MODEL=gpt-4.1');

        $this->assertEquals('gpt-4o', AgentConfig::model('datasource')); // Should return specific model

        putenv('DATASOURCE_AGENT_MODEL'); // Unset specific model
        $this->assertEquals('gpt-4.1', AgentConfig::model('datasource'));
    }

    public function test_it_returns_tool_model_or_falls_back_to_agent_model()
    {
        putenv('OPENAI_REASONING_MODEL=gpt-4.1');
        putenv('DATASOURCE_AGENT_MODEL=gpt-4o');
        putenv('DATASOURCE_TOOL_QUERY_MODEL=gpt3.5-turbo');

        // Specific tool model should be returned
        $this->assertEquals(
            'gpt3.5-turbo',
            AgentConfig::toolModel('datasource', 'queryDataSource'),
        );

        // use agent model if tool model is not set
        putenv('DATASOURCE_TOOL_QUERY_MODEL');
        $this->assertEquals(
            'gpt-4o',
            AgentConfig::toolModel('datasource', 'queryDataSource'),
        );

        // use default model if agent model also not set
        putenv('DATASOURCE_AGENT_MODEL');
        $this->assertEquals(
            'gpt-4.1',
            AgentConfig::toolModel('datasource', 'queryDataSource'),
        );
    }
}
