<?php

declare(strict_types=1);

namespace App\DataTransferObjects\Pulse;

use App\DataTransferObjects\DataSourceData;
use App\DataTransferObjects\StrategyData;
use App\Support\Attributes\MapTo;
use App\Support\Data;

final class PulsePipelineData extends Data
{
    public function __construct(
        public PulseData $pulse,

        /** @var StrategyData[]|null $strategies */
        #[MapTo(StrategyData::class)] public readonly ?array $strategies = null,

        /** @var PulseMemberData[]|null $members */
        #[MapTo(PulseMemberData::class)] public readonly ?array $members = null,

        /** @var DataSourceData[]|null $dataSources */
        #[
            MapTo(DataSourceData::class)
        ]
        public readonly ?array $dataSources = null,
    ) {
    }
}
