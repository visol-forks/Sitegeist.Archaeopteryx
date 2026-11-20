<?php

/*
 * This script belongs to the package "Sitegeist.Archaeopteryx".
 *
 * This package is Open Source Software. For the full copyright and license
 * information, please view the LICENSE file which was distributed with this
 * source code.
 */

declare(strict_types=1);

namespace Sitegeist\Archaeopteryx\Application\GetAnchorTargets;

use Neos\ContentRepository\Domain\NodeAggregate\NodeAggregateIdentifier;
use Neos\Flow\Annotations as Flow;
use Sitegeist\Archaeopteryx\Application\Shared\NodeTypeNames;

/**
 * @internal
 */
#[Flow\Proxy(false)]
final class GetAnchorTargetsQuery
{
    /**
     * @param array<string,string[]> $dimensionValues
     */
    public function __construct(
        public readonly string $workspaceName,
        public readonly array $dimensionValues,
        public readonly NodeAggregateIdentifier $documentNodeId,
        public readonly NodeTypeNames $anchorTargetNodeTypes,
    ) {
    }

    /**
     * @param array<string,mixed> $array
     */
    public static function fromArray(array $array): self
    {
        isset($array['workspaceName'])
            or throw new \InvalidArgumentException('Workspace name must be set');
        is_string($array['workspaceName'])
            or throw new \InvalidArgumentException('Workspace name must be a string');

        isset($array['documentNodeId'])
            or throw new \InvalidArgumentException('Document node id must be set');
        is_string($array['documentNodeId'])
            or throw new \InvalidArgumentException('Document node id must be a string');

        // An empty list would match every node type, so it is rejected
        isset($array['anchorTargetNodeTypes']) && is_array($array['anchorTargetNodeTypes'])
            && $array['anchorTargetNodeTypes'] !== []
            or throw new \InvalidArgumentException('Anchor target node types must be a non-empty array');

        return new self(
            workspaceName: $array['workspaceName'],
            dimensionValues: $array['dimensionValues'] ?? [],
            documentNodeId: NodeAggregateIdentifier::fromString($array['documentNodeId']),
            anchorTargetNodeTypes: NodeTypeNames::fromArray($array['anchorTargetNodeTypes']),
        );
    }

    /**
     * @return array<string,string>
     */
    public function getTargetDimensionValues(): array
    {
        $result = [];

        foreach ($this->dimensionValues as $dimensionName => $fallbackChain) {
            $result[$dimensionName] = $fallbackChain[0] ?? '';
        }

        return $result;
    }
}
