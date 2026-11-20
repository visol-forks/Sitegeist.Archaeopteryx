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

use Neos\Flow\Annotations as Flow;

/**
 * @internal
 */
#[Flow\Proxy(false)]
final class AnchorTarget implements \JsonSerializable
{
    public function __construct(
        public readonly string $nodeAggregateIdentifier,
        public readonly string $nodeTypeName,
        public readonly string $nodeTypeLabel,
        public readonly string $icon,
        /** Null for a node without a title of its own */
        public readonly ?string $label,
    ) {
    }

    public function jsonSerialize(): mixed
    {
        return get_object_vars($this);
    }
}
