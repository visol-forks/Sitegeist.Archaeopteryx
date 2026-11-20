/*
 * This script belongs to the package "Sitegeist.Archaeopteryx".
 *
 * This package is Open Source Software. For the full copyright and license
 * information, please view the LICENSE file which was distributed with this
 * source code.
 */
import { fetchWithErrorHandling } from "@sitegeist/archaeopteryx-neos-bridge";

export type AnchorTargetDTO = {
    nodeAggregateIdentifier: string;
    nodeTypeName: string;
    icon: string;
    label: string;
    isHidden: boolean;
};

type GetAnchorTargetsQuery = {
    workspaceName: string;
    dimensionValues: Record<string, string[]>;
    documentNodeId: string;
    anchorTargetNodeTypes: string[];
    signal?: AbortSignal;
};

type GetAnchorTargetsQueryResultEnvelope =
    | {
          success: {
              anchorTargets: AnchorTargetDTO[];
          };
      }
    | {
          error: {
              type: string;
              code: number;
              message: string;
          };
      };

export async function getAnchorTargets(
    query: GetAnchorTargetsQuery
): Promise<GetAnchorTargetsQueryResultEnvelope> {
    const searchParams = new URLSearchParams();

    searchParams.set("workspaceName", query.workspaceName);
    for (const [dimensionName, fallbackChain] of Object.entries(
        query.dimensionValues
    )) {
        for (const fallbackValue of fallbackChain) {
            searchParams.append(
                `dimensionValues[${dimensionName}][]`,
                fallbackValue
            );
        }
    }
    searchParams.set("documentNodeId", query.documentNodeId);
    for (const nodeType of query.anchorTargetNodeTypes) {
        searchParams.append("anchorTargetNodeTypes[]", nodeType);
    }

    try {
        const response = await fetchWithErrorHandling.withCsrfToken(
            (csrfToken) => ({
                url:
                    "/neos/archaeopteryx/get-anchor-targets?" +
                    searchParams.toString(),
                method: "GET",
                credentials: "include",
                headers: {
                    "X-Flow-Csrftoken": csrfToken,
                    "Content-Type": "application/json",
                },
                signal: query.signal,
            })
        );

        return fetchWithErrorHandling.parseJson(response);
    } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
            throw error;
        }
        fetchWithErrorHandling.generalErrorHandler(error as any);
        throw error;
    }
}
