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

use Neos\ContentRepository\Domain\Model\Node;
use Neos\Flow\Annotations as Flow;
use Neos\Flow\I18n\EelHelper\TranslationHelper;
use Neos\Neos\Domain\Service\ContentContextFactory;
use Sitegeist\Archaeopteryx\Application\Shared\NodeWasNotFound;

/**
 * @internal
 */
#[Flow\Scope("singleton")]
final class GetAnchorTargetsQueryHandler
{
    #[Flow\Inject]
    protected ContentContextFactory $contentContextFactory;

    #[Flow\Inject]
    protected TranslationHelper $translationHelper;

    public function handle(GetAnchorTargetsQuery $query): GetAnchorTargetsQueryResult
    {
        $contentContext = $this->contentContextFactory->create([
            'workspaceName' => $query->workspaceName,
            'dimensions' => $query->dimensionValues,
            'targetDimensions' => $query->getTargetDimensionValues(),
            'invisibleContentShown' => true,
            'removedContentShown' => false,
            'inaccessibleContentShown' => true
        ]);

        $documentNode = $contentContext->getNodeByIdentifier((string) $query->documentNodeId);
        if (!$documentNode instanceof Node) {
            throw NodeWasNotFound::becauseNodeWithGivenIdentifierDoesNotExistInContext(
                nodeAggregateIdentifier: $query->documentNodeId,
                contentContext: $contentContext,
            );
        }

        $items = [];
        $this->collectAnchorTargets($documentNode, $query, $items);

        return new GetAnchorTargetsQueryResult(
            anchorTargets: new AnchorTargets(...$items),
        );
    }

    /**
     * Walks the content below the given node in document order, without descending into child documents.
     * Invisible nodes and everything below them are skipped: the frontend does not render them.
     *
     * @param AnchorTarget[] $items
     */
    private function collectAnchorTargets(Node $parentNode, GetAnchorTargetsQuery $query, array &$items): void
    {
        foreach ($parentNode->findChildNodes() as $childNode) {
            if (
                !$childNode instanceof Node
                || $childNode->getNodeType()->isOfType('Neos.Neos:Document')
                || !$childNode->isVisible()
            ) {
                continue;
            }

            if ($query->anchorTargetNodeTypes->includesSuperTypeOf($childNode->getNodeType())) {
                $nodeTypeLabel = $this->nodeTypeLabel($childNode);
                $label = self::plainLabel($childNode);

                $items[] = new AnchorTarget(
                    nodeAggregateIdentifier: (string) $childNode->getNodeAggregateIdentifier(),
                    nodeTypeName: $childNode->getNodeType()->getName(),
                    nodeTypeLabel: $nodeTypeLabel,
                    icon: $childNode->getNodeType()->getConfiguration('ui.icon') ?? 'questionmark',
                    // Without a title, Neos labels a node with its node type label
                    label: $label !== '' && $label !== $nodeTypeLabel ? $label : null,
                );
            }

            $this->collectAnchorTargets($childNode, $query, $items);
        }
    }

    private function nodeTypeLabel(Node $node): string
    {
        $label = $this->translationHelper->translate($node->getNodeType()->getLabel());

        return is_string($label) && $label !== '' ? $label : $node->getNodeType()->getName();
    }

    private static function plainLabel(Node $node): string
    {
        return trim(html_entity_decode(strip_tags($node->getLabel()), ENT_QUOTES | ENT_HTML5));
    }
}
