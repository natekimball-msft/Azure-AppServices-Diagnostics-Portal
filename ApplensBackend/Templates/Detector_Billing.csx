using System;
using System.Threading;

private static string GetQuery(OperationContext<ArmResource> cxt)
{
    return
    $@"
		let startTime = datetime({cxt.StartTime});
		let endTime = datetime({cxt.EndTime});
		YOUR_TABLE_NAME
		| where TIMESTAMP >= startTime and TIMESTAMP <= endTime
		YOUR_QUERY
	";
}


[ArmResourceFilter(provider: "Microsoft.Cost", resourceTypeName: "billing")]
[Definition(Id = "YOUR_DETECTOR_ID", Name = "", Author = "YOUR_ALIAS", Description = "")]
[ResourceRequired(Enforced=false)]
public async static Task<Response> Run(DataProviders dp, OperationContext<ArmResource> cxt, Response res)
{
    res.Dataset.Add(new DiagnosticData()
    {
        Table = await dp.Kusto.ExecuteClusterQuery(GetQuery(cxt), "KUSTO_CLUSTER_NAME", "KUSTO_DB_NAME", null, "GetQuery"),
        RenderingProperties = new Rendering(RenderingType.Table)
		{
            Title = "Sample Table", 
            Description = "Some description here"
        }
    });

    return res;
}
