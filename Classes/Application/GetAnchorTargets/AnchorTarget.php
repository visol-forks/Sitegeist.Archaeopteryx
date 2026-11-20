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

#[Flow\Proxy(false)]
final class AnchorTarget implements \JsonSerializable
{
    public function __construct(
        public readonly string $nodeAggregateIdentifier,
        public readonly string $nodeTypeName,
        public readonly string $icon,
        public readonly string $label,
        public readonly bool $isHidden,
    ) {
    }

    public function jsonSerialize(): mixed
    {
        return get_object_vars($this);
    }
}
