import { IResiliencyReportData, IResiliencyResource, IResiliencyFeature, Grade, Weight  } from "./interfaces/resiliencyreportdata";

export class ResiliencyReportData implements IResiliencyReportData {
    // Company or individual customer name
    customerName: string;

    // Use customerName to create an instance of this class
    constructor(customerName:string) {
        this.customerName = customerName
    }
    
    resiliencyResourceList: IResiliencyResource[];
}

export class ResiliencyResource implements IResiliencyResource{
    name: string;
    overallScore: number;
    resiliencyFeaturesList: IResiliencyFeature[];
}

export class ResiliencyFeature implements IResiliencyFeature {
    name: String;
    featureWeight: Weight;
    implementationGrade: Grade;
    gradeComments: string;
    solutionComments: string;    
}