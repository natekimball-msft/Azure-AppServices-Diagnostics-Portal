import { Injectable } from "@angular/core";
import { Observable, of } from "rxjs";


@Injectable()
export class GenericUserSettingService {
    getExpandAnalysisCheckCard(): Observable<boolean> {
        return of(false);
    }
}