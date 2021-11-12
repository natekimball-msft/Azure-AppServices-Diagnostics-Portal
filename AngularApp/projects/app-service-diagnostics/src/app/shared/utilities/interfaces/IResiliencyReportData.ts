export interface IResiliencyReportData {
    /**
     * Used to receive data for generating the Resiliency Score report PDF
     *
     * @param CustomerName Name of the customer's company used to generate the report.
     * @param ResiliencyResourceList Array of resources evaluated for Resiliency Report.
     */
    CustomerName:string;
    ResiliencyResourceList: IResiliencyResource[];    
}

export interface IResiliencyResource {
     /**
     * Resource and all of the Resiliency Features evaluated to calculate the Resiliency Score
     *
     * @param Name Name of the resource
     * @param OverallScore Total score of the resource
     * @param ResiliencyFeaturesList Array of all the resiliency features evaluated for this resource
     */
    Name: string;
    OverallScore: number;    
    ResiliencyFeaturesList: IResiliencyFeature[];
}

export interface IResiliencyFeature {
    /**
     * Used to describe each Resiliency feature evaluated 
     *
     * @param Name Name of the feature
     * @param FeatureWeight This defines whether the features is considered Mandatory, Important, Good to have or Not counted
     * @param ResiliencyFeaturesList Array of all the resiliency features evaluated for this resource
     */
    Name: string,
    FeatureWeight: Weight,
    ImplementationGrade: Grade,
    GradeComments: string;
    SolutionComments: string;    

}

export enum Weight {
    /**
     * Used to describe the weight of each feature:
     * NotCounted: A feature that could help improve resiliency but its use depends on whether customer's resource can use it or not.
     * GoodToHave: Features that are recommended to have and that it will improve resiliency but are not critical.
     * Important: Used for features that will provide resiliency in case of specific situations that won't happen as often.
     * Mandatory: Without implementing this feature, the resource most likely will have downtime.
     */
    NotCounted = 0,
    GoodToHave = 1,
    Important = 5,
    Mandatory = 25,
}

export enum Grade {
    Implemented = 2,
    PartiallyImplemented = 1,
    NotImplemented = 0
}