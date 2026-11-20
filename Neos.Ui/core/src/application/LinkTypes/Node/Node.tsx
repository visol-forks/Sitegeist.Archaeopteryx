/*
 * This script belongs to the package "Sitegeist.Archaeopteryx".
 *
 * This package is Open Source Software. For the full copyright and license
 * information, please view the LICENSE file which was distributed with this
 * source code.
 */
import React from "react";
import { useAsync } from "react-use";
import { SelectBox } from "@neos-project/react-ui-components";
import { Nullable } from "ts-toolbelt/out/Union/Nullable";
import { OptionalDeep } from "ts-toolbelt/out/Object/Optional";

import {
    useSiteNodeContextPath,
    useConfiguration,
    useI18n,
    useSelector,
    usePersonalWorkspaceName,
    useDimensionValues,
} from "@sitegeist/archaeopteryx-neos-bridge";
import { Tree } from "@sitegeist/archaeopteryx-custom-node-tree";

import { AnchorEditorProps, ILink, makeLinkType } from "../../../domain";
import { IconCard, IconLabel } from "../../../presentation";
import { Process, Field } from "../../../framework";
import { getAnchorTargets, getNodeSummary } from "../../../infrastructure/http";
import {isSuitableFor} from "./NodeSpecification";

type NodeLinkModel = {
    nodeId: string;
};
type NodeLinkOptions = {
    startingPoint: string;
    baseNodeType: string;
    loadingDepth: number;
    allowedNodeTypes: string[];
    anchorTargets: {
        nodeTypes: string[];
        anchorPattern: string;
    };
};

const DEFAULT_ANCHOR_PATTERN = "c{nodeAggregateId}";

const anchorForNode = (pattern: string, nodeAggregateId: string) =>
    pattern.split("{nodeAggregateId}").join(nodeAggregateId);

/** The anchor of a link: a separate option (dialog, inspector) or the fragment of its href (RTE) */
const anchorOfLink = (link: undefined | null | ILink): undefined | string =>
    link?.options?.anchor || link?.href?.split("#")[1] || undefined;

type AnchorTargetOption = {
    value: string;
    label: string;
    icon: string;
};

/** The anchor targets of a document as select box options, if the link type configures them */
function useAnchorTargets(
    documentNodeId: undefined | string,
    options: OptionalDeep<NodeLinkOptions>
): { loading: boolean; options: AnchorTargetOption[] } {
    const i18n = useI18n();
    const workspaceName = usePersonalWorkspaceName();
    const dimensionValues = useDimensionValues();
    const nodeTypes = (options.anchorTargets?.nodeTypes ?? []) as string[];
    const anchorPattern = options.anchorTargets?.anchorPattern ?? DEFAULT_ANCHOR_PATTERN;

    const fetch__anchorTargets = useAsync(async () => {
        if (!documentNodeId || !workspaceName || !dimensionValues || nodeTypes.length === 0) {
            return [];
        }
        const result = await getAnchorTargets({
            workspaceName,
            dimensionValues,
            documentNodeId,
            anchorTargetNodeTypes: nodeTypes,
        });

        return "success" in result ? result.success.anchorTargets : [];
    }, [documentNodeId, workspaceName, dimensionValues, nodeTypes.join(",")]);

    return {
        loading: fetch__anchorTargets.loading,
        options: (fetch__anchorTargets.value ?? []).map((anchorTarget, index) => ({
            value: anchorForNode(anchorPattern, anchorTarget.nodeAggregateIdentifier),
            label:
                anchorTarget.label ??
                i18n("Sitegeist.Archaeopteryx:LinkTypes.Node:anchorTargets.untitled", undefined, {
                    nodeType: anchorTarget.nodeTypeLabel,
                    position: String(index + 1),
                }),
            icon: anchorTarget.icon,
        })),
    };
}

const AnchorTargetSelect: React.FC<AnchorEditorProps<NodeLinkModel, NodeLinkOptions>> = (props) => {
    const i18n = useI18n();
    const documentNodeId = props.model?.nodeId ?? undefined;
    const anchorTargets = useAnchorTargets(documentNodeId, props.options);
    const options = [...anchorTargets.options];

    if (
        props.value &&
        !anchorTargets.loading &&
        !options.some((option) => option.value === props.value)
    ) {
        options.push({
            value: props.value,
            label: `#${props.value} (${i18n("Sitegeist.Archaeopteryx:LinkTypes.Node:anchorTargets.notFound")})`,
            icon: "exclamation-triangle",
        });
    }

    const placeholder = !documentNodeId
        ? i18n("Sitegeist.Archaeopteryx:LinkTypes.Node:anchorTargets.selectDocumentFirst")
        : anchorTargets.loading
            ? i18n("Sitegeist.Archaeopteryx:LinkTypes.Node:loadingPreview")
            : anchorTargets.options.length === 0
                ? i18n("Sitegeist.Archaeopteryx:LinkTypes.Node:anchorTargets.empty")
                : i18n("Sitegeist.Archaeopteryx:LinkTypes.Node:anchorTargets.placeholder");

    return (
        <SelectBox
            disabled={!documentNodeId || anchorTargets.loading || options.length === 0}
            allowEmpty={true}
            placeholder={placeholder}
            options={options}
            value={props.value ?? ""}
            onValueChange={(value: string) => props.onChange(value || undefined)}
            displaySearchBox={options.length > 10}
            threshold={10}
            noMatchesFoundLabel={i18n("Neos.Neos:Main:noMatchesFound")}
            searchBoxLeftToTypeLabel={i18n("Neos.Neos:Main:searchBoxLeftToType")}
        />
    );
};

const NodePreview: React.FC<{
    nodeId: string;
    anchor?: string;
    options: OptionalDeep<NodeLinkOptions>;
}> = (props) => {
    const i18n = useI18n();
    // Only fetched with an anchor: the preview shows the section's label instead of the raw anchor
    const anchorTargets = useAnchorTargets(props.anchor ? props.nodeId : undefined, props.options);
    const anchorLabel = props.anchor
        ? `#${anchorTargets.options.find((option) => option.value === props.anchor)?.label ?? props.anchor}`
        : null;
    const workspaceName = usePersonalWorkspaceName();
    const dimensionValues = useDimensionValues();
    const fetch__nodeSummary = useAsync(async () => {
        if (!workspaceName) {
            return null;
        }
        if (!dimensionValues) {
            return null;
        }
        const result = await getNodeSummary({
            workspaceName,
            dimensionValues,
            nodeId: props.nodeId,
        });

        if ("success" in result) {
            return result.success;
        }

        return null;
    }, [props.nodeId, workspaceName, dimensionValues]);
    const breadcrumbs = fetch__nodeSummary.value?.breadcrumbs
        .map(({ label }) => label)
        .join(" > ");

    if (fetch__nodeSummary.loading) {
        return (
            <IconCard
                icon="spinner"
                title={i18n("Sitegeist.Archaeopteryx:LinkTypes.Node:loadingPreview")}
                subTitle={`node://${props.nodeId}`}
            />
        );
    }

    return (
        <IconCard
            icon={fetch__nodeSummary.value?.icon ?? "ban"}
            title={
                fetch__nodeSummary.value?.label ??
                `[${i18n("Sitegeist.Archaeopteryx:LinkTypes.Node:labelOfNonExistingNode")}]`
            }
            // The anchor leads the second line, so it stays visible where the card is narrow (inspector)
            subTitle={[anchorLabel, breadcrumbs ?? `node://${props.nodeId}`].filter(Boolean).join(" · ")}
        />
    );
};

export const Node = makeLinkType<NodeLinkModel, NodeLinkOptions>(
    "Sitegeist.Archaeopteryx:Node",
    ({ createError }) => ({
        supportedLinkOptions: ["anchor", "title", "targetBlank", "relNofollow"],

        isSuitableFor,

        useResolvedModel: (link: ILink) => {
            const match = /node:\/\/([^#]*)(#.*)?/.exec(link.href);

            if (!match) {
                throw createError(`Cannot handle href "${link.href}".`);
            }

            const nodeId = match[1];

            return Process.success({ nodeId });
        },

        convertModelToLink: ({ nodeId }: NodeLinkModel) => ({
            href: `node://${nodeId}`,
        }),

        TabHeader: () => {
            const i18n = useI18n();

            return (
                <IconLabel icon="file">
                    {i18n("Sitegeist.Archaeopteryx:LinkTypes.Node:title")}
                </IconLabel>
            );
        },

        AnchorEditor: {
            isEnabledFor: (options) => Boolean(options.anchorTargets?.nodeTypes?.length),
            Editor: AnchorTargetSelect,
        },

        Preview: (props: { model: NodeLinkModel; link?: ILink; options: OptionalDeep<NodeLinkOptions> }) => {
            return (
                <NodePreview
                    nodeId={props.model.nodeId}
                    anchor={anchorOfLink(props.link)}
                    options={props.options ?? {}}
                />
            );
        },

        // eslint-disable-next-line max-len
        Editor: ({
            model,
            options,
        }: {
            model: Nullable<NodeLinkModel>;
            options: OptionalDeep<NodeLinkOptions>;
        }) => {
            const i18n = useI18n();
            const workspaceName = usePersonalWorkspaceName();
            const dimensionValues = useDimensionValues();
            const siteNodeContextPath = useSiteNodeContextPath();
            const defaultLoadingDepth =
                useConfiguration((c) => c.nodeTree?.loadingDepth) ?? 4;
            const initialSearchTerm =
                useSelector((state) => state.ui?.pageTree?.query) ?? "";
            const initialNarrowNodeTypeFilter =
                useSelector((state) => state.ui?.pageTree?.filterNodeType) ??
                "";
            const startingPoint = React.useMemo(
                () => options.startingPoint ?? siteNodeContextPath?.path,
                [options.startingPoint, siteNodeContextPath]
            );

            if (!startingPoint) {
                throw createError(
                    "Could not load node tree, because startingPoint could not be determined."
                );
            } else if (!workspaceName) {
                throw createError(
                    "Could not load node tree, because workspaceName could not be determined."
                );
            } else if (!dimensionValues) {
                throw createError(
                    "Could not load node tree, because dimensionValues could not be determined."
                );
            } else {
                return (
                    <Field<null | string>
                        name="nodeId"
                        initialValue={model?.nodeId}
                        // eslint-disable-next-line consistent-return
                        validate={(value) => {
                            if (!value) {
                                return i18n(
                                    "Sitegeist.Archaeopteryx:LinkTypes.Node:node.validation.required"
                                );
                            }
                        }}
                    >
                        {({ input }) => (
                            <Tree
                                initialSearchTerm={initialSearchTerm}
                                workspaceName={workspaceName}
                                dimensionValues={dimensionValues}
                                startingPoint={startingPoint}
                                loadingDepth={options.loadingDepth ?? defaultLoadingDepth}
                                baseNodeTypeFilter={options.baseNodeType ?? "Neos.Neos:Document"}
                                initialNarrowNodeTypeFilter={
                                    initialNarrowNodeTypeFilter
                                }
                                linkableNodeTypes={
                                    options.allowedNodeTypes as
                                        | undefined
                                        | string[]
                                }
                                selectedTreeNodeId={input.value ?? undefined}
                                options={{
                                    enableSearch: true,
                                    enableNodeTypeFilter: true,
                                }}
                                onSelect={(nodeId) => {
                                    input.onChange(nodeId);
                                }}
                            />
                        )}
                    </Field>
                );
            }
        },
    })
);
