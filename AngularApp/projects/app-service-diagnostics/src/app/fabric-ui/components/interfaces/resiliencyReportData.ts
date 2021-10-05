export interface IResiliencyReportData {
    /**
     * Used to receive data for generating the Resiliency Score report PDF
     *
     * @param customerName Name of the customer's company used to generate the report.
     * @param resiliencyResourceList Array of resources evaluated for Resiliency Report.
     */
    customerName:string;
    resiliencyResourceList: IResiliencyResource[];    
}

export interface IResiliencyResource {
     /**
     * Resource and all of the Resiliency Features evaluated to calculate the Resiliency Score
     *
     * @param name Name of the resource
     * @param overallScore Total score of the resource
     * @param resiliencyFeaturesList Array of all the resiliency features evaluated for this resource
     */
    name: string;
    overallScore: number;    
    resiliencyFeaturesList: IResiliencyFeature[];
}

export interface IResiliencyFeature {
    /**
     * Used to describe each Resiliency feature evaluated 
     *
     * @param name Name of the feature
     * @param featureWeight This defines whether the features is considered Mandatory, Important, Good to have or Not counted
     * @param resiliencyFeaturesList Array of all the resiliency features evaluated for this resource
     */
    name: String,
    featureWeight: Weight,
    implementationGrade: Grade,
    gradeComments: string;
    solutionComments: string;    

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