import { AthenaClient, StartQueryExecutionCommand, GetQueryExecutionCommand, GetQueryResultsCommand } from "@aws-sdk/client-athena";

const athena = new AthenaClient({ region: process.env.AWS_REGION || "us-east-1" });
const WORKGROUP = process.env.ATHENA_WORKGROUP || "claimguard-workgroup-dev";
const DATABASE = process.env.ATHENA_DATABASE || "claimguard_analytics_dev";

export async function runAnalyticsQuery(queryString: string) {
    try {
        const startRes = await athena.send(new StartQueryExecutionCommand({
            QueryString: queryString,
            QueryExecutionContext: { Database: DATABASE },
            WorkGroup: WORKGROUP
        }));

        const queryId = startRes.QueryExecutionId;
        console.log(`Athena Query Started: ${queryId}`);

        let status = "RUNNING";
        while (status === "RUNNING" || status === "QUEUED") {
            await new Promise(r => setTimeout(r, 2000));
            const statusRes = await athena.send(new GetQueryExecutionCommand({ QueryExecutionId: queryId }));
            status = statusRes.QueryExecution?.Status?.State || "FAILED";
        }

        if (status === "SUCCEEDED") {
            const results = await athena.send(new GetQueryResultsCommand({ QueryExecutionId: queryId }));
            return results.ResultSet;
        } else {
            throw new Error(`Query failed with status: ${status}`);
        }
    } catch (err) {
        console.error("Athena Analytics Error:", err);
        throw err;
    }
}

// Example query functions that can be used by the Admin Analytics Dashboard
export async function getRiskDistribution() {
    return runAnalyticsQuery("SELECT riskLevel, COUNT(*) as count FROM claims GROUP BY riskLevel");
}

export async function getProcessingTrends() {
    return runAnalyticsQuery("SELECT date_trunc('month', createdAt) as month, status, COUNT(*) FROM claims GROUP BY 1, 2 ORDER BY 1");
}
